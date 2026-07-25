part of 'enquiries_bloc.dart';

sealed class EnquiriesState extends Equatable {
  const EnquiriesState();
  @override
  List<Object?> get props => [];
}

class EnquiriesInitial extends EnquiriesState {
  const EnquiriesInitial();
}

class EnquiriesLoading extends EnquiriesState {
  const EnquiriesLoading();
}

class EnquiriesLoaded extends EnquiriesState {
  final List<Enquiry> rows;
  final EnquiryTab tab;
  const EnquiriesLoaded({required this.rows, this.tab = EnquiryTab.open});

  List<Enquiry> get filtered {
    switch (tab) {
      case EnquiryTab.open:
        return rows.where((r) => !r.overdue && !r.spam).toList();
      case EnquiryTab.overdue:
        return rows.where((r) => r.overdue && !r.spam).toList();
      case EnquiryTab.spam:
        return rows.where((r) => r.spam).toList();
    }
  }

  EnquiriesLoaded copyWith({List<Enquiry>? rows, EnquiryTab? tab}) =>
      EnquiriesLoaded(rows: rows ?? this.rows, tab: tab ?? this.tab);

  @override
  List<Object?> get props => [rows, tab];
}

class EnquiriesLoadFailure extends EnquiriesState {
  final String message;
  const EnquiriesLoadFailure(this.message);
  @override
  List<Object?> get props => [message];
}
