import { IonCard, IonCardContent, IonContent, IonTitle } from "@ionic/react";

export function RemindersScreen() {
  return (
    <IonContent className="ion-padding">
      <IonTitle className="ion-no-padding" style={{ marginBottom: 12 }}>Reminders</IonTitle>
      <IonCard color="warning">
        <IonCardContent>
          <b>This screen doesn't exist yet — shown here on purpose so the gap is visible.</b>
          <p>
            The plan is: a reminder email goes out automatically 7 days before a trip, and again the day before.
            That part of the design (the email text itself) is ready — see the "reminder" template under Email
            Templates. What's missing is the actual trigger: nothing in this prototype checks "is a trip 7 days
            away?" and fires the email on its own. Everything else in this tool (confirmations, cancellations,
            receipts) is triggered by a button here because there's no real calendar/clock behind this
            prototype — reminders are the one place that gap actually matters, since they're not triggered by
            a person doing anything.
          </p>
        </IonCardContent>
      </IonCard>
    </IonContent>
  );
}
