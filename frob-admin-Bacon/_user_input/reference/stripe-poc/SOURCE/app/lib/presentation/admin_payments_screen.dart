import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../application/admin/admin_payments_bloc.dart';
import '../domain/admin/admin_entities.dart';

/// Admin screen (POC): lists payments tracked by the Worker and lets an
/// operator issue full or partial refunds. Reachable via `/admin`; guarded
/// only by the Worker's `X-Admin-Key` check, not by any client-side auth.
class AdminPaymentsScreen extends StatelessWidget {
  const AdminPaymentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Admin — Payments')),
      body: BlocConsumer<AdminPaymentsBloc, AdminPaymentsState>(
        listener: (context, state) {
          if (state is AdminPaymentsRefundSucceeded) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'Refund ${state.result.refundId} succeeded '
                  '(£${(state.result.amountPence / 100).toStringAsFixed(2)}).',
                ),
              ),
            );
          } else if (state is AdminPaymentsRefundError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message)),
            );
          }
        },
        builder: (context, state) {
          return switch (state) {
            AdminPaymentsInitial() || AdminPaymentsLoading() =>
              const Center(child: CircularProgressIndicator()),
            AdminPaymentsError(:final message) => _ErrorView(message: message),
            AdminPaymentsLoaded(:final payments, :final refundingSessionId) =>
              _PaymentsTable(
                payments: payments,
                refundingSessionId: refundingSessionId,
              ),
            AdminPaymentsRefundSucceeded(:final payments) => _PaymentsTable(
              payments: payments,
              refundingSessionId: null,
            ),
            AdminPaymentsRefundError(:final payments) => _PaymentsTable(
              payments: payments,
              refundingSessionId: null,
            ),
          };
        },
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  const _ErrorView({required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              message,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => context.read<AdminPaymentsBloc>().add(
                const AdminPaymentsLoadRequested(),
              ),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentsTable extends StatelessWidget {
  final List<AdminPaymentRow> payments;
  final String? refundingSessionId;

  const _PaymentsTable({required this.payments, this.refundingSessionId});

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () async {
        context.read<AdminPaymentsBloc>().add(
          const AdminPaymentsLoadRequested(),
        );
      },
      child: payments.isEmpty
          ? ListView(
              children: const [
                Padding(
                  padding: EdgeInsets.all(32),
                  child: Center(child: Text('No payments yet.')),
                ),
              ],
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: payments.length,
              separatorBuilder: (_, _) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final payment = payments[index];
                final isRefunding = refundingSessionId == payment.sessionId;
                return _PaymentRow(payment: payment, isRefunding: isRefunding);
              },
            ),
    );
  }
}

class _PaymentRow extends StatelessWidget {
  final AdminPaymentRow payment;
  final bool isRefunding;

  const _PaymentRow({required this.payment, required this.isRefunding});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 3,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  payment.reference,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
                if (payment.customerEmail != null)
                  Text(
                    payment.customerEmail!,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                Text(
                  payment.sessionId,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              payment.formattedAmount,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
          Expanded(
            flex: 3,
            child: _StatusBadge(payment: payment),
          ),
          Expanded(
            flex: 2,
            child: Align(
              alignment: Alignment.centerRight,
              child: isRefunding
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : OutlinedButton(
                      onPressed: payment.status.isRefundable
                          ? () => _showRefundDialog(context, payment)
                          : null,
                      child: const Text('Refund'),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showRefundDialog(
    BuildContext context,
    AdminPaymentRow payment,
  ) async {
    final bloc = context.read<AdminPaymentsBloc>();
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => _RefundDialog(
        payment: payment,
        onConfirm: (amountPence) {
          bloc.add(
            AdminPaymentsRefundRequested(
              sessionId: payment.sessionId,
              amountPence: amountPence,
            ),
          );
        },
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final AdminPaymentRow payment;
  const _StatusBadge({required this.payment});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (payment.status) {
      AdminPaymentStatus.pending => ('Pending', Colors.grey),
      AdminPaymentStatus.succeeded => ('Succeeded', Colors.green),
      AdminPaymentStatus.failed => ('Failed', Colors.red),
      AdminPaymentStatus.refunded => ('Refunded', Colors.blueGrey),
      AdminPaymentStatus.partiallyRefunded => (
        'Partially refunded',
        Colors.orange,
      ),
      AdminPaymentStatus.unknown => ('Unknown', Colors.grey),
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            label,
            style: TextStyle(color: color, fontWeight: FontWeight.w600),
          ),
        ),
        if (payment.formattedRefundAmount != null)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              'Refunded: ${payment.formattedRefundAmount}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
      ],
    );
  }
}

/// Dialog offering a full refund or a partial refund by pounds-and-pence
/// text entry.
class _RefundDialog extends StatefulWidget {
  final AdminPaymentRow payment;
  final void Function(int? amountPence) onConfirm;

  const _RefundDialog({required this.payment, required this.onConfirm});

  @override
  State<_RefundDialog> createState() => _RefundDialogState();
}

class _RefundDialogState extends State<_RefundDialog> {
  bool _isPartial = false;
  final _amountController = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text('Refund ${widget.payment.reference}'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Original amount: ${widget.payment.formattedAmount}'),
          const SizedBox(height: 16),
          RadioListTile<bool>(
            contentPadding: EdgeInsets.zero,
            title: const Text('Full refund'),
            value: false,
            groupValue: _isPartial,
            onChanged: (v) => setState(() => _isPartial = v!),
          ),
          RadioListTile<bool>(
            contentPadding: EdgeInsets.zero,
            title: const Text('Partial refund'),
            value: true,
            groupValue: _isPartial,
            onChanged: (v) => setState(() => _isPartial = v!),
          ),
          if (_isPartial)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: TextField(
                controller: _amountController,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                ),
                decoration: InputDecoration(
                  labelText: 'Amount to refund (£)',
                  helperText: 'In pounds, e.g. 10.00',
                  errorText: _error,
                  border: const OutlineInputBorder(),
                ),
              ),
            ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: _onConfirm,
          child: const Text('Confirm refund'),
        ),
      ],
    );
  }

  void _onConfirm() {
    if (!_isPartial) {
      widget.onConfirm(null);
      Navigator.of(context).pop();
      return;
    }

    final pounds = double.tryParse(_amountController.text.trim());
    if (pounds == null || pounds <= 0) {
      setState(() => _error = 'Enter a valid amount greater than zero.');
      return;
    }
    final pence = (pounds * 100).round();
    if (pence > widget.payment.amountPence) {
      setState(() => _error = 'Cannot exceed the original amount.');
      return;
    }

    widget.onConfirm(pence);
    Navigator.of(context).pop();
  }
}
