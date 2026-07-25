/// Domain models for the guide app's six-step pre-departure playbook
/// (G2-G8) plus during/after-tour surfaces (G9-G13).
/// UXC-STA-1: playbook step status is a three-value machine.
enum StepStatus { todo, current, done }

/// UXD-G-01: fixed sign-off weight per surface — typed-confirm vs
/// full-signature. A surface never offers both.
enum SignOffMode { typedConfirm, fullSignature }

class PlaybookStep {
  PlaybookStep({
    required this.id,
    required this.title,
    required this.subLabel,
    required this.mode,
    this.status = StepStatus.todo,
  });

  final String id; // 'G3'..'G8'
  final String title;
  final String subLabel; // e.g. "G3 · Typed confirm"
  final SignOffMode mode;
  StepStatus status;
}

/// UXD-G-03: risk item state machine — high-unresolved (blocks sign-off) /
/// mitigated / (overall) signed.
enum RiskLevel { low, medium, high }

class RiskItem {
  RiskItem({
    required this.id,
    required this.label,
    required this.level,
    this.mitigated = false,
    this.mitigationNote,
  });

  final String id;
  final String label;
  final RiskLevel level;
  bool mitigated;
  String? mitigationNote;

  bool get blocksSignOff => level == RiskLevel.high && !mitigated;
}

class BikePoint {
  BikePoint({required this.label, this.checked = false});
  final String label;
  bool checked;
}

class BikeInspection {
  BikeInspection({required this.bikeId, required this.points});
  final String bikeId;
  final List<BikePoint> points;

  bool get allChecked => points.every((p) => p.checked);
}

/// UXD-G-04 / UXC-STA-3: rider check-in status.
enum RiderStatus { pending, checked, refused }

class RiderCheckin {
  RiderCheckin({
    required this.id,
    required this.name,
    this.status = RiderStatus.pending,
    this.refusalReason,
  });

  final String id;
  final String name;
  RiderStatus status;
  String? refusalReason;
}

class KitItem {
  KitItem({required this.label, this.checked = false});
  final String label;
  bool checked;
}

/// The full mutable state of one guide's tour-day session — persisted to
/// sembast_web on every mutation (UXC-SCR-2 / TDR-16 offline-critical).
class TourSession {
  TourSession({
    required this.tourName,
    required this.tourMeta,
    required this.departureId,
    List<KitItem>? kitItems,
    List<BikeInspection>? bikes,
    List<RiskItem>? riskItems,
    List<RiderCheckin>? riders,
    this.kitSignatory,
    this.bikeSignatory,
    this.riskSignatory,
    this.checkinSignatory,
    this.briefingAcknowledged = false,
    this.finalSignatory,
    this.finalSignedOff = false,
    this.reviewDraft,
    this.lastIncidentId,
  })  : kitItems = kitItems ?? _defaultKit(),
        bikes = bikes ?? _defaultBikes(),
        riskItems = riskItems ?? _defaultRisks(),
        riders = riders ?? _defaultRiders();

  final String tourName;
  String tourMeta;
  final String departureId;

  final List<KitItem> kitItems;
  final List<BikeInspection> bikes;
  final List<RiskItem> riskItems;
  final List<RiderCheckin> riders;

  String? kitSignatory;
  String? bikeSignatory;
  String? riskSignatory;
  String? checkinSignatory;
  bool briefingAcknowledged;
  String? finalSignatory;
  bool finalSignedOff;

  PostRideDraft? reviewDraft;

  /// REQ-OPS11 id source: the id returned by the last POST /guide/incidents
  /// (G10). G12's formal report PATCHes /guide/incidents/:id/report and has
  /// no other id source in this app, so it targets this.
  String? lastIncidentId;

  static List<KitItem> _defaultKit() => [
        KitItem(label: 'First aid kit'),
        KitItem(label: 'Puncture repair kit'),
        KitItem(label: 'Spare inner tubes (x2)'),
        KitItem(label: 'Multi-tool'),
        KitItem(label: 'Pump'),
        KitItem(label: 'Radio / phone charged'),
      ];

  static List<BikeInspection> _defaultBikes() => [
        BikeInspection(bikeId: 'FOB-001', points: _points()),
        BikeInspection(bikeId: 'FOB-002', points: _points()),
        BikeInspection(bikeId: 'FOB-003', points: _points()),
      ];

  static List<BikePoint> _points() => [
        BikePoint(label: 'Brakes'),
        BikePoint(label: 'Tyres'),
        BikePoint(label: 'Chain'),
        BikePoint(label: 'Lights'),
      ];

  static List<RiskItem> _defaultRisks() => [
        RiskItem(id: 'r1', label: 'Wet road surface', level: RiskLevel.medium),
        RiskItem(id: 'r2', label: 'Roadworks on route', level: RiskLevel.high),
        RiskItem(id: 'r3', label: 'Low sun glare (evening leg)', level: RiskLevel.low),
      ];

  static List<RiderCheckin> _defaultRiders() => [
        RiderCheckin(id: 'p1', name: 'A. Whitfield'),
        RiderCheckin(id: 'p2', name: 'J. Okafor'),
        RiderCheckin(id: 'p3', name: 'S. Mbeki'),
      ];

  // --- Derived state (UXD-G-11 / design-system §8.4a: "derived, not
  // stored" — G2 progress is computed, never a persisted field) ---

  StepStatus stepStatus(String stepId) {
    switch (stepId) {
      case 'G3':
        return kitSignatory != null ? StepStatus.done : StepStatus.todo;
      case 'G4':
        return (bikeSignatory != null && bikes.every((b) => b.allChecked))
            ? StepStatus.done
            : StepStatus.todo;
      case 'G5':
        return (riskSignatory != null && !riskItems.any((r) => r.blocksSignOff))
            ? StepStatus.done
            : StepStatus.todo;
      case 'G6':
        return (checkinSignatory != null &&
                riders.every((r) => r.status != RiderStatus.pending))
            ? StepStatus.done
            : StepStatus.todo;
      case 'G7':
        return briefingAcknowledged ? StepStatus.done : StepStatus.todo;
      case 'G8':
        return finalSignedOff ? StepStatus.done : StepStatus.todo;
      default:
        return StepStatus.todo;
    }
  }

  int get completedCount =>
      ['G3', 'G4', 'G5', 'G6', 'G7', 'G8'].where((s) => stepStatus(s) == StepStatus.done).length;

  /// UXD-G-05: outstanding upstream steps (G3-G7 not done) block G8.
  List<String> get outstandingBeforeFinal => ['G3', 'G4', 'G5', 'G6', 'G7']
      .where((s) => stepStatus(s) != StepStatus.done)
      .toList();

  bool get hasUnresolvedHighRisk => riskItems.any((r) => r.blocksSignOff);

  // --- JSON (de)serialisation for sembast_web offline persistence
  // (TDR-16) — supports UXC-SCR-2 "in-progress input survives
  // interruption" and UXD-G-08 draft-save. ---

  Map<String, Object?> toJson() => {
        'tourName': tourName,
        'tourMeta': tourMeta,
        'departureId': departureId,
        'kitItems': kitItems.map((k) => {'label': k.label, 'checked': k.checked}).toList(),
        'bikes': bikes
            .map((b) => {
                  'bikeId': b.bikeId,
                  'points': b.points.map((p) => {'label': p.label, 'checked': p.checked}).toList(),
                })
            .toList(),
        'riskItems': riskItems
            .map((r) => {
                  'id': r.id,
                  'label': r.label,
                  'level': r.level.name,
                  'mitigated': r.mitigated,
                  'mitigationNote': r.mitigationNote,
                })
            .toList(),
        'riders': riders
            .map((r) => {
                  'id': r.id,
                  'name': r.name,
                  'status': r.status.name,
                  'refusalReason': r.refusalReason,
                })
            .toList(),
        'kitSignatory': kitSignatory,
        'bikeSignatory': bikeSignatory,
        'riskSignatory': riskSignatory,
        'checkinSignatory': checkinSignatory,
        'briefingAcknowledged': briefingAcknowledged,
        'finalSignatory': finalSignatory,
        'finalSignedOff': finalSignedOff,
        'lastIncidentId': lastIncidentId,
        'reviewDraft': reviewDraft == null
            ? null
            : {
                'hazardsOrRouteChanges': reviewDraft!.hazardsOrRouteChanges,
                'incidentsOrNearMisses': reviewDraft!.incidentsOrNearMisses,
                'qualityAssessment': reviewDraft!.qualityAssessment,
                'bikeServiceFlagBikeId': reviewDraft!.bikeServiceFlagBikeId,
                'submitted': reviewDraft!.submitted,
              },
      };

  static TourSession fromJson(Map<String, Object?> json) {
    final session = TourSession(
      tourName: json['tourName'] as String,
      tourMeta: json['tourMeta'] as String,
      departureId: json['departureId'] as String,
      kitItems: (json['kitItems'] as List)
          .map((e) => KitItem(label: e['label'] as String, checked: e['checked'] as bool))
          .toList(),
      bikes: (json['bikes'] as List)
          .map((e) => BikeInspection(
                bikeId: e['bikeId'] as String,
                points: (e['points'] as List)
                    .map((p) => BikePoint(label: p['label'] as String, checked: p['checked'] as bool))
                    .toList(),
              ))
          .toList(),
      riskItems: (json['riskItems'] as List)
          .map((e) => RiskItem(
                id: e['id'] as String,
                label: e['label'] as String,
                level: RiskLevel.values.byName(e['level'] as String),
                mitigated: e['mitigated'] as bool,
                mitigationNote: e['mitigationNote'] as String?,
              ))
          .toList(),
      riders: (json['riders'] as List)
          .map((e) => RiderCheckin(
                id: e['id'] as String,
                name: e['name'] as String,
                status: RiderStatus.values.byName(e['status'] as String),
                refusalReason: e['refusalReason'] as String?,
              ))
          .toList(),
      kitSignatory: json['kitSignatory'] as String?,
      bikeSignatory: json['bikeSignatory'] as String?,
      riskSignatory: json['riskSignatory'] as String?,
      checkinSignatory: json['checkinSignatory'] as String?,
      briefingAcknowledged: json['briefingAcknowledged'] as bool? ?? false,
      finalSignatory: json['finalSignatory'] as String?,
      finalSignedOff: json['finalSignedOff'] as bool? ?? false,
      lastIncidentId: json['lastIncidentId'] as String?,
    );
    final draftJson = json['reviewDraft'] as Map?;
    if (draftJson != null) {
      session.reviewDraft = PostRideDraft(
        hazardsOrRouteChanges: (draftJson['hazardsOrRouteChanges'] as String?) ?? '',
        incidentsOrNearMisses: (draftJson['incidentsOrNearMisses'] as String?) ?? '',
        qualityAssessment: (draftJson['qualityAssessment'] as String?) ?? '',
        bikeServiceFlagBikeId: draftJson['bikeServiceFlagBikeId'] as String?,
        submitted: (draftJson['submitted'] as bool?) ?? false,
      );
    }
    return session;
  }
}

/// UXD-G-08: post-ride review is draft-or-submitted, never re-editable
/// once submitted (UXC-STA-2). REQ-OPS10 is a structured operational
/// debrief (hazards / incidents / quality / bike-to-flag) — not a
/// customer-style star rating.
class PostRideDraft {
  PostRideDraft({
    this.hazardsOrRouteChanges = '',
    this.incidentsOrNearMisses = '',
    this.qualityAssessment = '',
    this.bikeServiceFlagBikeId,
    this.submitted = false,
  });

  String hazardsOrRouteChanges;
  String incidentsOrNearMisses;
  String qualityAssessment;
  String? bikeServiceFlagBikeId;
  bool submitted;
}
