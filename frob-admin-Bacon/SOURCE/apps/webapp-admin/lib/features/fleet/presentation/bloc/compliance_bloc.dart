import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/compliance_item.dart';
import '../../domain/usecases/fleet_usecases.dart';

sealed class ComplianceEvent extends Equatable {
  const ComplianceEvent();
  @override
  List<Object?> get props => [];
}

class LoadComplianceEvent extends ComplianceEvent {
  const LoadComplianceEvent();
}

class RenewComplianceEvent extends ComplianceEvent {
  final String id;
  final String newExpiry;
  const RenewComplianceEvent(this.id, this.newExpiry);
  @override
  List<Object?> get props => [id, newExpiry];
}

sealed class ComplianceState extends Equatable {
  const ComplianceState();
  @override
  List<Object?> get props => [];
}

class ComplianceInitial extends ComplianceState {
  const ComplianceInitial();
}

class ComplianceLoading extends ComplianceState {
  const ComplianceLoading();
}

class ComplianceLoaded extends ComplianceState {
  final List<ComplianceItem> rows;
  final String? actionError;
  const ComplianceLoaded(this.rows, {this.actionError});
  @override
  List<Object?> get props => [rows, actionError];
}

class ComplianceLoadFailure extends ComplianceState {
  final String message;
  const ComplianceLoadFailure(this.message);
  @override
  List<Object?> get props => [message];
}

class ComplianceBloc extends Bloc<ComplianceEvent, ComplianceState> {
  final GetCompliance getCompliance;
  final RenewCompliance renewCompliance;

  ComplianceBloc({required this.getCompliance, required this.renewCompliance})
      : super(const ComplianceInitial()) {
    on<LoadComplianceEvent>(_onLoad);
    on<RenewComplianceEvent>(_onRenew);
  }

  Future<void> _onLoad(LoadComplianceEvent event, Emitter<ComplianceState> emit) async {
    emit(const ComplianceLoading());
    final result = await getCompliance(const NoParams());
    emit(result.fold((f) => ComplianceLoadFailure(f.message), (rows) => ComplianceLoaded(rows)));
  }

  Future<void> _onRenew(RenewComplianceEvent event, Emitter<ComplianceState> emit) async {
    final result = await renewCompliance(RenewParams(event.id, event.newExpiry));
    await result.fold(
      (f) async {
        final s = state;
        if (s is ComplianceLoaded) emit(ComplianceLoaded(s.rows, actionError: f.message));
      },
      (_) async => add(const LoadComplianceEvent()),
    );
  }
}
