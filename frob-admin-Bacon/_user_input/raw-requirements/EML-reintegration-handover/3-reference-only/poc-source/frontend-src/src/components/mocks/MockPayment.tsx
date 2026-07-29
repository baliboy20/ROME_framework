import { useEffect, useState } from "react";
import { IonButton, IonCard, IonCardContent, IonContent, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonText, IonTitle } from "@ionic/react";
import { api } from "../../api";
import type { Booking } from "../../types";

export function MockPayment() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingId, setBookingId] = useState("");
  const [kind, setKind] = useState("charge");
  const [amount, setAmount] = useState("4500");
  const [result, setResult] = useState("");

  useEffect(() => { api.listBookings().then(setBookings); }, []);

  return (
    <IonContent className="ion-padding">
      <IonTitle className="ion-no-padding" style={{ marginBottom: 12 }}>Payment company (stand-in)</IonTitle>
      <IonCard color="warning"><IonCardContent>This stands in for the payment company. In real life, a card charge or refund would come from them automatically — here you trigger it by hand to see what email it produces.</IonCardContent></IonCard>
      <h3>Simulate a charge or a refund</h3>
      <IonItem>
        <IonLabel>Which booking</IonLabel>
        <IonSelect value={bookingId} onIonChange={(e) => setBookingId(e.detail.value)}>
          {bookings.map((b) => <IonSelectOption key={b.id} value={b.id}>{b.id} — {b.party_leader_name}</IonSelectOption>)}
        </IonSelect>
      </IonItem>
      <IonItem>
        <IonLabel>Kind</IonLabel>
        <IonSelect value={kind} onIonChange={(e) => setKind(e.detail.value)}>
          <IonSelectOption value="charge">Charge</IonSelectOption>
          <IonSelectOption value="refund">Refund</IonSelectOption>
        </IonSelect>
      </IonItem>
      <IonInput label="Amount (pence)" labelPlacement="stacked" value={amount} onIonInput={(e) => setAmount(e.detail.value ?? "")} />
      <IonButton onClick={async () => {
        if (!bookingId) return;
        await api.mockPaymentEvent(bookingId, kind, Number(amount));
        setResult("Receipt dispatched — check All emails.");
      }}>Send this payment event</IonButton>
      {result && <IonText><p>{result}</p></IonText>}
    </IonContent>
  );
}
