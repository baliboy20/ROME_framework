import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../state/tour_cubit.dart';
import '../widgets/fob_button.dart';
import '../widgets/guide_components.dart';
import '../widgets/guide_scaffold.dart';

const _categories = ['Mechanical', 'Illness', 'Early-leave'];

/// G9 — Mid-tour event logger (UXD-G-07). Single-select category + free
/// text, distinct from the G10 emergency path — routine events, not
/// emergencies. UXC-STA-2: form -> terminal `submitted`, not re-editable.
class G9MidTourEventScreen extends StatefulWidget {
  const G9MidTourEventScreen({super.key});

  @override
  State<G9MidTourEventScreen> createState() => _G9MidTourEventScreenState();
}

class _G9MidTourEventScreenState extends State<G9MidTourEventScreen> {
  String? _category;
  final _accountController = TextEditingController();
  bool _submitted = false;

  @override
  Widget build(BuildContext context) {
    final cubit = context.read<TourCubit>();
    return GuideScaffold(
      eyebrow: 'G9 · EVENT LOG',
      title: 'Mid-tour event',
      body: _submitted
          ? const Text('Logged to the tour record.', style: TextStyle(fontWeight: FontWeight.w600))
          : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Category'),
                const SizedBox(height: 10),
                CategoryChips(
                  options: _categories,
                  value: _category,
                  onChanged: (v) => setState(() => _category = v),
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: _accountController,
                  decoration: const InputDecoration(labelText: 'Account of what happened'),
                  minLines: 3,
                  maxLines: 6,
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 20),
                FobButton(
                  label: 'Log event',
                  onPressed: (_category == null || _accountController.text.trim().isEmpty)
                      ? null
                      : () async {
                          final messenger = ScaffoldMessenger.of(context);
                          final outcome = await cubit.logMidTourEvent(
                            category: _category!,
                            account: _accountController.text.trim(),
                          );
                          if (!mounted) return;
                          if (outcome.synced) {
                            setState(() => _submitted = true);
                          } else {
                            messenger.showSnackBar(SnackBar(content: Text(outcome.error!)));
                          }
                        },
                  disabledReason: _category == null
                      ? 'Choose a category'
                      : (_accountController.text.trim().isEmpty ? 'Add an account of what happened' : null),
                ),
              ],
            ),
    );
  }
}
