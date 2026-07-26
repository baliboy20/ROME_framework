import { useEffect, useState, useCallback } from "react";
import {
  IonButton, IonButtons, IonCard, IonCardContent, IonContent, IonIcon, IonLabel,
  IonList, IonSearchbar, IonSegment, IonSegmentButton, IonText, IonTextarea, IonToast, IonTitle,
} from "@ionic/react";
import { downloadOutline } from "ionicons/icons";
import { api } from "../api";
import type { EmailRowData, Initiator } from "../types";
import { EmailRow } from "./EmailRow";

const FILTERS: { key: Initiator | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "customer", label: "a) Customer" },
  { key: "admin", label: "b) Owner" },
  { key: "system", label: "c) Auto" },
];

const SYSTEM_USE_CASES = ["booking_confirmation", "reminder", "cancellation_approved", "company_cancellation", "weather_cancellation", "payment_receipt", "review_request"];

export function HomeScreen() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Initiator | "all">("all");
  const [rows, setRows] = useState<EmailRowData[]>([]);
  const [toast, setToast] = useState<{ open: boolean; text: string; color: string }>({ open: false, text: "", color: "success" });

  const load = useCallback(() => {
    api.searchArchive(q).then(setRows).catch(() => setRows([]));
  }, [q]);

  useEffect(() => { load(); }, [load]);

  const visible = filter === "all" ? rows : rows.filter((r) => {
    if (filter === "customer") return r.kind === "received";
    if (filter === "system") return r.kind === "sent" && !!r.useCase && SYSTEM_USE_CASES.includes(r.useCase);
    return r.kind === "sent" && !(r.useCase && SYSTEM_USE_CASES.includes(r.useCase));
  });

  async function doExport(fail: boolean) {
    try {
      const res = await api.exportArchive(fail);
      setToast({ open: true, text: `Download ready: ${res.file}`, color: "success" });
    } catch (e) {
      setToast({ open: true, text: (e as Error).message, color: "danger" });
    }
  }

  async function doLink(threadId: string) {
    await api.linkThread(threadId, "BK-1001");
    load();
  }

  return (
    <IonContent className="ion-padding">
      <IonTitle className="ion-no-padding" style={{ marginBottom: 12 }}>All emails</IonTitle>
      <IonCard color="light">
        <IonCardContent>
          Every email this system has ever sent or received, showing who actually started it:{" "}
          <b style={{ color: "#e65100" }}>a) the customer</b> (emailed in, or asked to cancel),{" "}
          <b style={{ color: "#2e7d32" }}>b) the Owner</b> (a reply or a message typed themselves), or{" "}
          <b style={{ color: "#1565c0" }}>c) auto-generated</b> (the system sent it on its own, from a template).
        </IonCardContent>
      </IonCard>

      <IonSegment value={filter} onIonChange={(e) => setFilter(e.detail.value as Initiator | "all")} style={{ marginBottom: 12 }}>
        {FILTERS.map((f) => <IonSegmentButton key={f.key} value={f.key}><IonLabel>{f.label}</IonLabel></IonSegmentButton>)}
      </IonSegment>

      <IonSearchbar value={q} onIonInput={(e) => setQ(e.detail.value ?? "")} placeholder="Search subject, message text, booking, or sender" />
      <IonButtons style={{ marginBottom: 12, flexWrap: "wrap" }}>
        <IonButton fill="outline" onClick={load}>Search</IonButton>
        <IonButton fill="outline" onClick={() => doExport(false)}><IonIcon slot="start" icon={downloadOutline} />Download a backup</IonButton>
        <IonButton fill="outline" color="warning" onClick={() => doExport(true)}>Download (pretend it fails)</IonButton>
      </IonButtons>

      <IonList lines="none">
        {visible.length === 0 ? (
          <IonText color="medium">Nothing matches your search/filter.</IonText>
        ) : (
          visible.map((r) => (
            <EmailRow
              key={r.id}
              row={r}
              actions={
                r.kind === "received" && r.categorisation !== "linked" ? (
                  <IonButton size="small" fill="outline" onClick={() => doLink(r.threadId!)}>Link to BK-1001</IonButton>
                ) : r.kind === "received" && r.categorisation === "linked" ? (
                  <ReplyBox threadId={r.threadId!} to={r.from ?? "customer"} onSent={load} />
                ) : undefined
              }
            />
          ))
        )}
      </IonList>

      <IonToast isOpen={toast.open} message={toast.text} color={toast.color} duration={4000} onDidDismiss={() => setToast((t) => ({ ...t, open: false }))} />
    </IonContent>
  );
}

function ReplyBox({ threadId, to, onSent }: { threadId: string; to: string; onSent: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  if (!open) return <IonButton size="small" fill="outline" onClick={() => setOpen(true)}>Reply</IonButton>;
  return (
    <div>
      <IonCard color="light"><IonCardContent>This reply gets recorded here and sent straight to {to} — REQ-EML17.</IonCardContent></IonCard>
      <IonTextarea placeholder="Your reply" value={text} onIonInput={(e) => setText(e.detail.value ?? "")} autoGrow />
      {error && <IonText color="danger"><p>{error}</p></IonText>}
      <IonButtons>
        <IonButton size="small" fill="solid" onClick={async () => {
          try { await api.replyThread(threadId, text); setOpen(false); setText(""); onSent(); }
          catch (e) { setError((e as Error).message); }
        }}>Send reply</IonButton>
        <IonButton size="small" onClick={() => setOpen(false)}>Cancel</IonButton>
      </IonButtons>
    </div>
  );
}
