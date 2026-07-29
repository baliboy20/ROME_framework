import 'package:equatable/equatable.dart';

/// A notification message row — shared by A4 owner alerts (NOTIF04) and
/// A3 deliverability status (NOTIF02).
class Message extends Equatable {
  final String id;
  final String recipient;
  final String event;
  final String status;
  final String provider;
  final String createdAt;

  const Message({
    required this.id,
    required this.recipient,
    required this.event,
    required this.status,
    required this.provider,
    required this.createdAt,
  });

  bool get isBad => status == 'bounced' || status == 'failed_complaint';

  @override
  List<Object?> get props => [id, recipient, event, status, provider, createdAt];
}
