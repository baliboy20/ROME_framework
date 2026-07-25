import 'package:flutter_bloc/flutter_bloc.dart';
import '../api/api_client.dart';
import '../models/models.dart';

/// A9 enquiries — Open/Overdue/Spam tabs (UXD-12: overdue flagged, no auto-email).
class EnquiriesState {
  final bool loading;
  final List<EnquiryRow> rows;
  final EnquiryTab tab;
  final String? error;

  const EnquiriesState({this.loading = false, this.rows = const [], this.tab = EnquiryTab.open, this.error});

  List<EnquiryRow> get filtered {
    switch (tab) {
      case EnquiryTab.open:
        return rows.where((r) => !r.overdue && !r.spam).toList();
      case EnquiryTab.overdue:
        return rows.where((r) => r.overdue && !r.spam).toList();
      case EnquiryTab.spam:
        return rows.where((r) => r.spam).toList();
    }
  }

  EnquiriesState copyWith({bool? loading, List<EnquiryRow>? rows, EnquiryTab? tab, String? error}) =>
      EnquiriesState(loading: loading ?? this.loading, rows: rows ?? this.rows, tab: tab ?? this.tab, error: error);
}

class EnquiriesCubit extends Cubit<EnquiriesState> {
  final ApiClient api;
  EnquiriesCubit(this.api) : super(const EnquiriesState());

  Future<void> load() async {
    emit(state.copyWith(loading: true));
    try {
      final data = await api.getEnquiries();
      final rows = data.map((j) => EnquiryRow.fromJson(j as Map<String, dynamic>)).toList();
      emit(state.copyWith(loading: false, rows: rows));
    } catch (e) {
      emit(state.copyWith(loading: false, error: 'Could not load enquiries.'));
    }
  }

  void setTab(EnquiryTab t) => emit(state.copyWith(tab: t));

  Future<void> reply(EnquiryRow row, String status) async {
    try {
      await api.replyEnquiry(row.id, status);
    } catch (_) {}
  }
}
