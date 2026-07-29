import { useEffect, useState } from "react";
import { IonButton, IonCard, IonCardContent, IonContent, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonText, IonTitle } from "@ionic/react";
import { api } from "../../api";
import type { Booking } from "../../types";

export function MockBooking() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [name, setName] = useState("Nadia");
  const [email, setEmail] = useState("nadia@example.com");
  const [tour, setTour] = useState("Sunset Loop");
  const [amount, setAmount] = useState("4000");
  const [deposit, setDeposit] = useState("800");
  const [hours, setHours] = useState("168");
  const [createResult, setCreateResult] = useState("");

  const [cancelBooking, setCancelBooking] = useState("");
  const [cancelResult, setCancelResult] = useState("");
  const [weatherBooking, setWeatherBooking] = useState("");
  const [weatherResult, setWeatherResult] = useState("");
  const [completeBooking, setCompleteBooking] = useState("");
  const [completeResult, setCompleteResult] = useState("");

  function load() { api.listBookings().then(setBookings); }
  useEffect(load, []);

  return (
    <IonContent className="ion-padding">
      <IonTitle className="ion-no-padding" style={{ marginBottom: 12 }}>Booking website (stand-in)</IonTitle>
      <IonCard color="warning"><IonCardContent>
        This stands in for the booking website — a real customer would do these things there, not in this
        admin tool. It's here just so you have something to click to make a booking exist, or kick off a
        cancellation, so you can see how the admin tool responds.
      </IonCardContent></IonCard>

      <h3>Make a new booking</h3>
      <IonText color="medium"><p>Triggers a confirmation email immediately — check Bookings or All emails afterwards. Use a real email address if you want to test real delivery.</p></IonText>
      <IonInput label="Customer's name" labelPlacement="stacked" value={name} onIonInput={(e) => setName(e.detail.value ?? "")} />
      <IonInput label="Customer's email" labelPlacement="stacked" value={email} onIonInput={(e) => setEmail(e.detail.value ?? "")} />
      <IonInput label="Trip name" labelPlacement="stacked" value={tour} onIonInput={(e) => setTour(e.detail.value ?? "")} />
      <IonInput label="Amount paid (pence)" labelPlacement="stacked" value={amount} onIonInput={(e) => setAmount(e.detail.value ?? "")} />
      <IonInput label="Deposit (pence)" labelPlacement="stacked" value={deposit} onIonInput={(e) => setDeposit(e.detail.value ?? "")} />
      <IonInput label="Hours until the trip" labelPlacement="stacked" value={hours} onIonInput={(e) => setHours(e.detail.value ?? "")} />
      <IonButton onClick={async () => {
        const res = await api.mockCreateBooking({ partyLeaderName: name, partyLeaderEmail: email, tourName: tour, amountPaidPence: Number(amount), depositPence: Number(deposit), hoursUntilDeparture: Number(hours) });
        setCreateResult(`Created ${res.id}, confirmation email dispatched.`);
        load();
      }}>Create the booking</IonButton>
      {createResult && <IonText><p>{createResult}</p></IonText>}

      <h3>Customer asks to cancel their booking</h3>
      <IonItem>
        <IonLabel>Which booking</IonLabel>
        <IonSelect value={cancelBooking} onIonChange={(e) => setCancelBooking(e.detail.value)}>
          {bookings.map((b) => <IonSelectOption key={b.id} value={b.id}>{b.id} — {b.party_leader_name} ({b.status})</IonSelectOption>)}
        </IonSelect>
      </IonItem>
      <IonButton onClick={async () => {
        if (!cancelBooking) return;
        await api.mockSubmitCancellation(cancelBooking);
        setCancelResult("Submitted — check that booking's page, or Cancellation requests.");
      }}>Submit the cancellation request</IonButton>
      {cancelResult && <IonText><p>{cancelResult}</p></IonText>}

      <h3>Bad weather forces a cancellation</h3>
      <IonText color="medium"><p>Only cancels one booking here, to keep the demo simple — real life would do every booking on that trip date.</p></IonText>
      <IonItem>
        <IonLabel>Which booking</IonLabel>
        <IonSelect value={weatherBooking} onIonChange={(e) => setWeatherBooking(e.detail.value)}>
          {bookings.map((b) => <IonSelectOption key={b.id} value={b.id}>{b.id} — {b.party_leader_name} ({b.status})</IonSelectOption>)}
        </IonSelect>
      </IonItem>
      <IonButton onClick={async () => {
        if (!weatherBooking) return;
        await api.mockWeatherEvent(weatherBooking);
        setWeatherResult("Weather-cancellation notice dispatched.");
        load();
      }}>Cancel this booking for weather</IonButton>
      {weatherResult && <IonText><p>{weatherResult}</p></IonText>}

      <h3>A trip has finished</h3>
      <IonItem>
        <IonLabel>Which booking</IonLabel>
        <IonSelect value={completeBooking} onIonChange={(e) => setCompleteBooking(e.detail.value)}>
          {bookings.map((b) => <IonSelectOption key={b.id} value={b.id}>{b.id} — {b.party_leader_name} ({b.status})</IonSelectOption>)}
        </IonSelect>
      </IonItem>
      <IonButton onClick={async () => {
        if (!completeBooking) return;
        await api.mockDepartureCompleted(completeBooking);
        setCompleteResult("Review-request dispatched.");
        load();
      }}>Mark this trip as completed</IonButton>
      {completeResult && <IonText><p>{completeResult}</p></IonText>}
    </IonContent>
  );
}
