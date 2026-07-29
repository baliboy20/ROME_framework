import 'package:flutter/material.dart';

import '../../../../theme/tokens.dart';
import '../../../../widgets/app_button.dart';
import '../../domain/entities/bike.dart';

/// TransferList — Available/Assigned lists + move controls + coverage counter (UXD-09).
/// Under-provisioning is a non-blocking warning. Out-of-service / overlapping bikes
/// are disabled with an inline reason and cannot be moved.
class TransferList extends StatelessWidget {
  final List<Bike> available;
  final List<Bike> assigned;
  final int ridersNeeded;
  final void Function(Bike) onAssign;
  final void Function(Bike) onUnassign;

  const TransferList({
    super.key,
    required this.available,
    required this.assigned,
    required this.ridersNeeded,
    required this.onAssign,
    required this.onUnassign,
  });

  @override
  Widget build(BuildContext context) {
    final covered = assigned.length;
    final underProvisioned = covered < ridersNeeded;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('$covered of $ridersNeeded riders covered',
                style: FobText.cardTitle.copyWith(
                    color: underProvisioned ? FobColors.orangeText : FobColors.limeText)),
            if (underProvisioned) ...[
              const SizedBox(width: 8),
              Text('Under-provisioned', key: const Key('under-provisioned-warning'),
                  style: FobText.body.copyWith(color: FobColors.orangeText, fontSize: 12)),
            ],
          ],
        ),
        const SizedBox(height: 12),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: _list('Available', available, isAssignedList: false)),
            const SizedBox(width: 16),
            Expanded(child: _list('Assigned', assigned, isAssignedList: true)),
          ],
        ),
      ],
    );
  }

  Widget _list(String title, List<Bike> items, {required bool isAssignedList}) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: FobColors.hairline),
        borderRadius: BorderRadius.circular(FobRadius.card),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Text(title.toUpperCase(), style: FobText.microLabel),
          ),
          if (items.isEmpty && !isAssignedList)
            const Padding(
              padding: EdgeInsets.all(12),
              child: Text('No available bikes for this slot — check the fleet.', style: FobText.body),
            ),
          ...items.map((b) {
            final disabled = !isAssignedList && !b.assignable;
            final reason = b.outOfService
                ? 'out of service — choose another'
                : b.busyOverlap
                    ? 'already out on another tour at that time'
                    : null;
            return ListTile(
              dense: true,
              title: Text(b.label, style: FobText.body.copyWith(color: disabled ? FobColors.textFaint : FobColors.textStrong)),
              subtitle: reason != null ? Text(reason, style: const TextStyle(fontSize: 11, color: FobColors.orangeText)) : null,
              trailing: AppButton(
                kind: AppButtonKind.row,
                label: isAssignedList ? 'Remove' : 'Assign',
                onPressed: disabled ? null : () => isAssignedList ? onUnassign(b) : onAssign(b),
              ),
            );
          }),
        ],
      ),
    );
  }
}
