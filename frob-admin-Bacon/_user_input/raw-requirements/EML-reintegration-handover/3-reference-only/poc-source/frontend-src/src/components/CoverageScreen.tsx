import { IonBadge, IonCard, IonCardContent, IonContent, IonTitle } from "@ionic/react";

type Status = "full" | "partial" | "gap" | "outofscope";
const ROWS: [string, string, string, Status, string][] = [
  ["REQ-EML01", "Send a confirmation when someone books", "Bookings", "full", "Confirmed working, including real delivery."],
  ["REQ-EML02", "Send reminders 7 days and 1 day before the trip", "Reminders", "gap", "Not built — no clock/scheduler in this prototype."],
  ["REQ-EML03", "Customer asks to cancel (their own request)", "Booking website (stand-in)", "full", "Works, but belongs to a different system, not this admin tool."],
  ["REQ-EML04", "Owner reviews and approves a cancellation", "Cancellation requests", "full", "Confirmed working, including sending to every extra recipient."],
  ["REQ-EML05", "Owner cancels a booking themselves", "Bookings", "full", "Confirmed working, including the discount code."],
  ["REQ-EML06", "Cancel bookings due to bad weather", "Booking website (stand-in)", "partial", "Works for one booking at a time — real life should do a whole trip date at once."],
  ["REQ-EML07", "Send a receipt after a payment or refund", "Payment company (stand-in)", "full", "Confirmed working."],
  ["REQ-EML08", "Send a thank-you after the trip", "Booking website (stand-in)", "full", "Confirmed working, including not sending it if cancelled."],
  ["REQ-EML09", "Reply to a customer question", "Questions from customers", "full", "Confirmed working."],
  ["REQ-EML10", "Create, publish, edit, and retire email templates", "Email Templates", "full", "Confirmed working, including auto-retiring the old one."],
  ["REQ-EML11", "Work out which booking an incoming email is about", "Incoming email (stand-in)", "partial", "Two of five matching rules shown here; all five proven separately."],
  ["REQ-EML12", "Search all emails", "All emails", "full", "Confirmed working."],
  ["REQ-EML13", "Download a backup of all emails", "All emails", "full", "Confirmed working, both success and failure."],
  ["REQ-EML14", "Manually match an email to the right booking", "All emails", "partial", "Works, but always links to the same example booking."],
  ["REQ-EML15", "Customer manages their own extra recipients", "—", "outofscope", "Belongs to the booking website, not this admin tool."],
  ["REQ-EML16", "Owner manages a booking's extra recipients", "Bookings", "full", "Confirmed working."],
  ["REQ-EML17", "Owner replies or writes a new message, recorded in the archive", "All emails / Bookings", "full", "Confirmed working, including real delivery, either side can start it."],
];

const COLORS: Record<Status, "success" | "warning" | "medium" | "tertiary"> = { full: "success", partial: "warning", gap: "medium", outofscope: "tertiary" };
const LABELS: Record<Status, string> = { full: "Fully shown", partial: "Partly shown", gap: "Not shown", outofscope: "Not our job" };

export function CoverageScreen() {
  return (
    <IonContent className="ion-padding">
      <IonTitle className="ion-no-padding" style={{ marginBottom: 12 }}>What's covered by this prototype?</IonTitle>
      <IonCard color="light">
        <IonCardContent>
          Every row is one thing the finished system needs to do. "Fully shown" means you can click through it
          right now. "Partly shown" means it works but simplified. "Not shown" is a real gap, not hidden.
        </IonCardContent>
      </IonCard>
      {ROWS.map(([id, desc, where, status, note]) => (
        <IonCard key={id}>
          <IonCardContent>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <div>
                <b>{id}</b> — {desc}
                <div style={{ fontSize: 13, color: "#666" }}>{where} · {note}</div>
              </div>
              <IonBadge color={COLORS[status]}>{LABELS[status]}</IonBadge>
            </div>
          </IonCardContent>
        </IonCard>
      ))}
    </IonContent>
  );
}
