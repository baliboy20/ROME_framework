import { useState } from "react";
import {
  IonApp, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonListHeader,
  IonMenu, IonMenuToggle, IonPage, IonSplitPane, IonTitle, IonToolbar, setupIonicReact,
} from "@ionic/react";
import {
  mailOutline, closeCircleOutline, personOutline, businessOutline, flashOutline,
  informationCircleOutline, cloudOutline,
} from "ionicons/icons";

import { HomeScreen } from "./components/HomeScreen";
import { CancellationsScreen } from "./components/CancellationsScreen";
import { EnquiriesScreen } from "./components/EnquiriesScreen";
import { BookingsScreen } from "./components/BookingsScreen";
import { TemplatesScreen } from "./components/TemplatesScreen";
import { RemindersScreen } from "./components/RemindersScreen";
import { CoverageScreen } from "./components/CoverageScreen";
import { ScenariosScreen } from "./components/ScenariosScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { MockBooking } from "./components/mocks/MockBooking";
import { MockPayment } from "./components/mocks/MockPayment";
import { MockPresales } from "./components/mocks/MockPresales";
import { MockInbound } from "./components/mocks/MockInbound";

setupIonicReact({ mode: "ios" }); // force Cupertino look regardless of platform

type Tab =
  | "home" | "cancellations" | "enquiries" | "bookings" | "templates" | "reminders" | "coverage" | "scenarios" | "settings"
  | "mock-booking" | "mock-payment" | "mock-presales" | "mock-inbound";

const SCREENS: Record<Tab, React.ComponentType> = {
  home: HomeScreen,
  cancellations: CancellationsScreen,
  enquiries: EnquiriesScreen,
  bookings: BookingsScreen,
  templates: TemplatesScreen,
  reminders: RemindersScreen,
  coverage: CoverageScreen,
  scenarios: ScenariosScreen,
  settings: SettingsScreen,
  "mock-booking": MockBooking,
  "mock-payment": MockPayment,
  "mock-presales": MockPresales,
  "mock-inbound": MockInbound,
};

const NAV_GROUPS: { label: string; icon: string; items: { tab: Tab; label: string }[] }[] = [
  { label: "Home", icon: mailOutline, items: [{ tab: "home", label: "All emails" }] },
  { label: "a) Customer-initiated", icon: personOutline, items: [
    { tab: "cancellations", label: "Cancellation requests" },
    { tab: "enquiries", label: "Questions from customers" },
  ] },
  { label: "b) Owner-initiated", icon: businessOutline, items: [
    { tab: "bookings", label: "Bookings" },
  ] },
  { label: "c) Auto-generated", icon: flashOutline, items: [
    { tab: "templates", label: "Email Templates" },
    { tab: "reminders", label: "Reminders" },
    { tab: "settings", label: "Settings" },
  ] },
  { label: "Reference", icon: informationCircleOutline, items: [
    { tab: "coverage", label: "What's covered? (checklist)" },
    { tab: "scenarios", label: "Life-cycle scenarios" },
  ] },
  { label: "Stand-ins for other systems", icon: cloudOutline, items: [
    { tab: "mock-booking", label: "Booking website" },
    { tab: "mock-payment", label: "Payment company" },
    { tab: "mock-presales", label: "Enquiry form" },
    { tab: "mock-inbound", label: "Incoming email" },
  ] },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const Screen = SCREENS[tab];
  const isExternal = tab.startsWith("mock-");

  return (
    <IonApp>
      <IonSplitPane contentId="main-content" when="md">
        <IonMenu contentId="main-content" type="overlay">
          <IonHeader>
            <IonToolbar>
              <IonTitle>Friends on Bikes</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonList>
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <IonListHeader>
                    <IonIcon icon={group.icon} style={{ marginRight: 8 }} />
                    <IonLabel>{group.label}</IonLabel>
                  </IonListHeader>
                  {group.items.map((item) => (
                    <IonMenuToggle key={item.tab} autoHide={false}>
                      <IonItem button detail={false} color={tab === item.tab ? "light" : undefined} onClick={() => setTab(item.tab)}>
                        <IonLabel>{item.label}</IonLabel>
                        {item.tab.toString().startsWith("mock-") && <IonIcon icon={closeCircleOutline} slot="end" color="warning" title="Not part of this admin tool" />}
                      </IonItem>
                    </IonMenuToggle>
                  ))}
                </div>
              ))}
            </IonList>
          </IonContent>
        </IonMenu>

        <IonPage id="main-content">
          <IonHeader>
            <IonToolbar color={isExternal ? "warning" : "primary"}>
              <IonTitle>{isExternal ? "External module stand-in — not this project's build scope" : "Friends on Bikes — Admin"}</IonTitle>
            </IonToolbar>
          </IonHeader>
          <Screen />
        </IonPage>
      </IonSplitPane>
    </IonApp>
  );
}
