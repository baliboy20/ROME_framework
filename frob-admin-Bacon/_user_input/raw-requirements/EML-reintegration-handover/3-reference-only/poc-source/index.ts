// Cloudflare Workers entry point — full E2E POC. Not product code (see TC Disposal note).
// Derived from EML.md v0.8 (all REQ-EML01-16). Routes prefixed /api/mock/* stand in for
// EXTERNAL modules (booking, payment provider, pre-sales, email routing) — never EML's
// own build scope, present here only so workflows are walkable end-to-end.

import { Env, resolveRecipients, renderTemplate, classifyRefund, dispatch, categorise, sendThreadReply, maybeSendEnquiryAcknowledgement, getOperatorSettings } from "./lib";
import PostalMime from "postal-mime";

interface AssetsEnv extends Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}
function err(message: string, status = 400): Response {
  return json({ error: message }, status);
}
function money(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export default {
  async fetch(request: Request, env: AssetsEnv): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // Everything under /api/* is handled below by this Worker. Everything else (the React
    // + Ionic frontend, built via frontend/) is served as a static asset — see
    // wrangler.toml's [assets] block. This fallback only matters if a request somehow
    // reaches the Worker without a matching static file (Cloudflare normally serves
    // matching assets before invoking the Worker at all).
    if (!pathname.startsWith("/api/")) {
      return env.ASSETS.fetch(request);
    }

    // ============ EML real build: A1 Templates (REQ-EML10) ============
    if (pathname === "/api/templates" && method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM email_templates ORDER BY use_case, created_at").all();
      return json(results);
    }
    if (pathname === "/api/templates" && method === "POST") {
      const body = await request.json<any>().catch(() => ({}));
      if (!body.useCase) return err("use-case required");
      const id = `tpl-${crypto.randomUUID().slice(0, 8)}`;
      await env.DB.prepare("INSERT INTO email_templates (id, use_case, status, content, created_at) VALUES (?, ?, 'draft', ?, ?)")
        .bind(id, body.useCase, body.content ?? "", new Date().toISOString()).run();
      return json({ ok: true, id });
    }
    const publishMatch = pathname.match(/^\/api\/templates\/([^/]+)\/publish$/);
    if (publishMatch && method === "POST") {
      const id = publishMatch[1];
      const template = await env.DB.prepare("SELECT * FROM email_templates WHERE id = ?").bind(id).first<any>();
      if (!template) return err("Template not found", 404);
      if (!template.content || String(template.content).trim() === "") {
        return err("Complete all required fields before publishing");
      }
      await env.DB.prepare("UPDATE email_templates SET status = 'retired', retired_at = ? WHERE use_case = ? AND status = 'active' AND id != ?")
        .bind(new Date().toISOString(), template.use_case, id).run();
      await env.DB.prepare("UPDATE email_templates SET status = 'active', published_at = ? WHERE id = ?")
        .bind(new Date().toISOString(), id).run();
      return json({ ok: true });
    }
    const templateByIdMatch = pathname.match(/^\/api\/templates\/([^/]+)$/);
    if (templateByIdMatch && method === "PATCH") {
      const id = templateByIdMatch[1];
      const body = await request.json<any>().catch(() => ({}));
      const template = await env.DB.prepare("SELECT * FROM email_templates WHERE id = ?").bind(id).first<any>();
      if (!template) return err("Template not found", 404);
      await env.DB.prepare("UPDATE email_templates SET content = ? WHERE id = ?").bind(body.content ?? "", id).run();
      return json({ ok: true });
    }
    if (templateByIdMatch && method === "DELETE") {
      const id = templateByIdMatch[1];
      const template = await env.DB.prepare("SELECT * FROM email_templates WHERE id = ?").bind(id).first<any>();
      if (!template) return err("Template not found", 404);
      if (template.status === "active") return err("Retire or replace the active template before deleting it");
      await env.DB.prepare("DELETE FROM email_templates WHERE id = ?").bind(id).run();
      return json({ ok: true });
    }

    // ============ EML real build: A2 Cancellation Review + Approval (REQ-EML04) ============
    // DR-16: the cutoff is Owner-configurable (Settings), not a fixed 24hr constant.
    if (pathname === "/api/cancellations" && method === "GET") {
      const settings = await getOperatorSettings(env);
      const { results } = await env.DB.prepare(
        `SELECT cr.*, b.tour_name, b.party_leader_name, b.amount_paid_pence, b.deposit_pence
         FROM cancellation_requests cr JOIN bookings b ON b.id = cr.booking_id ORDER BY cr.resolved, cr.id`
      ).all<any>();
      const withOutcome = results.map((r: any) => ({
        ...r,
        refund_cutoff_hours: settings.refund_cutoff_hours,
        refund_outcome: r.hours_until_departure >= settings.refund_cutoff_hours
          ? `>=${settings.refund_cutoff_hours}hrs — full refund minus deposit = ${money(r.amount_paid_pence - r.deposit_pence)}`
          : `<${settings.refund_cutoff_hours}hrs — no automatic calculation; enter the refund amount yourself`,
      }));
      return json(withOutcome);
    }
    const approveMatch = pathname.match(/^\/api\/cancellations\/([^/]+)\/approve$/);
    if (approveMatch && method === "POST") {
      const id = approveMatch[1];
      const body = await request.json<any>().catch(() => ({}));
      const cr = await env.DB.prepare("SELECT * FROM cancellation_requests WHERE id = ?").bind(id).first<any>();
      if (!cr) return err("Request not found", 404);
      if (cr.resolved) return err("This request has already been resolved");
      const booking = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?").bind(cr.booking_id).first<any>();
      const settings = await getOperatorSettings(env);
      const outcome = classifyRefund(cr.hours_until_departure, booking.amount_paid_pence, booking.deposit_pence, settings.refund_cutoff_hours, body.manualRefundPence);
      if (outcome.kind === "awaiting_manual_decision") {
        return err(`Inside the ${settings.refund_cutoff_hours}hr cutoff — enter the refund amount yourself before approving`);
      }
      await env.DB.prepare("UPDATE cancellation_requests SET resolved = 1, refund_kind = ?, refund_pence = ? WHERE id = ?")
        .bind(outcome.kind, outcome.refundPence, id).run();
      await env.DB.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").bind(booking.id).run();
      const refundLine = `Refund: ${money(outcome.refundPence!)}.`;
      const dispatchResult = await dispatch(env, {
        useCase: "cancellation_approved",
        bookingId: booking.id,
        vars: { first_name: booking.party_leader_name, tour_name: booking.tour_name, refund_line: refundLine },
      });
      return json({ ok: true, outcome, dispatch: dispatchResult });
    }

    // ============ EML real build: A3 Company-Cancellation (REQ-EML05) ============
    // DR-16: which remediation (refund/rebook/credit) is offered is Owner-configurable (Settings),
    // not hardcoded to "always full refund" — folds in reintegration finding F3.
    if (pathname === "/api/company-cancellations" && method === "POST") {
      const body = await request.json<any>().catch(() => ({}));
      if (!body.explanation || String(body.explanation).trim() === "") {
        return err("Add an explanation before sending");
      }
      const settings = await getOperatorSettings(env);
      const remediationType = body.remediationType ?? settings.cancellation_remediation_options[0];
      if (!settings.cancellation_remediation_options.includes(remediationType)) {
        return err(`"${remediationType}" is not one of the enabled remediation options — check Settings`);
      }
      const booking = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?").bind(body.bookingId).first<any>();
      if (!booking) return err("Booking not found", 404);
      const ebId = `eb-${crypto.randomUUID().slice(0, 8)}`;
      await env.DB.prepare("INSERT INTO explanation_blocks (id, text, created_at) VALUES (?, ?, ?)")
        .bind(ebId, body.explanation, new Date().toISOString()).run();
      const discountCode = `REBOOK-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      const remedyLine: Record<string, string> = {
        refund: `A full refund of the amount paid, plus a discount code for a future booking: ${discountCode}.`,
        rebook: `We'd like to help you rebook for another date, plus a discount code: ${discountCode}.`,
        credit: `Account credit toward a future booking, plus a discount code: ${discountCode}.`,
      };
      await env.DB.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").bind(booking.id).run();
      const dispatchResult = await dispatch(env, {
        useCase: "company_cancellation",
        bookingId: booking.id,
        explanationBlockId: ebId,
        vars: { first_name: booking.party_leader_name, tour_name: booking.tour_name, explanation: body.explanation, remedy_line: remedyLine[remediationType] },
      });
      return json({ ok: true, discountCode, remediationType, dispatch: dispatchResult });
    }

    // ============ EML real build: A4 Enquiry-Reply (REQ-EML09) ============
    if (pathname === "/api/enquiries" && method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM enquiries WHERE replied = 0 ORDER BY id").all();
      return json(results);
    }
    // REQ-EML18/DR-15: the auto-acknowledge toggle (single-row settings, resolves D-EML-5).
    if (pathname === "/api/settings" && method === "GET") {
      return json(await getOperatorSettings(env));
    }
    if (pathname === "/api/settings" && method === "PATCH") {
      const body = await request.json<any>().catch(() => ({}));
      const current = await getOperatorSettings(env);
      const refundCutoffHours = body.refundCutoffHours ?? current.refund_cutoff_hours;
      const reminderMilestones = body.reminderMilestones ?? current.reminder_milestones;
      const cancellationRemediationOptions = body.cancellationRemediationOptions ?? current.cancellation_remediation_options;
      if (!Array.isArray(cancellationRemediationOptions) || cancellationRemediationOptions.length === 0) {
        return err("At least one cancellation remediation option must stay enabled");
      }
      await env.DB.prepare(
        "UPDATE notification_settings SET enquiry_auto_acknowledge_enabled = ?, refund_cutoff_hours = ?, reminder_milestones = ?, cancellation_remediation_options = ?, updated_at = ? WHERE id = 'default'"
      ).bind(
        body.enquiryAutoAcknowledgeEnabled ? 1 : 0,
        refundCutoffHours,
        JSON.stringify(reminderMilestones),
        JSON.stringify(cancellationRemediationOptions),
        new Date().toISOString()
      ).run();
      return json({ ok: true });
    }
    const replyMatch = pathname.match(/^\/api\/enquiries\/([^/]+)\/reply$/);
    if (replyMatch && method === "POST") {
      const id = replyMatch[1];
      const body = await request.json<any>().catch(() => ({}));
      if (!body.reply || String(body.reply).trim() === "") return err("Add a reply before sending");
      const enquiry = await env.DB.prepare("SELECT * FROM enquiries WHERE id = ?").bind(id).first<any>();
      if (!enquiry) return err("Enquiry not found", 404);
      const seId = `se-${crypto.randomUUID().slice(0, 8)}`;
      await env.DB.prepare(
        "INSERT INTO sent_emails (id, template_id, booking_id, use_case, recipients, content_rendered, sent_at) VALUES (?, NULL, NULL, 'enquiry_reply', ?, ?, ?)"
      ).bind(seId, JSON.stringify([enquiry.prospect_email]), body.reply, new Date().toISOString()).run();
      await env.DB.prepare("UPDATE enquiries SET replied = 1 WHERE id = ?").bind(id).run();
      return json({ ok: true });
    }

    // ============ EML real build: A5 Search/Archive/Export/Link (REQ-EML12/13/14) ============
    if (pathname === "/api/archive" && method === "GET") {
      const q = (url.searchParams.get("q") ?? "").toLowerCase();
      const { results: sent } = await env.DB.prepare("SELECT * FROM sent_emails").all<any>();
      const { results: received } = await env.DB.prepare("SELECT * FROM received_emails").all<any>();
      const threadsById: Record<string, any> = {};
      for (const t of (await env.DB.prepare("SELECT * FROM email_threads").all<any>()).results) threadsById[t.id] = t;

      const sentRows = sent.map((s: any) => ({
        kind: "sent", id: s.id, subject: `[${s.use_case}]`, useCase: s.use_case, recipients: JSON.parse(s.recipients),
        bookingId: s.booking_id, body: s.content_rendered, isSpam: false, categorisation: "linked", sentAt: s.sent_at,
        deliveryStatus: s.delivery_status, deliveryError: s.delivery_error,
      }));
      const receivedRows = received.map((r: any) => {
        const thread = threadsById[r.thread_id];
        return {
          kind: "received", id: r.id, subject: r.subject, from: r.from_address,
          bookingId: thread?.booking_id ?? null, body: r.body, isSpam: !!r.is_spam,
          categorisation: thread?.categorisation_status ?? "unlinked", threadId: r.thread_id, sentAt: r.received_at,
        };
      });
      const all = [...sentRows, ...receivedRows].filter((row: any) => {
        const haystack = `${row.subject} ${row.body} ${row.bookingId ?? ""} ${row.from ?? ""} ${(row.recipients ?? []).join(" ")}`.toLowerCase();
        return q === "" || haystack.includes(q);
      });
      return json(all);
    }
    if (pathname === "/api/archive/export" && method === "POST") {
      // Simulated: succeeds unless ?fail=1 is passed, to demonstrate the failure/retry path.
      if (url.searchParams.get("fail") === "1") return err("Export failed — please try again");
      return json({ ok: true, file: `fob-archive-export-${Date.now()}.json` });
    }
    const linkMatch = pathname.match(/^\/api\/threads\/([^/]+)\/link$/);
    if (linkMatch && method === "POST") {
      const id = linkMatch[1];
      const body = await request.json<any>().catch(() => ({}));
      if (!body.bookingId) return err("Select a booking or enquiry to link this thread to");
      await env.DB.prepare("UPDATE email_threads SET booking_id = ?, categorisation_status = 'linked', categorisation_method = 'manual', ambiguous_candidates = NULL WHERE id = ?")
        .bind(body.bookingId, id).run();
      return json({ ok: true });
    }

    // REQ-EML17: Owner replies in-tool to a linked thread's most recent inbound message.
    const replyThreadMatch = pathname.match(/^\/api\/threads\/([^/]+)\/reply$/);
    if (replyThreadMatch && method === "POST") {
      const threadId = replyThreadMatch[1];
      const body = await request.json<any>().catch(() => ({}));
      if (!body.reply || String(body.reply).trim() === "") return err("Add a reply before sending");
      const thread = await env.DB.prepare("SELECT * FROM email_threads WHERE id = ?").bind(threadId).first<any>();
      if (!thread) return err("Thread not found", 404);
      if (thread.categorisation_status !== "linked") return err("Link this thread to a booking before replying to it");
      const lastReceived = await env.DB.prepare("SELECT * FROM received_emails WHERE thread_id = ? ORDER BY received_at DESC LIMIT 1")
        .bind(threadId).first<any>();
      if (!lastReceived) return err("No inbound message found to reply to on this thread", 404);
      const result = await sendThreadReply(env, { bookingId: thread.booking_id, toAddress: lastReceived.from_address, replyText: body.reply });
      return json(result);
    }

    // Owner-initiated message on a booking — starts a fresh exchange, no prior thread
    // needed (distinct from REQ-EML17's reply, which requires a linked thread already
    // existing). Same underlying "free-text, non-templated, real send" mechanism.
    const initiateMatch = pathname.match(/^\/api\/bookings\/([^/]+)\/initiate-message$/);
    if (initiateMatch && method === "POST") {
      const bookingId = initiateMatch[1];
      const body = await request.json<any>().catch(() => ({}));
      if (!body.message || String(body.message).trim() === "") return err("Add a message before sending");
      const booking = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?").bind(bookingId).first<any>();
      if (!booking) return err("Booking not found", 404);
      const result = await sendThreadReply(env, { bookingId, toAddress: booking.party_leader_email, replyText: body.message });
      return json(result);
    }

    // ============ EML real build: A6 Co-leader Management (REQ-EML15/16) ============
    // DR-19: backed by the unified `participants` table (contact_role='co-leader'), not a
    // separate co_leaders table — the Party Leader row (contact_role='leader') is excluded from
    // this list since it's not something the Owner adds/removes/toggles.
    const coleadersListMatch = pathname.match(/^\/api\/bookings\/([^/]+)\/coleaders$/);
    if (coleadersListMatch && method === "GET") {
      const { results } = await env.DB.prepare(
        "SELECT id, booking_id, name, email, notify_opted_in as opted_in, created_at FROM participants WHERE booking_id = ? AND contact_role = 'co-leader' ORDER BY created_at"
      ).bind(coleadersListMatch[1]).all();
      return json(results);
    }
    if (coleadersListMatch && method === "POST") {
      const body = await request.json<any>().catch(() => ({}));
      if (!body.email || String(body.email).trim() === "") return err("Add an email address for this co-leader");
      const id = `cl-${crypto.randomUUID().slice(0, 8)}`;
      await env.DB.prepare("INSERT INTO participants (id, booking_id, name, email, contact_role, notify_opted_in, created_at) VALUES (?, ?, ?, ?, 'co-leader', 1, ?)")
        .bind(id, coleadersListMatch[1], body.name ?? null, body.email, new Date().toISOString()).run();
      return json({ ok: true, id });
    }
    const toggleMatch = pathname.match(/^\/api\/coleaders\/([^/]+)\/toggle$/);
    if (toggleMatch && method === "POST") {
      await env.DB.prepare("UPDATE participants SET notify_opted_in = 1 - notify_opted_in WHERE id = ? AND contact_role = 'co-leader'").bind(toggleMatch[1]).run();
      return json({ ok: true });
    }
    const removeMatch = pathname.match(/^\/api\/coleaders\/([^/]+)$/);
    if (removeMatch && method === "DELETE") {
      await env.DB.prepare("DELETE FROM participants WHERE id = ? AND contact_role = 'co-leader'").bind(removeMatch[1]).run();
      return json({ ok: true });
    }
    if (pathname === "/api/bookings" && method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM bookings ORDER BY id").all();
      return json(results);
    }

    // ================= MOCK external modules (never real EML scope) =================

    // Mock booking module: create a booking -> triggers REQ-EML01.
    if (pathname === "/api/mock/bookings" && method === "POST") {
      const body = await request.json<any>().catch(() => ({}));
      const id = body.id || `BK-${Math.floor(1000 + Math.random() * 9000)}`;
      await env.DB.prepare(
        "INSERT INTO bookings (id, party_leader_name, party_leader_email, tour_name, amount_paid_pence, deposit_pence, hours_until_departure, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')"
      ).bind(id, body.partyLeaderName, body.partyLeaderEmail, body.tourName, body.amountPaidPence, body.depositPence, body.hoursUntilDeparture ?? 168).run();
      // DR-19: the Party Leader is always a participants row (contact_role='leader'), the same
      // unified list a Co-leader later joins — not implied solely by bookings.party_leader_*.
      await env.DB.prepare(
        "INSERT INTO participants (id, booking_id, name, email, contact_role, notify_opted_in, created_at) VALUES (?, ?, ?, ?, 'leader', 1, ?)"
      ).bind(`p-${id}-leader`, id, body.partyLeaderName, body.partyLeaderEmail, new Date().toISOString()).run();
      const dispatchResult = await dispatch(env, {
        useCase: "booking_confirmation",
        bookingId: id,
        vars: { first_name: body.partyLeaderName, tour_name: body.tourName },
      });
      return json({ ok: true, id, dispatch: dispatchResult });
    }

    // Mock booking module: Party-Leader self-service cancellation-request submission (REQ-EML03, out of scope for EML per DR-12).
    if (pathname === "/api/mock/cancellation-requests" && method === "POST") {
      const body = await request.json<any>().catch(() => ({}));
      const booking = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?").bind(body.bookingId).first<any>();
      if (!booking) return err("Booking not found", 404);
      if (booking.status !== "confirmed") return err("This booking is already cancelled");
      const id = `cr-${crypto.randomUUID().slice(0, 8)}`;
      await env.DB.prepare("INSERT INTO cancellation_requests (id, booking_id, hours_until_departure) VALUES (?, ?, ?)")
        .bind(id, booking.id, booking.hours_until_departure).run();
      return json({ ok: true, id });
    }

    // Mock booking module: a weather event -> triggers REQ-EML06 for one booking (simplified from "every booking on a departure").
    if (pathname === "/api/mock/weather-event" && method === "POST") {
      const body = await request.json<any>().catch(() => ({}));
      const booking = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?").bind(body.bookingId).first<any>();
      if (!booking) return err("Booking not found", 404);
      await env.DB.prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?").bind(booking.id).run();
      const dispatchResult = await dispatch(env, {
        useCase: "weather_cancellation",
        bookingId: booking.id,
        vars: { first_name: booking.party_leader_name, tour_name: booking.tour_name },
      });
      return json({ ok: true, dispatch: dispatchResult });
    }

    // Mock booking module: departure completed -> triggers REQ-EML08.
    if (pathname === "/api/mock/departure-completed" && method === "POST") {
      const body = await request.json<any>().catch(() => ({}));
      const booking = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?").bind(body.bookingId).first<any>();
      if (!booking) return err("Booking not found", 404);
      if (booking.status === "cancelled") return err("Booking was cancelled before Departure — suppressed, not sent");
      await env.DB.prepare("UPDATE bookings SET status = 'completed' WHERE id = ?").bind(booking.id).run();
      const dispatchResult = await dispatch(env, {
        useCase: "review_request",
        bookingId: booking.id,
        vars: { first_name: booking.party_leader_name, tour_name: booking.tour_name },
      });
      return json({ ok: true, dispatch: dispatchResult });
    }

    // Mock payment provider: a charge/refund event -> triggers REQ-EML07.
    if (pathname === "/api/mock/payment-events" && method === "POST") {
      const body = await request.json<any>().catch(() => ({}));
      const booking = await env.DB.prepare("SELECT * FROM bookings WHERE id = ?").bind(body.bookingId).first<any>();
      if (!booking) return err("Booking not found", 404);
      const dispatchResult = await dispatch(env, {
        useCase: "payment_receipt",
        bookingId: booking.id,
        vars: { first_name: booking.party_leader_name, tour_name: booking.tour_name, event_kind: body.kind ?? "payment", amount: money(body.amountPence ?? 0) },
      });
      return json({ ok: true, dispatch: dispatchResult });
    }

    // Mock pre-sales module: submit an Enquiry -> feeds A4.
    if (pathname === "/api/mock/enquiries" && method === "POST") {
      const body = await request.json<any>().catch(() => ({}));
      const id = `enq-${crypto.randomUUID().slice(0, 8)}`;
      await env.DB.prepare("INSERT INTO enquiries (id, prospect_name, prospect_email, question) VALUES (?, ?, ?, ?)")
        .bind(id, body.prospectName, body.prospectEmail, body.question).run();
      const ack = await maybeSendEnquiryAcknowledgement(env, { enquiryId: id, toAddress: body.prospectEmail });
      return json({ ok: true, id, acknowledgement: ack });
    }

    // Mock Cloudflare Email Routing: an inbound message arrives -> runs REQ-EML11's cascade.
    if (pathname === "/api/mock/inbound" && method === "POST") {
      const body = await request.json<any>().catch(() => ({}));
      const result = await categorise(env, body.fromAddress, body.subject, body.body);
      const threadId = `et-${crypto.randomUUID().slice(0, 8)}`;
      await env.DB.prepare(
        "INSERT INTO email_threads (id, subject, booking_id, categorisation_status, categorisation_method, ambiguous_candidates, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(
        threadId, body.subject,
        result.status === "linked" ? result.bookingId : null,
        result.status,
        result.status === "linked" ? result.method : null,
        result.status === "ambiguous" ? JSON.stringify(result.candidates) : null,
        new Date().toISOString()
      ).run();
      await env.DB.prepare("INSERT INTO received_emails (id, thread_id, from_address, subject, body, is_spam, received_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(`re-${crypto.randomUUID().slice(0, 8)}`, threadId, body.fromAddress, body.subject, body.body, body.isSpam ? 1 : 0, new Date().toISOString()).run();
      return json({ ok: true, result });
    }

    return new Response("Not found", { status: 404 });
  },

  // Real inbound handler (REQ-EML11). Once this Worker is deployed and a Cloudflare Email
  // Routing rule points a real address at it (recommended: a fresh test address like
  // poc-test@friendsonbikes.uk — NOT the existing production email-routing-01 route),
  // a genuine inbound message runs through the exact same categorisation cascade as the
  // "Incoming email (stand-in)" mock. Locally, this can be exercised via Cloudflare's own
  // test endpoint: `curl -X POST http://localhost:8792/cdn-cgi/handler/email --data-binary @test.eml`
  // (wrangler dev's built-in simulator — see Cloudflare's local-development/routing docs).
  async email(message: any, env: Env, _ctx: ExecutionContext): Promise<void> {
    const fromAddress: string = message.from;
    let subject = message.headers?.get?.("subject") ?? "(no subject)";
    let body = "";
    try {
      // Proper MIME parsing (postal-mime, Cloudflare's own recommended library) — this
      // replaces an earlier version of this POC that only read the raw headers and never
      // reached the actual message text (found by testing against real inbound email).
      const parsed = await PostalMime.parse(message.raw);
      subject = parsed.subject || subject;
      body = parsed.text || parsed.html || "";
    } catch (e) {
      body = `(could not parse message body: ${e instanceof Error ? e.message : String(e)})`;
    }

    const result = await categorise(env, fromAddress, subject, body);
    const threadId = `et-${crypto.randomUUID().slice(0, 8)}`;
    await env.DB.prepare(
      "INSERT INTO email_threads (id, subject, booking_id, categorisation_status, categorisation_method, ambiguous_candidates, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      threadId, subject,
      result.status === "linked" ? result.bookingId : null,
      result.status,
      result.status === "linked" ? result.method : null,
      result.status === "ambiguous" ? JSON.stringify(result.candidates) : null,
      new Date().toISOString()
    ).run();
    await env.DB.prepare(
      "INSERT INTO received_emails (id, thread_id, from_address, subject, body, is_spam, received_at) VALUES (?, ?, ?, ?, ?, 0, ?)"
    ).bind(`re-${crypto.randomUUID().slice(0, 8)}`, threadId, fromAddress, subject, body, new Date().toISOString()).run();

    // Forward to the Owner's real inbox so nothing is silently withheld (DR-7's principle,
    // applied here even though this POC has no real spam classifier yet).
    if (typeof message.forward === "function" && env.SEND_FROM_ADDRESS) {
      try {
        await message.forward(env.SEND_FROM_ADDRESS);
      } catch {
        // Forwarding target must itself be a verified destination address in Email
        // Routing — failing silently here is acceptable for this POC since the message
        // is already captured above; a real build would log this as a gap, same as
        // REQ-EML11's own "gap logged for Owner" pattern elsewhere in this spec.
      }
    }
  },
};

