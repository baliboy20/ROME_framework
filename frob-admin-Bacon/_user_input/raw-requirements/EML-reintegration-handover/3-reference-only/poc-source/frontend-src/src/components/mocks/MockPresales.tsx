import { useState } from "react";
import { IonButton, IonCard, IonCardContent, IonContent, IonInput, IonText, IonTextarea, IonTitle } from "@ionic/react";
import { api } from "../../api";

export function MockPresales() {
  const [name, setName] = useState("Jordan");
  const [email, setEmail] = useState("jordan@example.com");
  const [question, setQuestion] = useState("Do you offer group discounts for 6+ people?");
  const [result, setResult] = useState("");

  return (
    <IonContent className="ion-padding">
      <IonTitle className="ion-no-padding" style={{ marginBottom: 12 }}>Enquiry form (stand-in)</IonTitle>
      <IonCard color="warning"><IonCardContent>This stands in for the enquiry form on the website — where someone asks a question before they've booked anything.</IonCardContent></IonCard>
      <h3>Submit a customer question</h3>
      <IonInput label="Their name" labelPlacement="stacked" value={name} onIonInput={(e) => setName(e.detail.value ?? "")} />
      <IonInput label="Their email" labelPlacement="stacked" value={email} onIonInput={(e) => setEmail(e.detail.value ?? "")} />
      <IonTextarea label="Their question" labelPlacement="stacked" value={question} onIonInput={(e) => setQuestion(e.detail.value ?? "")} autoGrow />
      <IonButton onClick={async () => {
        await api.mockSubmitEnquiry(name, email, question);
        setResult('Submitted — check "Questions from customers".');
      }}>Submit the question</IonButton>
      {result && <IonText><p>{result}</p></IonText>}
    </IonContent>
  );
}
