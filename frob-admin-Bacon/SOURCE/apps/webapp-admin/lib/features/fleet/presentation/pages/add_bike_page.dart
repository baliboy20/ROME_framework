import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../injection_container.dart';
import '../../../../theme/tokens.dart';
import '../../../../widgets/app_button.dart';
import '../../../../widgets/app_field.dart';
import '../bloc/add_bike_bloc.dart';

/// A12 — Add bike (UXD-10 duplicate guard).
class AddBikePage extends StatelessWidget {
  const AddBikePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<AddBikeBloc>(
      create: (_) => sl<AddBikeBloc>()..add(const LoadExistingBikesEvent()),
      child: const _AddBikeView(),
    );
  }
}

class _AddBikeView extends StatefulWidget {
  const _AddBikeView();
  @override
  State<_AddBikeView> createState() => _AddBikeViewState();
}

class _AddBikeViewState extends State<_AddBikeView> {
  final idCtrl = TextEditingController();
  final labelCtrl = TextEditingController();

  @override
  void dispose() {
    idCtrl.dispose();
    labelCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AddBikeBloc, AddBikeState>(
      builder: (context, state) {
        final bloc = context.read<AddBikeBloc>();
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Add bike', style: FobText.pageTitle),
            const SizedBox(height: FobSpace.card),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(FobSpace.card),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AppField(
                      key: const Key('bike-id-field'),
                      label: 'Bike identifier',
                      hint: 'FOB-001',
                      controller: idCtrl,
                      errorText: state.duplicateError,
                      onChanged: (v) => bloc.add(CheckBikeIdEvent(v)),
                    ),
                    const SizedBox(height: FobSpace.field),
                    AppField(label: 'Label', controller: labelCtrl),
                    const SizedBox(height: FobSpace.block),
                    AppButton(
                      key: const Key('add-bike-button'),
                      label: 'Add bike',
                      kind: AppButtonKind.primary,
                      loading: state.saving,
                      onPressed: state.canAdd && idCtrl.text.isNotEmpty
                          ? () => bloc.add(SubmitBikeEvent(idCtrl.text, labelCtrl.text))
                          : null,
                    ),
                    if (state.added)
                      const Padding(
                        padding: EdgeInsets.only(top: 12),
                        child: Text('Bike added.', key: Key('bike-added-confirmation'), style: TextStyle(color: FobColors.limeText)),
                      ),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}
