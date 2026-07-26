import { IonBadge, IonCard, IonCardContent, IonChip, IonLabel, IonNote, IonText } from "@ionic/react";
import type { EmailRowData } from "../types";
import { initiatorOf } from "../types";

function deliveryChip(r: EmailRowData) {
  if (r.kind !== "sent") return null;
  if (r.deliveryStatus === "sent") return <IonChip color="success" title="Actually delivered via Cloudflare Email Sending"><IonLabel>real email sent</IonLabel></IonChip>;
  if (r.deliveryStatus === "failed") return <IonChip color="danger" title={r.deliveryError ?? ""}><IonLabel>delivery failed</IonLabel></IonChip>;
  return <IonChip color="medium" outline title="No EMAIL binding configured, or remote sending is off"><IonLabel>recorded only</IonLabel></IonChip>;
}

export function EmailRow({ row, actions }: { row: EmailRowData; actions?: React.ReactNode }) {
  const info = initiatorOf(row);
  return (
    <IonCard style={{ borderLeft: `5px solid ${info.color}`, margin: "0 0 10px 0" }}>
      <IonCardContent>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <IonChip style={{ background: info.bg, color: info.color, fontWeight: 600 }} title={info.detail}>
              <IonLabel>{info.label}</IonLabel>
            </IonChip>
            <IonChip outline><IonLabel>{row.kind === "sent" ? "→ outgoing" : "← incoming"}</IonLabel></IonChip>
            {deliveryChip(row)}
            <IonChip outline><IonLabel>{row.categorisation}</IonLabel></IonChip>
            {row.isSpam && <IonBadge color="danger">spam</IonBadge>}
          </div>
          <IonNote>{new Date(row.sentAt).toLocaleString()}</IonNote>
        </div>
        <IonText><h3 style={{ margin: "8px 0 2px" }}>{row.subject}</h3></IonText>
        <IonText color="medium"><p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{row.body}</p></IonText>
        <IonNote style={{ display: "block", marginTop: 4 }}>
          Booking: {row.bookingId ?? "—"}{row.from ? ` · From: ${row.from}` : ""}
        </IonNote>
        {actions && <div style={{ marginTop: 8 }}>{actions}</div>}
      </IonCardContent>
    </IonCard>
  );
}
