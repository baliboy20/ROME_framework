import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_admin/core/error/failures.dart';
import 'package:fob_webapp_admin/core/types/result.dart';
import 'package:fob_webapp_admin/features/enquiries/domain/entities/enquiry.dart';
import 'package:fob_webapp_admin/features/enquiries/domain/repositories/enquiry_repository.dart';
import 'package:fob_webapp_admin/features/enquiries/domain/usecases/get_enquiries.dart';
import 'package:fob_webapp_admin/features/enquiries/domain/usecases/reply_enquiry.dart';
import 'package:fob_webapp_admin/features/enquiries/presentation/bloc/enquiries_bloc.dart';

class _FakeRepo implements EnquiryRepository {
  List<Enquiry> rows;
  Failure? failGet;
  String? repliedId;
  _FakeRepo(this.rows);

  @override
  Future<Result<List<Enquiry>>> getEnquiries() async =>
      failGet != null ? Error(failGet!) : Success(rows);

  @override
  Future<Result<void>> replyEnquiry(String id, String status) async {
    repliedId = id;
    return const Success(null);
  }

  @override
  Future<Result<String>> sendReply(String id, String body) async {
    repliedId = id;
    return const Success('sent');
  }
}

Enquiry _e(String id, {bool overdue = false, bool spam = false}) => Enquiry(
      id: id,
      prospectName: 'P$id',
      tourName: 'T',
      receivedAt: DateTime(2026, 1, 1),
      overdue: overdue,
      spam: spam,
    );

void main() {
  late _FakeRepo repo;
  EnquiriesBloc build() =>
      EnquiriesBloc(getEnquiries: GetEnquiries(repo), replyEnquiry: ReplyEnquiry(repo));

  setUp(() => repo = _FakeRepo([_e('1'), _e('2', overdue: true), _e('3', spam: true)]));

  test('load emits Loading then Loaded', () async {
    final bloc = build();
    final states = <EnquiriesState>[];
    bloc.stream.listen(states.add);
    bloc.add(const LoadEnquiriesEvent());
    await Future.delayed(Duration.zero);
    expect(states.first, isA<EnquiriesLoading>());
    expect(states.last, isA<EnquiriesLoaded>());
  });

  test('tab filter partitions open/overdue/spam', () async {
    final bloc = build();
    bloc.add(const LoadEnquiriesEvent());
    await Future.delayed(Duration.zero);
    bloc.add(const SetEnquiryTabEvent(EnquiryTab.overdue));
    await Future.delayed(Duration.zero);
    final s = bloc.state as EnquiriesLoaded;
    expect(s.filtered.map((e) => e.id), ['2']);
  });

  test('load failure surfaces the message', () async {
    repo.failGet = const NetworkFailure('down');
    final bloc = build();
    bloc.add(const LoadEnquiriesEvent());
    await Future.delayed(Duration.zero);
    expect((bloc.state as EnquiriesLoadFailure).message, 'down');
  });
}
