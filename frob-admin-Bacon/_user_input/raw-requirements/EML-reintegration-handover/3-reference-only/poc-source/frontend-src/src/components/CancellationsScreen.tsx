import { useEffect, useState } from "react";
import { IonButton, IonCard, IonCardContent, IonInput, IonItem, IonLabel, IonText, IonContent, IonTitle } from "@ionic/react";
import { api } from "../api";
import type { CancellationRequest } from "../types";

export function CancellationsScreen() {
  const [reqs, setReqs] = useState<CancellationRequest[]>([]);
  const [manual, setManual] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  function load() {
    api.listCancellations().then((all) => setReqs(all.filter((r) => !r.resolved)));
  }
  useEffect(load, []);

  async function approve(r: CancellationRequest) {
    try {
      const m = r.hours_until_departure < r.refund_cutoff_hours ? Number(manual[r.id] ?? "") : undefined;
      await api.approveCancellation(r.id, m);
      setErrors((e) => ({ ...e, [r.id]: "" }));
      load();
    } catch (e) {
      setErrors((prev) => ({ ...prev, [r.id]: (e as Error).message }));
    }
  }

  return (
    <IonContent className="ion-padding">
      <IonTitle className="ion-no-padding" style={{ marginBottom: 12 }}>Cancellation requests</IonTitle>
      <IonCard color="light">
        <IonCardContent>
          The customer asked to cancel — either themselves (see the "Booking website" stand-in) or you're
          reviewing what came in. Approving one is done here; the booking's full email history lives on its
          own Bookings page.
        </IonCardContent>
      </IonCard>
      {reqs.length === 0 ? (
        <IonText color="medium">No cancellation requests pending.</IonText>
      ) : (
        reqs.map((r) => (
          <IonCard key={r.id}>
            <IonCardContent>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: "bold" }}>{r.booking_id} — {r.party_leader_name}, {r.tour_name}</div>
                  <IonText color="medium"><p style={{ margin: 0 }}>{r.refund_outcome}</p></IonText>
                </div>
                <IonButton onClick={() => approve(r)}>Approve</IonButton>
              </div>
              {r.hours_until_departure < r.refund_cutoff_hours && (
                <IonItem lines="none">
                  <IonLabel position="stacked">Refund amount (pence)</IonLabel>
                  <IonInput type="number" value={manual[r.id] ?? ""} onIonInput={(e) => setManual((m) => ({ ...m, [r.id]: e.detail.value ?? "" }))} placeholder="e.g. 3000 for £30.00, or 0" />
                </IonItem>
              )}
              {errors[r.id] && <IonText color="danger"><p>{errors[r.id]}</p></IonText>}
            </IonCardContent>
          </IonCard>
        ))
      )}
    </IonContent>
  );
}
