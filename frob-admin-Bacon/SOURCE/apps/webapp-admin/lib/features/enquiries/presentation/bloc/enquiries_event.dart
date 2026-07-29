part of 'enquiries_bloc.dart';

enum EnquiryTab { open, overdue, spam }

sealed class EnquiriesEvent extends Equatable {
  const EnquiriesEvent();
  @override
  List<Object?> get props => [];
}

class LoadEnquiriesEvent extends EnquiriesEvent {
  const LoadEnquiriesEvent();
}

class SetEnquiryTabEvent extends EnquiriesEvent {
  final EnquiryTab tab;
  const SetEnquiryTabEvent(this.tab);
  @override
  List<Object?> get props => [tab];
}

class ReplyEnquiryEvent extends EnquiriesEvent {
  final String id;
  final String status;
  const ReplyEnquiryEvent(this.id, this.status);
  @override
  List<Object?> get props => [id, status];
}
