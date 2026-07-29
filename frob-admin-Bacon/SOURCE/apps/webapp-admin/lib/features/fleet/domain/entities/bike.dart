import 'package:equatable/equatable.dart';

/// A20 allocation candidate — a bike that can be moved between the available
/// and assigned columns of the transfer list (UXD-09, REQ-BOOK14).
class Bike extends Equatable {
  final String id;
  final String label;
  final bool outOfService;
  final bool busyOverlap;

  const Bike({
    required this.id,
    required this.label,
    this.outOfService = false,
    this.busyOverlap = false,
  });

  bool get assignable => !outOfService && !busyOverlap;

  @override
  List<Object?> get props => [id, label, outOfService, busyOverlap];
}
