import 'package:fob_mobile_guide/models/guide_models.dart';
import 'package:fob_mobile_guide/services/api_client.dart';
import 'package:fob_mobile_guide/services/device_service.dart';
import 'package:fob_mobile_guide/services/storage_service.dart';
import 'package:fob_mobile_guide/state/tour_cubit.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sembast/sembast_memory.dart';

int _dbCounter = 0;

Future<TourCubit> _newCubit() async {
  // Unique DB name per call — sembast_memory keeps named databases alive
  // for the process lifetime, so a shared name would leak state (and any
  // saved draft/session) across otherwise-independent tests.
  final db = await databaseFactoryMemory.openDatabase('test-${_dbCounter++}.db');
  final store = SessionStore(db);
  final deviceService = DeviceService(db);
  final api = ApiClient(deviceService, baseUrl: 'http://offline.invalid');
  return TourCubit.restore(store, api);
}

void main() {
  group('G4 bike inspection — no same-day shortcut (UXD-G-02)', () {
    test('signBikeInspection is a no-op until every point on every bike is checked', () async {
      final cubit = await _newCubit();
      await cubit.signBikeInspection('Emma Hart');
      expect(cubit.state.bikeSignatory, isNull, reason: 'signature must not attach when unchecked points remain');
      expect(cubit.state.stepStatus('G4'), StepStatus.todo);
    });

    test('signBikeInspection succeeds once every bike/point is checked', () async {
      final cubit = await _newCubit();
      for (var b = 0; b < cubit.state.bikes.length; b++) {
        for (var p = 0; p < cubit.state.bikes[b].points.length; p++) {
          cubit.toggleBikePoint(b, p);
        }
      }
      await cubit.signBikeInspection('Emma Hart');
      expect(cubit.state.bikeSignatory, 'Emma Hart');
      expect(cubit.state.stepStatus('G4'), StepStatus.done);
    });
  });

  group('G5 high-risk blocks sign-off (UXD-G-03)', () {
    test('signRiskAssessment is blocked while an unresolved high-risk item exists', () async {
      final cubit = await _newCubit();
      expect(cubit.state.hasUnresolvedHighRisk, isTrue);
      await cubit.signRiskAssessment('Emma Hart');
      expect(cubit.state.riskSignatory, isNull);
    });

    test('mitigating the high-risk item unblocks sign-off', () async {
      final cubit = await _newCubit();
      final highRisk = cubit.state.riskItems.firstWhere((r) => r.level == RiskLevel.high);
      cubit.mitigateRisk(highRisk.id, 'Rerouted around roadworks');
      expect(cubit.state.hasUnresolvedHighRisk, isFalse);
      await cubit.signRiskAssessment('Emma Hart');
      expect(cubit.state.riskSignatory, 'Emma Hart');
      expect(cubit.todaysMitigations, hasLength(1));
    });
  });

  group('G6 rider check-in refusal (UXD-G-04)', () {
    test('refusal marks the rider refused and records the reason, not money', () async {
      final cubit = await _newCubit();
      final rider = cubit.state.riders.first;
      cubit.refuseRider(rider.id, 'Medical');
      expect(rider.status, RiderStatus.refused);
      expect(rider.refusalReason, 'Medical');
    });

    test('signCheckin is blocked while any rider is pending', () async {
      final cubit = await _newCubit();
      // Leave one rider pending.
      for (final rider in cubit.state.riders.take(cubit.state.riders.length - 1)) {
        cubit.checkInRider(rider.id);
      }
      expect(cubit.allRidersResolved, isFalse);
      await cubit.signCheckin('Emma Hart');
      expect(cubit.state.checkinSignatory, isNull);
    });

    test('signCheckin succeeds once every rider is checked or refused', () async {
      final cubit = await _newCubit();
      for (final rider in cubit.state.riders) {
        cubit.checkInRider(rider.id);
      }
      await cubit.signCheckin('Emma Hart');
      expect(cubit.state.checkinSignatory, 'Emma Hart');
      expect(cubit.state.stepStatus('G6'), StepStatus.done);
    });
  });

  group('G8 pre-departure sign-off gate (UXD-G-05)', () {
    test('signFinalOff refuses while upstream steps are outstanding', () async {
      final cubit = await _newCubit();
      expect(cubit.state.outstandingBeforeFinal, isNotEmpty);
      await cubit.signFinalOff('Emma Hart');
      expect(cubit.state.finalSignedOff, isFalse);
    });

    test('signFinalOff succeeds once G3-G7 are all done', () async {
      final cubit = await _newCubit();
      await cubit.signKit('Emma Hart');
      for (var b = 0; b < cubit.state.bikes.length; b++) {
        for (var p = 0; p < cubit.state.bikes[b].points.length; p++) {
          cubit.toggleBikePoint(b, p);
        }
      }
      await cubit.signBikeInspection('Emma Hart');
      final highRisk = cubit.state.riskItems.firstWhere((r) => r.level == RiskLevel.high);
      cubit.mitigateRisk(highRisk.id, 'Rerouted');
      await cubit.signRiskAssessment('Emma Hart');
      for (final rider in cubit.state.riders) {
        cubit.checkInRider(rider.id);
      }
      await cubit.signCheckin('Emma Hart');
      await cubit.acknowledgeBriefing();

      expect(cubit.state.outstandingBeforeFinal, isEmpty);
      await cubit.signFinalOff('Emma Hart');
      expect(cubit.state.finalSignedOff, isTrue);
      expect(cubit.state.stepStatus('G8'), StepStatus.done);
    });
  });

  group('G11 post-ride review draft-save (UXD-G-08)', () {
    test('saveDraft persists structured fields without submitting', () async {
      final cubit = await _newCubit();
      cubit.updateDraft(
        hazardsOrRouteChanges: 'Roadworks on Bridge St',
        incidentsOrNearMisses: 'None',
        qualityAssessment: 'Great tour',
      );
      await cubit.saveDraft();
      expect(cubit.state.reviewDraft!.submitted, isFalse);
      expect(cubit.state.reviewDraft!.hazardsOrRouteChanges, 'Roadworks on Bridge St');
    });

    test('a draft survives reload via sembast persistence', () async {
      final db = await databaseFactoryMemory.openDatabase('reload.db');
      final store = SessionStore(db);
      final deviceService = DeviceService(db);
      final api = ApiClient(deviceService, baseUrl: 'http://offline.invalid');

      final first = await TourCubit.restore(store, api);
      first.updateDraft(qualityAssessment: 'draft note');
      await first.saveDraft();

      final second = await TourCubit.restore(store, api);
      expect(second.state.reviewDraft, isNotNull);
      expect(second.state.reviewDraft!.qualityAssessment, 'draft note');
      expect(second.state.reviewDraft!.submitted, isFalse);
    });

    test('submitReview is terminal', () async {
      final cubit = await _newCubit();
      cubit.updateDraft(qualityAssessment: 'n');
      await cubit.submitReview();
      expect(cubit.state.reviewDraft!.submitted, isTrue);
    });
  });
}
