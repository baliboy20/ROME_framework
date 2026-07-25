import 'package:flutter_bloc/flutter_bloc.dart';

import '../models/guide_models.dart';
import '../services/api_client.dart';
import '../services/storage_service.dart';

/// Result of a best-effort sync to api-worker. Local state is always
/// persisted first (TDR-16 offline-critical); this reflects the REAL HTTP
/// outcome so a screen can surface a failure instead of faking success.
class SyncOutcome {
  const SyncOutcome.ok()
      : synced = true,
        error = null;
  const SyncOutcome.failed(this.error) : synced = false;

  final bool synced;
  final String? error;
}

/// Single source of truth for the guide's tour-day session. Every mutating
/// method persists to sembast_web immediately (TDR-16 offline-critical,
/// UXC-SCR-2 "in-progress input preserved across interruption") and then
/// best-effort syncs to the API. A network/HTTP failure never blocks local
/// state, but it is now RETURNED to the caller (SyncOutcome) rather than
/// swallowed, so screens can show a real error.
class TourCubit extends Cubit<TourSession> {
  TourCubit(this._store, this._api, TourSession initial) : super(initial) {
    _persist();
  }

  final SessionStore _store;
  final ApiClient _api;

  static Future<TourCubit> restore(SessionStore store, ApiClient api) async {
    final saved = await store.read();
    final session = saved != null ? TourSession.fromJson(saved) : _seed();
    return TourCubit(store, api, session);
  }

  static TourSession _seed() => TourSession(
        tourName: 'Thames Towpath Explorer',
        tourMeta: '1 Aug 2026, 10:00 · TOUR-HID · 90 min',
        departureId: 'DEP-2026-08-01-1000',
      );

  Future<void> _persist() async {
    await _store.write(state.toJson());
  }

  void _emit() {
    emit(state);
    _persist();
  }

  /// Runs an API call, converting any [ApiException] (non-2xx or transport
  /// failure) into a [SyncOutcome] the caller can surface. Local state has
  /// already been persisted by the caller before this runs.
  Future<SyncOutcome> _sync(Future<void> Function() call) async {
    try {
      await call();
      return const SyncOutcome.ok();
    } on ApiException catch (e) {
      return SyncOutcome.failed(e.message);
    } catch (e) {
      return SyncOutcome.failed('Sync failed: $e');
    }
  }

  // --- OPS01 — GET /guide/departures/:id — load today's real assignment ---
  /// Pulls the departure + bookings + participants from api-worker and maps
  /// participants onto the check-in roster, replacing local seed riders.
  /// Offline/404 leaves local state intact and returns the failure.
  Future<SyncOutcome> loadDeparture() async {
    try {
      final data = await _api.get(GuideRoutes.departure(state.departureId));
      final departure = data['departure'] as Map<String, Object?>?;
      final participants = (data['participants'] as List?) ?? const [];

      if (participants.isNotEmpty) {
        final riders = participants.map((p) {
          final m = p as Map<String, Object?>;
          final ageBand = m['age_band'] as String?;
          final notes = m['notes'] as String?;
          final detail = [
            if (ageBand != null && ageBand.isNotEmpty) ageBand,
            if (notes != null && notes.isNotEmpty) notes,
          ].join(' · ');
          return RiderCheckin(
            id: (m['id'] as String?) ?? '',
            name: detail.isEmpty
                ? (m['name'] as String? ?? 'Rider')
                : '${m['name'] as String? ?? 'Rider'} ($detail)',
          );
        }).toList();
        state.riders
          ..clear()
          ..addAll(riders);
      }

      if (departure != null) {
        final date = departure['date'] as String?;
        final time = departure['time'] as String?;
        if (date != null && time != null) {
          state.tourMeta = '$date $time · ${state.departureId}';
        }
      }

      _emit();
      return const SyncOutcome.ok();
    } on ApiException catch (e) {
      return SyncOutcome.failed(e.message);
    } catch (e) {
      return SyncOutcome.failed('Could not load departure: $e');
    }
  }

  // --- G3 travel kit (typed-confirm) ---
  void toggleKit(int index) {
    state.kitItems[index].checked = !state.kitItems[index].checked;
    _emit();
  }

  Future<SyncOutcome> signKit(String typedName) async {
    state.kitSignatory = typedName;
    _emit();
    return _sync(() => _api.patch(GuideRoutes.kit(state.departureId), {
          'critical_items_confirmed': state.kitItems.every((k) => k.checked),
          'typed_confirm_name': typedName,
        }));
  }

  // --- G4 bike inspection (full-signature, UXD-G-02: no shortcut) ---
  void toggleBikePoint(int bikeIndex, int pointIndex) {
    final point = state.bikes[bikeIndex].points[pointIndex];
    point.checked = !point.checked;
    _emit();
  }

  bool get allBikesFullyChecked => state.bikes.every((b) => b.allChecked);

  Future<SyncOutcome> signBikeInspection(String signatory) async {
    if (!allBikesFullyChecked) return const SyncOutcome.failed('Complete every bike first.');
    state.bikeSignatory = signatory;
    _emit();
    return _sync(() => _api.patch(GuideRoutes.bikeInspection(state.departureId), {
          'all_bikes_resolved': allBikesFullyChecked,
          'signature': signatory,
        }));
  }

  // --- G5 risk assessment (typed-confirm, UXD-G-03: high-risk blocks) ---
  void mitigateRisk(String riskId, String note) {
    final risk = state.riskItems.firstWhere((r) => r.id == riskId);
    risk.mitigated = true;
    risk.mitigationNote = note;
    _emit();
  }

  Future<SyncOutcome> signRiskAssessment(String typedName) async {
    if (state.hasUnresolvedHighRisk) {
      return const SyncOutcome.failed('Resolve all high-risk items first.');
    }
    state.riskSignatory = typedName;
    _emit();
    final mitigations = state.riskItems
        .where((r) => r.mitigated && (r.mitigationNote?.isNotEmpty ?? false))
        .map((r) => r.mitigationNote!)
        .toList();
    return _sync(() => _api.patch(GuideRoutes.riskAssessment(state.departureId), {
          'has_unresolved_high_risk': state.hasUnresolvedHighRisk,
          'mitigations': mitigations,
          'typed_confirm_name': typedName,
        }));
  }

  /// Today's mitigations, surfaced on G7 per UXD-G-03.
  List<RiskItem> get todaysMitigations => state.riskItems.where((r) => r.mitigated).toList();

  // --- G6 rider check-in (full-signature, UXD-G-04: guide never handles
  // money; refusal flags for a William-processed refund) ---
  void checkInRider(String riderId) {
    final rider = state.riders.firstWhere((r) => r.id == riderId);
    rider.status = RiderStatus.checked;
    rider.refusalReason = null;
    _emit();
  }

  void refuseRider(String riderId, String reason) {
    final rider = state.riders.firstWhere((r) => r.id == riderId);
    rider.status = RiderStatus.refused;
    rider.refusalReason = reason;
    _emit();
  }

  bool get allRidersResolved => state.riders.every((r) => r.status != RiderStatus.pending);

  /// Maps a UI refusal label to the worker's `refusal_reason` enum
  /// (medical_incompatible / impaired_or_intoxicated / unaccompanied_minor
  /// / waiver_refused).
  static String? _refusalEnum(String? label) {
    switch (label) {
      case 'Medical':
        return 'medical_incompatible';
      case 'Intoxication':
        return 'impaired_or_intoxicated';
      case 'Unaccompanied minor':
        return 'unaccompanied_minor';
      case 'Waiver refused':
        return 'waiver_refused';
      default:
        return label == null ? null : 'waiver_refused';
    }
  }

  /// REQ-OPS05 is PER-RIDER: POST /guide/checkins once for each rider, not a
  /// batch. A refused rider sends waiver_reconfirmed=false + a refusal_reason
  /// enum; a checked rider sends waiver_reconfirmed=true.
  Future<SyncOutcome> signCheckin(String signatory) async {
    if (!allRidersResolved) {
      return const SyncOutcome.failed('Every rider must be checked or refused first.');
    }
    state.checkinSignatory = signatory;
    _emit();
    return _sync(() async {
      for (final r in state.riders) {
        final refused = r.status == RiderStatus.refused;
        await _api.post(GuideRoutes.checkins, {
          'departure_id': state.departureId,
          'participant_id': r.id,
          'bike_id': null,
          'waiver_reconfirmed': !refused,
          'refusal_reason': refused ? _refusalEnum(r.refusalReason) : null,
          'guide_notes': null,
        });
      }
    });
  }

  // --- G7 briefing ---
  Future<SyncOutcome> acknowledgeBriefing() async {
    state.briefingAcknowledged = true;
    _emit();
    // typed_confirm_name is required by the worker; G7 is an acknowledge-only
    // surface with no name field, so we reuse the most recent signatory.
    final confirmName =
        state.checkinSignatory ?? state.riskSignatory ?? state.kitSignatory ?? 'Guide on duty';
    return _sync(() => _api.patch(GuideRoutes.briefing(state.departureId), {
          'all_riders_cleared': allRidersResolved,
          'typed_confirm_name': confirmName,
        }));
  }

  // --- G8 final sign-off gate (UXD-G-05) ---
  bool get readyForFinalSignoff => state.outstandingBeforeFinal.isEmpty;

  Future<SyncOutcome> signFinalOff(String signatory) async {
    if (!readyForFinalSignoff) {
      return const SyncOutcome.failed('Complete all upstream steps first.');
    }
    state.finalSignatory = signatory;
    state.finalSignedOff = true;
    _emit();
    return _sync(() => _api.patch(GuideRoutes.finalSignoff(state.departureId), {
          'signature': signatory,
        }));
  }

  // --- G9 mid-tour event (UXD-G-07) — REQ-OPS08 {departure_id, issue, resolution} ---
  Future<SyncOutcome> logMidTourEvent({required String category, required String account}) async {
    return _sync(() => _api.post(GuideRoutes.events, {
          'departure_id': state.departureId,
          'issue': '[$category] $account',
          'resolution': null,
        }));
  }

  // --- G10 emergency logger (UXD-G-06) — REQ-OPS09 preliminary incident ---
  /// Captures the returned incident id into the session as the OPS11 target.
  Future<SyncOutcome> logEmergency({
    required String nature,
    required String location,
    required String type, // 'injury' | 'rtc' | 'medical'
    required String account,
  }) async {
    return _sync(() async {
      final res = await _api.post(GuideRoutes.incidents, {
        'departure_id': state.departureId,
        'occurred_at': DateTime.now().toUtc().toIso8601String(),
        'location': location,
        'type': type,
        // Guide does not clinically grade severity; Owner/insurer assess.
        'severity': 'unassessed',
        'preliminary_description': nature.isEmpty ? account : '$nature\n\n$account',
      });
      final incident = res['incident'] as Map<String, Object?>?;
      final id = incident?['id'] as String?;
      if (id != null) {
        state.lastIncidentId = id;
        _emit();
      }
    });
  }

  // --- G11 post-ride review (UXD-G-08) — REQ-OPS10 structured debrief ---
  void updateDraft({
    String? hazardsOrRouteChanges,
    String? incidentsOrNearMisses,
    String? qualityAssessment,
    String? bikeServiceFlagBikeId,
    bool clearBikeFlag = false,
  }) {
    state.reviewDraft ??= PostRideDraft();
    if (hazardsOrRouteChanges != null) {
      state.reviewDraft!.hazardsOrRouteChanges = hazardsOrRouteChanges;
    }
    if (incidentsOrNearMisses != null) {
      state.reviewDraft!.incidentsOrNearMisses = incidentsOrNearMisses;
    }
    if (qualityAssessment != null) state.reviewDraft!.qualityAssessment = qualityAssessment;
    if (clearBikeFlag) {
      state.reviewDraft!.bikeServiceFlagBikeId = null;
    } else if (bikeServiceFlagBikeId != null) {
      state.reviewDraft!.bikeServiceFlagBikeId = bikeServiceFlagBikeId;
    }
    _emit();
  }

  /// Non-terminal — returns to the hub without committing (overrides
  /// UXC-NAV-2 per UXD-G-08); surface remains re-enterable. Persists the
  /// draft to the API as draft:true and locally.
  Future<SyncOutcome> saveDraft() async {
    state.reviewDraft ??= PostRideDraft();
    _emit();
    return _sync(() => _api.post(GuideRoutes.postRideReview, _reviewBody(draft: true)));
  }

  /// Terminal commit (UXC-STA-2, not re-editable). Offline-critical: the
  /// submission is committed locally regardless of connectivity; the
  /// returned outcome reflects the real HTTP result so the screen can flag a
  /// failed sync.
  Future<SyncOutcome> submitReview() async {
    state.reviewDraft ??= PostRideDraft();
    state.reviewDraft!.submitted = true;
    _emit();
    return _sync(() => _api.post(GuideRoutes.postRideReview, _reviewBody(draft: false)));
  }

  Map<String, Object?> _reviewBody({required bool draft}) {
    final d = state.reviewDraft!;
    return {
      'departure_id': state.departureId,
      'hazards_or_route_changes': d.hazardsOrRouteChanges.isEmpty ? null : d.hazardsOrRouteChanges,
      'incidents_or_near_misses': d.incidentsOrNearMisses.isEmpty ? null : d.incidentsOrNearMisses,
      'quality_assessment': d.qualityAssessment.isEmpty ? null : d.qualityAssessment,
      'bike_service_flag_bike_id':
          (d.bikeServiceFlagBikeId?.isEmpty ?? true) ? null : d.bikeServiceFlagBikeId,
      'draft': draft,
    };
  }

  // --- G12 incident report (UXD-G-09) — REQ-OPS11 PATCH by INCIDENT id ---
  Future<SyncOutcome> submitIncidentReport(String narrative) async {
    if (narrative.trim().length < 20) {
      return const SyncOutcome.failed('Narrative too short.');
    }
    final incidentId = state.lastIncidentId;
    if (incidentId == null) {
      return const SyncOutcome.failed(
          'No incident to attach this report to — log an emergency (G10) first.');
    }
    return _sync(() => _api.patch(GuideRoutes.incidentReport(incidentId), {
          'formal_report': narrative,
        }));
  }

  // --- G13 hazard observation (UXD-G-10) — REQ-OPS13 ---
  Future<SyncOutcome> submitHazard({
    required String street,
    required String hazardType,
    String? notes,
  }) async {
    if (street.trim().isEmpty || hazardType.trim().isEmpty) {
      return const SyncOutcome.failed('Enter a street and hazard type.');
    }
    final desc = (notes == null || notes.trim().isEmpty) ? hazardType : notes.trim();
    return _sync(() => _api.post(GuideRoutes.hazards, {
          'street_name': street,
          'hazard_type': hazardType,
          'description': desc,
          'severity': null,
          'observed_at': DateTime.now().toUtc().toIso8601String(),
        }));
  }
}
