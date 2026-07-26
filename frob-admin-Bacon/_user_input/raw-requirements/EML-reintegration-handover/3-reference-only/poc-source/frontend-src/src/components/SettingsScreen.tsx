import { useEffect, useState } from "react";
import {
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonInput, IonItem,
  IonLabel, IonList, IonNote, IonTitle, IonToggle, IonCheckbox,
} from "@ionic/react";
import { api } from "../api";
import type { NotificationSettings } from "../types";

const MILESTONE_OPTIONS = [
  { key: "t_minus_7", label: "7 days before departure" },
  { key: "t_minus_24h", label: "24 hours before departure" },
  { key: "t_minus_1", label: "1 day before departure" },
];

const REMEDIATION_OPTIONS = [
  { key: "refund", label: "Refund" },
  { key: "rebook", label: "Rebook for another date" },
  { key: "credit", label: "Account credit" },
] as const;

export function SettingsScreen() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [error, setError] = useState("");

  function load() { api.getSettings().then(setSettings); }
  useEffect(load, []);

  async function patch(p: Parameters<typeof api.updateSettings>[0]) {
    try {
      await api.updateSettings(p);
      setError("");
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!settings) return <IonContent className="ion-padding" />;

  return (
    <IonContent className="ion-padding">
      <IonTitle className="ion-no-padding" style={{ marginBottom: 12 }}>Settings</IonTitle>
      <IonCard color="light">
        <IonCardContent>
          These are business rules, not fixed constants — each one is an Owner call, not something
          this tool should hardcode. Changing one here takes effect on the next matching action, not
          retroactively.
        </IonCardContent>
      </IonCard>
      {error && <IonNote color="danger" style={{ display: "block", marginBottom: 8 }}>{error}</IonNote>}

      <IonCard>
        <IonCardHeader><IonCardTitle>Cancellation refund cutoff</IonCardTitle></IonCardHeader>
        <IonCardContent>
          <p>
            More than this many hours before departure, a customer who cancels gets a full refund
            automatically. Inside this window, nothing is calculated for you — you decide the refund
            amount yourself when you approve the request.
          </p>
          <IonItem lines="none">
            <IonLabel position="stacked">Cutoff (hours before departure)</IonLabel>
            <IonInput
              type="number"
              value={settings.refund_cutoff_hours}
              onIonChange={(e) => {
                const n = Number(e.detail.value);
                if (!Number.isNaN(n) && n > 0) patch({ refundCutoffHours: n });
              }}
            />
          </IonItem>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader><IonCardTitle>Reminder timing</IonCardTitle></IonCardHeader>
        <IonCardContent>
          <p>
            Which milestones a confirmed booking gets a reminder for. (This records the setting — the
            actual scheduled trigger to check "is a trip due?" isn't built in this prototype yet, see
            the Reminders screen.)
          </p>
          <IonList lines="none">
            {MILESTONE_OPTIONS.map((m) => (
              <IonItem key={m.key}>
                <IonCheckbox
                  slot="start"
                  checked={settings.reminder_milestones.includes(m.key)}
                  onIonChange={(e) => {
                    const next = e.detail.checked
                      ? [...settings.reminder_milestones, m.key]
                      : settings.reminder_milestones.filter((k) => k !== m.key);
                    patch({ reminderMilestones: next });
                  }}
                />
                <IonLabel>{m.label}</IonLabel>
              </IonItem>
            ))}
          </IonList>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader><IonCardTitle>Cancellation remediation options</IonCardTitle></IonCardHeader>
        <IonCardContent>
          <p>
            When you cancel a booking on the business's behalf (weather, not enough people, etc.),
            which of these can be offered to the customer. At least one must stay enabled.
          </p>
          <IonList lines="none">
            {REMEDIATION_OPTIONS.map((r) => (
              <IonItem key={r.key}>
                <IonCheckbox
                  slot="start"
                  checked={settings.cancellation_remediation_options.includes(r.key)}
                  onIonChange={(e) => {
                    const next = e.detail.checked
                      ? [...settings.cancellation_remediation_options, r.key]
                      : settings.cancellation_remediation_options.filter((k) => k !== r.key);
                    patch({ cancellationRemediationOptions: next });
                  }}
                />
                <IonLabel>{r.label}</IonLabel>
              </IonItem>
            ))}
          </IonList>
        </IonCardContent>
      </IonCard>

      <IonCard>
        <IonCardHeader><IonCardTitle>Enquiry auto-acknowledgement</IonCardTitle></IonCardHeader>
        <IonCardContent>
          <p>
            When on, the moment a question arrives it gets a generic "we got it, a real reply is
            coming" message — it does <b>not</b> count as answering the question. You still have to
            reply yourself under "Questions from customers" for anything specific.
          </p>
          <IonItem lines="none">
            <IonToggle
              checked={!!settings.enquiry_auto_acknowledge_enabled}
              onIonChange={(e) => patch({ enquiryAutoAcknowledgeEnabled: e.detail.checked })}
            >
              <IonLabel>Auto-acknowledge new questions from customers</IonLabel>
            </IonToggle>
          </IonItem>
        </IonCardContent>
      </IonCard>
    </IonContent>
  );
}
