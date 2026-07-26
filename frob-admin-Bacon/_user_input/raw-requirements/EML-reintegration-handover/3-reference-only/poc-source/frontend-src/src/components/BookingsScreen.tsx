import { useEffect, useState, useCallback } from "react";
import {
  IonBadge, IonButton, IonButtons, IonCard, IonCardContent, IonCol, IonContent, IonGrid,
  IonInput, IonItem, IonLabel, IonList, IonNote, IonRow, IonSelect, IonSelectOption, IonText, IonTextarea, IonTitle,
} from "@ionic/react";
import { api } from "../api";
import type { Booking, CancellationRequest, CoLeader, EmailRowData, NotificationSettings } from "../types";
import { EmailRow } from "./EmailRow";

export function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadBookings = useCallback(() => { api.listBookings().then(setBookings); }, []);
  useEffect(loadBookings, [loadBookings]);

  const selected = bookings.find((b) => b.id === selectedId) ?? null;

  return (
    <IonContent className="ion-padding">
      <IonTitle className="ion-no-padding" style={{ marginBottom: 12 }}>Bookings</IonTitle>
      <IonCard color="light">
        <IonCardContent>
          Everything below happens in the context of one booking. Click a booking to send them a message,
          cancel on the business's behalf, manage its extra recipients, or approve a pending cancellation
          request — all in one place.
        </IonCardContent>
      </IonCard>
      <IonGrid>
        <IonRow>
          <IonCol size="12" sizeMd="4">
            <IonList lines="full">
              {bookings.length === 0 ? (
                <IonText color="medium">No bookings yet — create one under "Booking website (stand-in)".</IonText>
              ) : (
                bookings.map((b) => (
                  <IonItem key={b.id} button detail onClick={() => setSelectedId(b.id)} color={b.id === selectedId ? "light" : undefined}>
                    <IonLabel>
                      <h3>{b.id} — {b.party_leader_name}</h3>
                      <p>{b.tour_name} · {b.hours_until_departure}hrs until departure</p>
                    </IonLabel>
                    <IonBadge slot="end" color={b.status === "confirmed" ? "success" : b.status === "cancelled" ? "danger" : "medium"}>{b.status}</IonBadge>
                  </IonItem>
                ))
              )}
            </IonList>
          </IonCol>
          <IonCol size="12" sizeMd="8">
            {selected && <BookingDetail booking={selected} onChanged={loadBookings} />}
          </IonCol>
        </IonRow>
      </IonGrid>
    </IonContent>
  );
}

function BookingDetail({ booking, onChanged }: { booking: Booking; onChanged: () => void }) {
  const [pending, setPending] = useState<CancellationRequest | null>(null);
  const [coleaders, setCoLeaders] = useState<CoLeader[]>([]);
  const [emails, setEmails] = useState<EmailRowData[]>([]);
  const [explanation, setExplanation] = useState("");
  const [ccResult, setCcResult] = useState("");
  const [clName, setClName] = useState("");
  const [clEmail, setClEmail] = useState("");
  const [clError, setClError] = useState("");
  const [message, setMessage] = useState("");
  const [initResult, setInitResult] = useState("");
  const [initError, setInitError] = useState("");
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [manualRefund, setManualRefund] = useState("");
  const [approveError, setApproveError] = useState("");
  const [remediationType, setRemediationType] = useState<"refund" | "rebook" | "credit">("refund");

  const load = useCallback(() => {
    api.listCancellations().then((all) => setPending(all.find((r) => r.booking_id === booking.id && !r.resolved) ?? null));
    api.listCoLeaders(booking.id).then(setCoLeaders);
    api.searchArchive(booking.id).then((rows) => setEmails([...rows].sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())));
    api.getSettings().then((s) => { setSettings(s); setRemediationType(s.cancellation_remediation_options[0]); });
  }, [booking.id]);
  useEffect(load, [load]);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>{booking.tour_name} — {booking.party_leader_name} ({booking.id})</h2>
      <p>Status: <IonBadge>{booking.status}</IonBadge> · Paid £{(booking.amount_paid_pence / 100).toFixed(2)} · {booking.hours_until_departure}hrs until departure</p>

      <h3>Cancellation</h3>
      <IonCard color="light"><IonCardContent>
        How this works, start to finish: 1) the customer asks to cancel on the booking website (orange stand-in) → 2) you review and approve it here → 3) the payment company confirms the refund (another stand-in) → 4) the customer and any co-leaders get a confirmation email automatically.
      </IonCardContent></IonCard>
      {pending ? (
        <IonCard><IonCardContent>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div>Waiting for your decision<br /><IonNote>{pending.refund_outcome}</IonNote></div>
          </div>
          {pending.hours_until_departure < pending.refund_cutoff_hours && (
            <IonItem lines="none">
              <IonLabel position="stacked">Refund amount (pence) — inside the {pending.refund_cutoff_hours}hr cutoff, this is your call</IonLabel>
              <IonInput type="number" value={manualRefund} onIonInput={(e) => setManualRefund(e.detail.value ?? "")} placeholder="e.g. 3000 for £30.00, or 0" />
            </IonItem>
          )}
          {approveError && <IonText color="danger"><p>{approveError}</p></IonText>}
          <IonButton onClick={async () => {
            try {
              const manual = pending.hours_until_departure < pending.refund_cutoff_hours ? Number(manualRefund) : undefined;
              await api.approveCancellation(pending.id, manual);
              setApproveError(""); setManualRefund(""); load(); onChanged();
            } catch (e) { setApproveError((e as Error).message); }
          }}>Approve</IonButton>
        </IonCardContent></IonCard>
      ) : <IonText color="medium">No cancellation request waiting on this booking.</IonText>}

      <h3>Cancel this booking yourself</h3>
      <IonCard color="light"><IonCardContent>Use this instead of the flow above when the business is the one cancelling — bad weather, not enough people, etc. Only the remediation options enabled in Settings are offered.</IonCardContent></IonCard>
      <IonTextarea placeholder="Explain why, in your own words" value={explanation} onIonInput={(e) => setExplanation(e.detail.value ?? "")} autoGrow />
      {settings && (
        <IonItem lines="none">
          <IonLabel>Offer the customer</IonLabel>
          <IonSelect value={remediationType} onIonChange={(e) => setRemediationType(e.detail.value)}>
            {settings.cancellation_remediation_options.map((r) => <IonSelectOption key={r} value={r}>{r}</IonSelectOption>)}
          </IonSelect>
        </IonItem>
      )}
      <IonButton onClick={async () => {
        try { const res = await api.companyCancellation(booking.id, explanation, remediationType); setCcResult(`Done (${res.remediationType}). Discount code: ${res.discountCode}`); setExplanation(""); load(); onChanged(); }
        catch (e) { setCcResult((e as Error).message); }
      }}>Cancel and notify the customer</IonButton>
      {ccResult && <IonText><p>{ccResult}</p></IonText>}

      <h3>Extra people who should get this booking's emails</h3>
      <IonCard color="light"><IonCardContent>Add someone (a partner, a friend) if they should also get every email about this booking. They can't log in or do anything — just an extra recipient, switch on/off any time.</IonCardContent></IonCard>
      {coleaders.length === 0 ? <IonText color="medium">Nobody added yet.</IonText> : coleaders.map((c) => (
        <IonItem key={c.id}>
          <IonLabel>{c.name || "(no name given)"} — {c.email} <IonBadge color={c.opted_in ? "success" : "medium"}>{c.opted_in ? "getting emails" : "switched off"}</IonBadge></IonLabel>
          <IonButtons slot="end">
            <IonButton size="small" onClick={async () => { await api.toggleCoLeader(c.id); load(); }}>Switch on/off</IonButton>
            <IonButton size="small" color="danger" onClick={async () => { await api.removeCoLeader(c.id); load(); }}>Remove</IonButton>
          </IonButtons>
        </IonItem>
      ))}
      <IonInput placeholder="Their name (optional)" value={clName} onIonInput={(e) => setClName(e.detail.value ?? "")} />
      <IonInput placeholder="Their email" value={clEmail} onIonInput={(e) => setClEmail(e.detail.value ?? "")} />
      <IonButton onClick={async () => {
        try { await api.addCoLeader(booking.id, clName, clEmail); setClName(""); setClEmail(""); setClError(""); load(); }
        catch (e) { setClError((e as Error).message); }
      }}>Add them</IonButton>
      {clError && <IonText color="danger"><p>{clError}</p></IonText>}

      <h3>Send this customer a message</h3>
      <IonCard color="light"><IonCardContent>Start a fresh conversation with the Party Leader — doesn't need an existing message to reply to. Works the other way too: if the customer emails in first, reply to that instead, and it shows up in the same log below either way.</IonCardContent></IonCard>
      <IonTextarea placeholder="Write your message" value={message} onIonInput={(e) => setMessage(e.detail.value ?? "")} autoGrow />
      <IonButton onClick={async () => {
        try {
          const res = await api.initiateMessage(booking.id, message);
          setInitResult(res.delivery === "sent" ? "Sent — really delivered." : res.delivery === "failed" ? `Recorded, but delivery failed: ${res.deliveryError}` : "Recorded (no real send configured).");
          setInitError(""); setMessage(""); load();
        } catch (e) { setInitError((e as Error).message); }
      }}>Send message</IonButton>
      {initError && <IonText color="danger"><p>{initError}</p></IonText>}
      {initResult && <IonText><p>{initResult}</p></IonText>}

      <h3>Full email exchange for this booking</h3>
      <IonCard color="light"><IonCardContent>Everything sent to or received from {booking.party_leader_name} (and any co-leaders), in one place — whoever started each message.</IonCardContent></IonCard>
      {emails.length === 0 ? <IonText color="medium">No emails yet for this booking.</IonText> : emails.map((r) => <EmailRow key={r.id} row={r} />)}
    </div>
  );
}
