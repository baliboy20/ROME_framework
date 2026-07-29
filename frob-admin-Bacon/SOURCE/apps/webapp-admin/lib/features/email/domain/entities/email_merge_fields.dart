/// REQ-NOTIF10 (CR-002/CHG-001) — per-use_case merge-field catalogue + sample
/// data, mirroring the worker's OUTCOME_FIELDS contract
/// (SOURCE/worker/src/modules/notifications/booking-outcome.ts). The A5c
/// editor surfaces these as insertable `{{ field }}` chips (UXD-20) and the
/// live preview substitutes the same sample values the server test-send uses.
/// Use-cases outside the booking flavours declare no fields — unknown tokens
/// render blank (existing REQ-NOTIF10 rule).
library;

class MergeFieldCatalogueEntry {
  final String label;
  final List<String> fields;
  final Map<String, String> sample;
  const MergeFieldCatalogueEntry({required this.label, required this.fields, required this.sample});
}

const Map<String, MergeFieldCatalogueEntry> kMergeFieldCatalogue = {
  'booking_confirmed_paid': MergeFieldCatalogueEntry(
    label: 'Booking confirmed — paid in full',
    fields: ['name', 'tour', 'date', 'time', 'party_size', 'amount_paid', 'booking_ref', 'meeting_point'],
    sample: {
      'name': 'Alex Rivers',
      'tour': 'Golden Hour City',
      'date': '2026-08-15',
      'time': '18:30',
      'party_size': '2',
      'amount_paid': '£110.00',
      'booking_ref': 'FOB-8K2M4Q',
      'meeting_point': 'Barbican Centre, Silk Street, London EC2Y 8DS',
    },
  ),
  'booking_deposit_received': MergeFieldCatalogueEntry(
    label: 'Deposit received — balance due',
    fields: ['name', 'tour', 'date', 'party_size', 'amount_paid', 'balance_due', 'completion_link'],
    sample: {
      'name': 'Alex Rivers',
      'tour': 'Golden Hour City',
      'date': '2026-08-15',
      'party_size': '2',
      'amount_paid': '£30.00',
      'balance_due': '£80.00',
      'completion_link': 'https://friendsonbikes.uk/en/book/?mode=complete&token=…',
    },
  ),
  'booking_reserved_unpaid': MergeFieldCatalogueEntry(
    label: 'Reserved — awaiting payment',
    fields: ['name', 'tour', 'date', 'party_size', 'completion_link', 'meeting_point'],
    sample: {
      'name': 'Alex Rivers',
      'tour': 'Golden Hour City',
      'date': '2026-08-15',
      'party_size': '2',
      'completion_link': 'https://friendsonbikes.uk/en/book/?mode=complete&token=…',
      'meeting_point': 'Barbican Centre, Silk Street, London EC2Y 8DS',
    },
  ),
};

/// Insertable merge fields for a use_case (empty when none are declared).
List<String> mergeFieldsForUseCase(String useCase) =>
    kMergeFieldCatalogue[useCase]?.fields ?? const [];

/// Sample merge data for the live preview — same source the test-send uses.
Map<String, String> sampleDataForUseCase(String useCase) =>
    kMergeFieldCatalogue[useCase]?.sample ?? const {};
