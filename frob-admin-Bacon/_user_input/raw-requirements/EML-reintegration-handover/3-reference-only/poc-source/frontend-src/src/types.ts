// Shared types, mirroring the Worker API's shapes. POC only.

export interface Booking {
  id: string;
  party_leader_name: string;
  party_leader_email: string;
  tour_name: string;
  amount_paid_pence: number;
  deposit_pence: number;
  hours_until_departure: number;
  status: "confirmed" | "cancelled" | "completed";
}

export interface Template {
  id: string;
  use_case: string;
  status: "draft" | "active" | "retired";
  content: string;
  created_at: string;
  published_at: string | null;
  retired_at: string | null;
}

export interface CancellationRequest {
  id: string;
  booking_id: string;
  hours_until_departure: number;
  resolved: number;
  refund_kind: string | null;
  refund_pence: number | null;
  tour_name: string;
  party_leader_name: string;
  amount_paid_pence: number;
  deposit_pence: number;
  refund_outcome: string;
  refund_cutoff_hours: number;
}

export interface CoLeader {
  id: string;
  booking_id: string;
  name: string | null;
  email: string;
  opted_in: number;
  created_at: string;
}

export interface Enquiry {
  id: string;
  prospect_name: string;
  prospect_email: string;
  question: string;
  replied: number;
  acknowledged: number;
}

export interface NotificationSettings {
  enquiry_auto_acknowledge_enabled: number;
  refund_cutoff_hours: number;
  reminder_milestones: string[];
  cancellation_remediation_options: ("refund" | "rebook" | "credit")[];
}

export interface EmailRowData {
  kind: "sent" | "received";
  id: string;
  subject: string;
  useCase?: string;
  recipients?: string[];
  from?: string;
  bookingId: string | null;
  body: string;
  isSpam: boolean;
  categorisation: "linked" | "unlinked" | "ambiguous";
  threadId?: string;
  sentAt: string;
  deliveryStatus?: "not-attempted" | "sent" | "failed";
  deliveryError?: string | null;
}

export type Initiator = "customer" | "admin" | "system";

export const AUTOMATED_USE_CASES = [
  "booking_confirmation", "reminder", "cancellation_approved",
  "company_cancellation", "weather_cancellation", "payment_receipt", "review_request",
];

export function initiatorOf(r: EmailRowData): { who: Initiator; label: string; detail: string; color: string; bg: string } {
  if (r.kind === "received") {
    return { who: "customer", label: "Customer-initiated", detail: `from ${r.from || "customer"}`, color: "#e65100", bg: "#fff3e0" };
  }
  if (r.useCase && AUTOMATED_USE_CASES.includes(r.useCase)) {
    return { who: "system", label: "Automated (admin-triggered)", detail: "sent automatically by the system", color: "#1565c0", bg: "#e3f2fd" };
  }
  return { who: "admin", label: "Written by admin", detail: "typed by the Owner, just now", color: "#2e7d32", bg: "#e8f5e9" };
}
