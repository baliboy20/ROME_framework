import { useState } from "react";
import { IonButton, IonCard, IonCardContent, IonCheckbox, IonContent, IonInput, IonItem, IonLabel, IonText, IonTextarea, IonTitle } from "@ionic/react";
import { api } from "../../api";

export function MockInbound() {
  const [from, setFrom] = useState("priya@example.com");
  const [subject, setSubject] = useState("quick question");
  const [body, setBody] = useState("can I change my meeting point?");
  const [spam, setSpam] = useState(false);
  const [result, setResult] = useState("");

  return (
    <IonContent className="ion-padding">
      <IonTitle className="ion-no-padding" style={{ marginBottom: 12 }}>Incoming email (stand-in)</IonTitle>
      <IonCard color="warning"><IonCardContent>This stands in for Cloudflare Email Routing — simulates an inbound message arriving so the system has something to figure out which booking (if any) it belongs to.</IonCardContent></IonCard>
      <h3>Simulate an email arriving</h3>
      <IonInput label="Their email address" labelPlacement="stacked" value={from} onIonInput={(e) => setFrom(e.detail.value ?? "")} />
      <IonInput label="Subject line" labelPlacement="stacked" value={subject} onIonInput={(e) => setSubject(e.detail.value ?? "")} />
      <IonTextarea label="Message text" labelPlacement="stacked" value={body} onIonInput={(e) => setBody(e.detail.value ?? "")} autoGrow />
      <IonItem lines="none">
        <IonCheckbox checked={spam} onIonChange={(e) => setSpam(e.detail.checked)} />
        <IonLabel style={{ marginLeft: 8 }}>Mark as spam</IonLabel>
      </IonItem>
      <IonButton onClick={async () => {
        const res = await api.mockInbound(from, subject, body, spam);
        setResult(`Matched as: ${res.result.status}${res.result.bookingId ? " -> " + res.result.bookingId : ""} — check All emails.`);
      }}>Simulate this email arriving</IonButton>
      {result && <IonText><p>{result}</p></IonText>}
    </IonContent>
  );
}
