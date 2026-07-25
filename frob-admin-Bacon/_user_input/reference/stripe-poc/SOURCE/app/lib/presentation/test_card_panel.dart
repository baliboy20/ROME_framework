import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../core/env.dart';

/// One Stripe test card entry, verified against
/// https://docs.stripe.com/testing (fetched live for this POC — see
/// LEARNINGS.md "Phase 2" section for the exact date checked).
class _TestCard {
  final String label;
  final String number;
  final String note;

  const _TestCard({required this.label, required this.number, required this.note});
}

const _testCards = [
  _TestCard(
    label: 'Succeeds',
    number: '4242 4242 4242 4242',
    note: 'Payment succeeds immediately.',
  ),
  _TestCard(
    label: '3D Secure required',
    number: '4000 0027 6000 3184',
    note: 'Always requires authentication (3DS challenge), regardless of setup.',
  ),
  _TestCard(
    label: 'Generic decline',
    number: '4000 0000 0000 0002',
    note: 'Declined with code card_declined / generic_decline.',
  ),
  _TestCard(
    label: 'Insufficient funds',
    number: '4000 0000 0000 9995',
    note: 'Declined with code card_declined / insufficient_funds.',
  ),
  _TestCard(
    label: 'Expired card',
    number: '4000 0000 0000 0069',
    note: 'Declined with code expired_card.',
  ),
  _TestCard(
    label: 'Incorrect CVC',
    number: '4000 0000 0000 0127',
    note: 'Declined with code incorrect_cvc.',
  ),
  _TestCard(
    label: 'Charged, then disputed as fraudulent',
    number: '4000 0000 0000 0259',
    note: 'Payment succeeds, then a dispute/chargeback is created shortly after.',
  ),
];

/// Collapsible panel of Stripe test card numbers for use against Embedded
/// Checkout while `STRIPE_MODE=test`. MUST NOT render in live mode — guard
/// enforced both here (returns an empty widget) and by callers not needing
/// to check separately.
class TestCardPanel extends StatefulWidget {
  const TestCardPanel({super.key});

  @override
  State<TestCardPanel> createState() => _TestCardPanelState();
}

class _TestCardPanelState extends State<TestCardPanel> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    // Hard guard: this panel must never render outside test mode, even if
    // a caller forgets to check `Env.isTestMode` themselves.
    if (!Env.isTestMode) {
      return const SizedBox.shrink();
    }

    return Card(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ListTile(
            leading: const Icon(Icons.credit_card),
            title: const Text('Stripe test cards (test mode only)'),
            trailing: Icon(_expanded ? Icons.expand_less : Icons.expand_more),
            onTap: () => setState(() => _expanded = !_expanded),
          ),
          if (_expanded) ...[
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'Any future expiry date and any 3-digit CVC work for all '
                'test cards below.',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ),
            const Divider(),
            for (final card in _testCards) _buildCardTile(context, card),
            const SizedBox(height: 8),
          ],
        ],
      ),
    );
  }

  Widget _buildCardTile(BuildContext context, _TestCard card) {
    return ListTile(
      dense: true,
      title: Text(card.label, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text('${card.number}\n${card.note}'),
      isThreeLine: true,
      trailing: IconButton(
        icon: const Icon(Icons.copy, size: 18),
        tooltip: 'Copy card number',
        onPressed: () => _copy(context, card),
      ),
    );
  }

  Future<void> _copy(BuildContext context, _TestCard card) async {
    await Clipboard.setData(
      ClipboardData(text: card.number.replaceAll(' ', '')),
    );
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Copied ${card.label} card number')),
    );
  }
}
