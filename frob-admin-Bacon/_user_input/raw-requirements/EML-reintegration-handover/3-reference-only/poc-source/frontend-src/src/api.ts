// Thin fetch wrapper over the existing Worker API. No endpoints changed for the React
// rewrite — this file exists so components never construct a fetch call by hand.
import type { Booking, Template, CancellationRequest, CoLeader, Enquiry, EmailRowData, NotificationSettings } from "./types";

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: options?.body ? { "content-type": "application/json", ...options.headers } : options?.headers,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as any)?.error ?? `Request failed (${res.status})`);
  return body as T;
}

export const api = {
  // Templates (REQ-EML10)
  listTemplates: () => req<Template[]>("/api/templates"),
  createTemplate: (useCase: string, content: string) =>
    req<{ ok: true; id: string }>("/api/templates", { method: "POST", body: JSON.stringify({ useCase, content }) }),
  publishTemplate: (id: string) => req<{ ok: true }>(`/api/templates/${id}/publish`, { method: "POST" }),
  updateTemplate: (id: string, content: string) =>
    req<{ ok: true }>(`/api/templates/${id}`, { method: "PATCH", body: JSON.stringify({ content }) }),
  deleteTemplate: (id: string) => req<{ ok: true }>(`/api/templates/${id}`, { method: "DELETE" }),

  // Cancellations (REQ-EML03/04)
  listCancellations: () => req<CancellationRequest[]>("/api/cancellations"),
  approveCancellation: (id: string, manualRefundPence?: number) =>
    req<{ ok: true; outcome: unknown }>(`/api/cancellations/${id}/approve`, { method: "POST", body: JSON.stringify({ manualRefundPence }) }),

  // Company cancellation (REQ-EML05)
  companyCancellation: (bookingId: string, explanation: string, remediationType: "refund" | "rebook" | "credit") =>
    req<{ ok: true; discountCode: string; remediationType: string }>("/api/company-cancellations", { method: "POST", body: JSON.stringify({ bookingId, explanation, remediationType }) }),

  // Enquiries (REQ-EML09)
  listEnquiries: () => req<Enquiry[]>("/api/enquiries"),
  replyEnquiry: (id: string, reply: string) => req<{ ok: true }>(`/api/enquiries/${id}/reply`, { method: "POST", body: JSON.stringify({ reply }) }),

  // Settings — enquiry auto-ack (REQ-EML18/DR-15) + configurable cutoff/cadence/remediation (DR-16)
  getSettings: () => req<NotificationSettings>("/api/settings"),
  updateSettings: (patch: Partial<{
    enquiryAutoAcknowledgeEnabled: boolean;
    refundCutoffHours: number;
    reminderMilestones: string[];
    cancellationRemediationOptions: string[];
  }>) => req<{ ok: true }>("/api/settings", { method: "PATCH", body: JSON.stringify(patch) }),

  // Archive / search / export / link / reply (REQ-EML12/13/14/17)
  searchArchive: (q: string) => req<EmailRowData[]>(`/api/archive?q=${encodeURIComponent(q)}`),
  exportArchive: (fail?: boolean) => req<{ ok: true; file: string }>(`/api/archive/export${fail ? "?fail=1" : ""}`, { method: "POST" }),
  linkThread: (threadId: string, bookingId: string) =>
    req<{ ok: true }>(`/api/threads/${threadId}/link`, { method: "POST", body: JSON.stringify({ bookingId }) }),
  replyThread: (threadId: string, reply: string) =>
    req<{ ok: true; delivery: string; deliveryError?: string }>(`/api/threads/${threadId}/reply`, { method: "POST", body: JSON.stringify({ reply }) }),

  // Bookings + Co-leaders (REQ-EML15/16)
  listBookings: () => req<Booking[]>("/api/bookings"),
  listCoLeaders: (bookingId: string) => req<CoLeader[]>(`/api/bookings/${bookingId}/coleaders`),
  addCoLeader: (bookingId: string, name: string, email: string) =>
    req<{ ok: true; id: string }>(`/api/bookings/${bookingId}/coleaders`, { method: "POST", body: JSON.stringify({ name, email }) }),
  toggleCoLeader: (id: string) => req<{ ok: true }>(`/api/coleaders/${id}/toggle`, { method: "POST" }),
  removeCoLeader: (id: string) => req<{ ok: true }>(`/api/coleaders/${id}`, { method: "DELETE" }),
  initiateMessage: (bookingId: string, message: string) =>
    req<{ ok: true; delivery: string; deliveryError?: string }>(`/api/bookings/${bookingId}/initiate-message`, { method: "POST", body: JSON.stringify({ message }) }),

  // External module mocks
  mockCreateBooking: (payload: { partyLeaderName: string; partyLeaderEmail: string; tourName: string; amountPaidPence: number; depositPence: number; hoursUntilDeparture: number }) =>
    req<{ ok: true; id: string }>("/api/mock/bookings", { method: "POST", body: JSON.stringify(payload) }),
  mockSubmitCancellation: (bookingId: string) =>
    req<{ ok: true; id: string }>("/api/mock/cancellation-requests", { method: "POST", body: JSON.stringify({ bookingId }) }),
  mockWeatherEvent: (bookingId: string) => req<{ ok: true }>("/api/mock/weather-event", { method: "POST", body: JSON.stringify({ bookingId }) }),
  mockDepartureCompleted: (bookingId: string) => req<{ ok: true }>("/api/mock/departure-completed", { method: "POST", body: JSON.stringify({ bookingId }) }),
  mockPaymentEvent: (bookingId: string, kind: string, amountPence: number) =>
    req<{ ok: true }>("/api/mock/payment-events", { method: "POST", body: JSON.stringify({ bookingId, kind, amountPence }) }),
  mockSubmitEnquiry: (prospectName: string, prospectEmail: string, question: string) =>
    req<{ ok: true; id: string }>("/api/mock/enquiries", { method: "POST", body: JSON.stringify({ prospectName, prospectEmail, question }) }),
  mockInbound: (fromAddress: string, subject: string, body: string, isSpam: boolean) =>
    req<{ ok: true; result: { status: string; bookingId?: string } }>("/api/mock/inbound", { method: "POST", body: JSON.stringify({ fromAddress, subject, body, isSpam }) }),
};
