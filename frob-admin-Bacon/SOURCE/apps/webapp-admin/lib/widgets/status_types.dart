/// Shared presentation enums for the status/readiness widgets. These are pure
/// UI vocabulary (pill hue + readiness dot), kept out of the domain layer; each
/// feature maps its own domain status onto these at the presentation boundary.
library;

/// Payment/booking pill state (StatusPill widget).
enum StatusPillState { succeeded, requiresPayment, refunded, failed, noShow, draft }

String statusLabel(StatusPillState s) {
  switch (s) {
    case StatusPillState.succeeded:
      return 'Succeeded';
    case StatusPillState.requiresPayment:
      return 'Requires payment';
    case StatusPillState.refunded:
      return 'Refunded';
    case StatusPillState.failed:
      return 'Failed';
    case StatusPillState.noShow:
      return 'No-show';
    case StatusPillState.draft:
      return 'Draft';
  }
}

/// Per-dimension readiness for the ReadinessBadge widget (UXD-07).
enum ReadinessSub { yes, partial, no }
