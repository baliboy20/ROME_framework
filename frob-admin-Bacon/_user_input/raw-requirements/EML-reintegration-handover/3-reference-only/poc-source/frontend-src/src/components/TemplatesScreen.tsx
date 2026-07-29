import { useEffect, useState } from "react";
import { IonBadge, IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonInput, IonText, IonTextarea, IonTitle } from "@ionic/react";
import { api } from "../api";
import type { Template } from "../types";

export function TemplatesScreen() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [useCase, setUseCase] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  function load() { api.listTemplates().then(setTemplates); }
  useEffect(load, []);

  return (
    <IonContent className="ion-padding">
      <IonTitle className="ion-no-padding" style={{ marginBottom: 12 }}>Email Templates</IonTitle>
      <IonCard color="light">
        <IonCardContent>
          These are the reusable email texts behind every auto-generated send — the booking confirmation, the
          cancellation notice, the receipt, and so on. Not tied to any one booking.
        </IonCardContent>
      </IonCard>
      {templates.map((t) => (
        <IonCard key={t.id} style={{ opacity: t.status === "retired" ? 0.6 : 1 }}>
          <IonCardContent>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <b>{t.use_case}</b> <IonBadge color="medium">{t.status}</IonBadge>
                {editingId !== t.id && <IonText color="medium"><p style={{ margin: 0 }}>{t.content ? t.content.slice(0, 70) : "(empty)"}</p></IonText>}
              </div>
              <IonButtons>
                <IonButton size="small" fill="outline" onClick={async () => { await api.publishTemplate(t.id); load(); }}>Make active</IonButton>
                <IonButton size="small" onClick={() => { setEditingId(t.id); setEditText(t.content); }}>Edit</IonButton>
                <IonButton size="small" color="danger" onClick={async () => { try { await api.deleteTemplate(t.id); load(); } catch (e) { alert((e as Error).message); } }}>Delete</IonButton>
              </IonButtons>
            </div>
            {editingId === t.id && (
              <div style={{ marginTop: 8 }}>
                <IonTextarea value={editText} onIonInput={(e) => setEditText(e.detail.value ?? "")} autoGrow />
                <IonButtons>
                  <IonButton size="small" onClick={async () => { await api.updateTemplate(t.id, editText); setEditingId(null); load(); }}>Save</IonButton>
                  <IonButton size="small" onClick={() => setEditingId(null)}>Cancel</IonButton>
                </IonButtons>
              </div>
            )}
          </IonCardContent>
        </IonCard>
      ))}

      <IonCard>
        <IonCardContent>
          <h3>Create a new draft</h3>
          <IonInput label="use_case, e.g. reminder" labelPlacement="stacked" value={useCase} onIonInput={(e) => setUseCase(e.detail.value ?? "")} />
          <IonTextarea label="content" labelPlacement="stacked" value={content} onIonInput={(e) => setContent(e.detail.value ?? "")} autoGrow />
          <IonButton onClick={async () => { await api.createTemplate(useCase, content); setUseCase(""); setContent(""); load(); }}>Save as draft</IonButton>
        </IonCardContent>
      </IonCard>
    </IonContent>
  );
}
