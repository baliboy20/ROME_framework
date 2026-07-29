import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/usecases/usecase.dart';
import '../../domain/entities/enquiry.dart';
import '../../domain/usecases/get_enquiries.dart';
import '../../domain/usecases/reply_enquiry.dart';

part 'enquiries_event.dart';
part 'enquiries_state.dart';

/// A9 enquiries — Open/Overdue/Spam tabs (UXD-12).
class EnquiriesBloc extends Bloc<EnquiriesEvent, EnquiriesState> {
  final GetEnquiries getEnquiries;
  final ReplyEnquiry replyEnquiry;

  EnquiriesBloc({required this.getEnquiries, required this.replyEnquiry})
      : super(const EnquiriesInitial()) {
    on<LoadEnquiriesEvent>(_onLoad);
    on<SetEnquiryTabEvent>(_onTab);
    on<ReplyEnquiryEvent>(_onReply);
  }

  Future<void> _onLoad(LoadEnquiriesEvent event, Emitter<EnquiriesState> emit) async {
    emit(const EnquiriesLoading());
    final result = await getEnquiries(const NoParams());
    emit(result.fold(
      (failure) => EnquiriesLoadFailure(failure.message),
      (rows) => EnquiriesLoaded(rows: rows),
    ));
  }

  void _onTab(SetEnquiryTabEvent event, Emitter<EnquiriesState> emit) {
    final s = state;
    if (s is EnquiriesLoaded) emit(s.copyWith(tab: event.tab));
  }

  Future<void> _onReply(ReplyEnquiryEvent event, Emitter<EnquiriesState> emit) async {
    await replyEnquiry(ReplyParams(id: event.id, status: event.status));
  }
}
