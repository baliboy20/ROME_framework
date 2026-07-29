import { useEffect, useState } from "react";
import { IonBadge, IonButton, IonCard, IonCardContent, IonContent, IonText, IonTextarea, IonTitle } from "@ionic/react";
import { api } from "../api";
import type { Enquiry } from "../types";

export function EnquiriesScreen() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  function load() { api.listEnquiries().then(setEnquiries); }
  useEffect(load, []);

  async function reply(id: string) {
    try {
      await api.replyEnquiry(id, drafts[id] ?? "");
      setErrors((e) => ({ ...e, [id]: "" }));
      load();
    } catch (e) {
      setErrors((err) => ({ ...err, [id]: (e as Error).message }));
    }
  }

  return (
    <IonContent className="ion-padding">
      <IonTitle className="ion-no-padding" style={{ marginBottom: 12 }}>Questions from customers</IonTitle>
      <IonCard color="light">
        <IonCardContent>These come from people who haven't booked yet — not tied to any booking. Someone asks a question on the enquiry form (see the orange stand-in section), and it shows up here for a reply.</IonCardContent>
      </IonCard>
      {enquiries.length === 0 ? (
        <IonText color="medium">No open questions right now.</IonText>
      ) : (
        enquiries.map((e) => (
          <IonCard key={e.id}>
            <IonCardContent>
              <div><b>{e.prospect_name}</b> ({e.prospect_email}) {e.acknowledged ? <IonBadge color="medium" title="An automatic holding acknowledgement was already sent — REQ-EML18. This doesn't count as the real reply.">auto-acknowledged</IonBadge> : null}</div>
              <IonText color="medium"><p>{e.question}</p></IonText>
              <IonTextarea placeholder="Your reply" value={drafts[e.id] ?? ""} onIonInput={(ev) => setDrafts((d) => ({ ...d, [e.id]: ev.detail.value ?? "" }))} autoGrow />
              {errors[e.id] && <IonText color="danger"><p>{errors[e.id]}</p></IonText>}
              <IonButton size="small" onClick={() => reply(e.id)}>Send reply</IonButton>
            </IonCardContent>
          </IonCard>
        ))
      )}
    </IonContent>
  );
}
