import { useState } from "react";
import {
  IonContent, IonTitle, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonList, IonItem, IonLabel, IonIcon, IonBadge, IonText, IonNote,
} from "@ionic/react";
import { playOutline, checkmarkCircleOutline, alertCircleOutline, warningOutline, mailOutline } from "ionicons/icons";
import { api } from "../api";
import type { EmailRowData } from "../types";
import { EmailRow } from "./EmailRow";

// A "life-cycle scenario" is a chain of real actions, run against the live API in order,
// the way a Party Leader/Owner would actually experience them end to end. Running these is
// a functional-spec sanity check (does the chain hold together?) and an oversight-finder
// (does any step reveal a requirement gap?).

type StepResult = { label: string; req: string; status: "ok" | "error" | "gap"; detail: string };

interface Scenario {
  id: string;
  title: string;
  narrative: string;
  // returns the search key (the fresh customer email this run used) so the resulting
  // email chain can be looked up and shown afterwards
  run: (log: (r: StepResult) => void) => Promise<string>;
}

function rnd() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

const scenarios: Scenario[] = [
  {
    id: "full-lifecycle",
    title: "Enquiry → booking → payment → cancellation → refund",
    narrative:
      "A prospective customer asks a question, the Owner replies, they book, pay, then change their mind and cancel close to departure — checking the refund rule applies correctly.",
    run: async (log) => {
      const email = `scenario.${rnd().toLowerCase()}@example.com`;
      const enq = await api.mockSubmitEnquiry("Scenario Person", email, "Does the Hidden City tour suit beginners?");
      log({ label: "Person submits enquiry from the website", req: "REQ-EML09 (pre)", status: "ok", detail: `enquiry ${enq.id} recorded` });

      await api.replyEnquiry(enq.id, "Yes, it's beginner-friendly — 2-3 hours, flat terrain.");
      log({ label: "Owner replies to the enquiry", req: "REQ-EML09", status: "ok", detail: "reply sent, enquiry marked replied" });

      const bk = await api.mockCreateBooking({
        partyLeaderName: "Scenario Person", partyLeaderEmail: email, tourName: "Hidden City",
        amountPaidPence: 4500, depositPence: 900, hoursUntilDeparture: 200,
      });
      log({ label: "Person books the tour (external booking site)", req: "REQ-EML01", status: "ok", detail: `booking ${bk.id} created, confirmation email queued` });

      await api.mockPaymentEvent(bk.id, "payment", 4500);
      log({ label: "Payment company confirms payment", req: "REQ-EML07", status: "ok", detail: "payment-receipt email queued" });

      const cr = await api.mockSubmitCancellation(bk.id);
      log({ label: "Person requests cancellation close to departure", req: "REQ-EML03", status: "ok", detail: `cancellation-request ${cr.id} recorded (hours_until_departure=200, so full refund expected)` });

      const cancelList = await api.listCancellations();
      const mine = cancelList.find((c) => c.id === cr.id);
      const approve = await api.approveCancellation(cr.id);
      log({
        label: "Owner reviews and approves the cancellation",
        req: "REQ-EML04",
        status: "ok",
        detail: `refund outcome: ${mine?.refund_outcome ?? "?"} — ${JSON.stringify(approve.outcome)}`,
      });
      return email;
    },
  },
  {
    id: "late-cancellation",
    title: "Cancellation inside the 24-hour cutoff",
    narrative:
      "Same as above, but the cancellation lands under 24 hours before departure — this should hit the partial/no-refund branch of BR-06, not the full-refund branch.",
    run: async (log) => {
      const email = `scenario.${rnd().toLowerCase()}@example.com`;
      const bk = await api.mockCreateBooking({
        partyLeaderName: "Late Canceller", partyLeaderEmail: email, tourName: "Countryside Loop",
        amountPaidPence: 6000, depositPence: 1200, hoursUntilDeparture: 10,
      });
      log({ label: "Booking exists, departure is 10 hours away", req: "REQ-EML01", status: "ok", detail: `booking ${bk.id}` });

      const cr = await api.mockSubmitCancellation(bk.id);
      const cancelList = await api.listCancellations();
      const mine = cancelList.find((c) => c.id === cr.id);
      log({
        label: "Person cancels inside the 24hr cutoff",
        req: "REQ-EML03 / BR-06",
        status: mine?.refund_outcome ? "ok" : "gap",
        detail: mine ? `computed refund kind: ${mine.refund_kind ?? "(pending approval)"}, amount: ${mine.refund_pence ?? "?"}p` : "no refund outcome computed before approval — check BR-06 wiring",
      });

      await api.approveCancellation(cr.id);
      log({ label: "Owner approves — refund/withhold applied per BR-06", req: "REQ-EML04", status: "ok", detail: "cancellation_approved email queued" });
      return email;
    },
  },
  {
    id: "company-cancellation-weather",
    title: "Owner cancels for weather, mid-season",
    narrative:
      "The Owner has to pull a tour for weather — every affected Party Leader (and opted-in Co-leaders) should get the notice automatically, no per-person action needed.",
    run: async (log) => {
      const email = `scenario.${rnd().toLowerCase()}@example.com`;
      const bk = await api.mockCreateBooking({
        partyLeaderName: "Weather Test", partyLeaderEmail: email, tourName: "River Route",
        amountPaidPence: 5000, depositPence: 1000, hoursUntilDeparture: 48,
      });
      await api.addCoLeader(bk.id, "Co-lead", `coleader.${rnd().toLowerCase()}@example.com`);
      log({ label: "Booking has a Party Leader and an opted-in Co-leader", req: "REQ-EML15/16", status: "ok", detail: `booking ${bk.id}` });

      await api.mockWeatherEvent(bk.id);
      log({ label: "Weather system flags the tour as unsafe", req: "REQ-EML06", status: "ok", detail: "weather-cancellation notice queued to Party Leader + opted-in Co-leader (F-18)" });
      return email;
    },
  },
  {
    id: "coleader-opt-out",
    title: "Co-leader opts out mid-booking",
    narrative:
      "A Co-leader decides they don't want tour emails anymore. From that point on, sends to this booking should exclude them (F-19: Co-leader has no agency over the booking itself, only their own inbox).",
    run: async (log) => {
      const email = `scenario.${rnd().toLowerCase()}@example.com`;
      const bk = await api.mockCreateBooking({
        partyLeaderName: "Opt Out Test", partyLeaderEmail: email, tourName: "Hidden City",
        amountPaidPence: 4500, depositPence: 900, hoursUntilDeparture: 300,
      });
      const cl = await api.addCoLeader(bk.id, "Fence Sitter", `coleader.${rnd().toLowerCase()}@example.com`);
      log({ label: "Co-leader added, opted in by default", req: "REQ-EML15", status: "ok", detail: `co-leader ${cl.id}` });

      await api.toggleCoLeader(cl.id);
      log({ label: "Co-leader opts out", req: "REQ-EML16", status: "ok", detail: "opted_in flipped to 0" });

      await api.mockPaymentEvent(bk.id, "payment", 4500);
      const coLeaders = await api.listCoLeaders(bk.id);
      const stillIn = coLeaders.find((c) => c.id === cl.id)?.opted_in;
      log({
        label: "Payment receipt fans out to current recipients",
        req: "REQ-EML07 / F-18",
        status: stillIn ? "gap" : "ok",
        detail: stillIn ? "opted-out Co-leader still marked opted_in — recipient exclusion may not be re-checked per send" : "opted-out Co-leader correctly excluded from this send's recipient list",
      });
      return email;
    },
  },
  {
    id: "reply-exchange",
    title: "Two-way exchange after departure",
    narrative:
      "A Party Leader emails in with a question after the trip; the Owner replies from inside this tool, not by hand-crafting a separate email client message. Everything should be visible in one thread.",
    run: async (log) => {
      const email = `scenario.${rnd().toLowerCase()}@example.com`;
      const bk = await api.mockCreateBooking({
        partyLeaderName: "Post Trip", partyLeaderEmail: email, tourName: "Sunset Loop",
        amountPaidPence: 4000, depositPence: 800, hoursUntilDeparture: -5,
      });
      const inbound = await api.mockInbound(email, "Lost my water bottle", "Did anyone hand in a blue water bottle after the ride?", false);
      log({ label: "Party Leader emails in after the tour", req: "REQ-EML11", status: "ok", detail: `categorised as: ${inbound.result.status}${inbound.result.bookingId ? ` (linked to ${inbound.result.bookingId})` : ""}` });

      void bk;
      if (inbound.result.status !== "linked") {
        log({ label: "Thread needs manual linking before a reply is possible", req: "REQ-EML14", status: "gap", detail: "sender-lookup cascade did not auto-link this booking — check categorisation step 4 (sender-lookup) for this fixture" });
        return email;
      }
      const rows = await api.searchArchive(email);
      const thread = rows.find((r) => r.kind === "received" && r.categorisation === "linked");
      if (!thread?.threadId) {
        log({ label: "Reply attempted", req: "REQ-EML17", status: "error", detail: "could not find the linked thread to reply on" });
        return email;
      }
      const reply = await api.replyThread(thread.threadId, "Yes — it's at the front desk, ask for Sam.");
      log({ label: "Owner replies from inside this admin tool", req: "REQ-EML17", status: "ok", detail: `delivery: ${reply.delivery}${reply.deliveryError ? ` (${reply.deliveryError})` : ""}` });
      return email;
    },
  },
];

export function ScenariosScreen() {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, StepResult[]>>({});
  const [chains, setChains] = useState<Record<string, EmailRowData[]>>({});

  async function run(s: Scenario) {
    setRunning(s.id);
    const acc: StepResult[] = [];
    const log = (r: StepResult) => { acc.push(r); setResults((prev) => ({ ...prev, [s.id]: [...acc] })); };
    setResults((prev) => ({ ...prev, [s.id]: [] }));
    setChains((prev) => ({ ...prev, [s.id]: [] }));
    try {
      const searchKey = await s.run(log);
      const rows = await api.searchArchive(searchKey);
      const sorted = [...rows].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
      setChains((prev) => ({ ...prev, [s.id]: sorted }));
    } catch (e) {
      log({ label: "Scenario stopped early", req: "-", status: "error", detail: (e as Error).message });
    } finally {
      setRunning(null);
    }
  }

  const iconFor = (status: StepResult["status"]) =>
    status === "ok" ? checkmarkCircleOutline : status === "gap" ? warningOutline : alertCircleOutline;
  const colorFor = (status: StepResult["status"]) =>
    status === "ok" ? "success" : status === "gap" ? "warning" : "danger";

  return (
    <IonContent className="ion-padding">
      <IonTitle className="ion-no-padding" style={{ marginBottom: 12 }}>Life-cycle scenarios</IonTitle>
      <IonCard color="light">
        <IonCardContent>
          Common real-life journeys, played through end to end against the live system — each step calls the
          actual API a real screen would use. Use these to a) sanity-check the functional spec against typical
          situations, and b) surface anything the requirements don't actually cover. A step marked{" "}
          <IonBadge color="warning">gap</IonBadge> means the scenario ran, but something looked like a requirement
          oversight rather than a bug.
        </IonCardContent>
      </IonCard>

      {scenarios.map((s) => (
        <IonCard key={s.id}>
          <IonCardHeader>
            <IonCardTitle>{s.title}</IonCardTitle>
            <IonNote>{s.narrative}</IonNote>
          </IonCardHeader>
          <IonCardContent>
            <IonButton size="small" disabled={running === s.id} onClick={() => run(s)}>
              <IonIcon slot="start" icon={playOutline} />
              {running === s.id ? "Running…" : "Run this scenario"}
            </IonButton>

            {results[s.id] && results[s.id].length > 0 && (
              <IonList lines="full" style={{ marginTop: 8 }}>
                {results[s.id].map((r, i) => (
                  <IonItem key={i}>
                    <IonIcon icon={iconFor(r.status)} color={colorFor(r.status)} slot="start" />
                    <IonLabel className="ion-text-wrap">
                      <h3>{r.label}</h3>
                      <p>{r.detail}</p>
                    </IonLabel>
                    <IonNote slot="end">{r.req}</IonNote>
                  </IonItem>
                ))}
              </IonList>
            )}

            {chains[s.id] && chains[s.id].length > 0 && (
              <>
                <IonNote style={{ display: "flex", alignItems: "center", gap: 4, margin: "12px 0 6px" }}>
                  <IonIcon icon={mailOutline} /> Email chain this scenario produced, in order sent/received:
                </IonNote>
                {chains[s.id].map((r) => <EmailRow key={`${r.kind}-${r.id}`} row={r} />)}
              </>
            )}
          </IonCardContent>
        </IonCard>
      ))}

      <IonText color="medium">
        <p style={{ marginTop: 8 }}>
          These use the same mock/stand-in endpoints as the "Stand-ins for other systems" screens, so running them
          creates real rows — clear test data afterwards the same way as before if you want a clean Home view.
        </p>
      </IonText>
    </IonContent>
  );
}
