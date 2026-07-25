import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/auth_cubit.dart';
import '../theme/tokens.dart';
import '../widgets/app_button.dart';
import '../widgets/app_field.dart';

/// A1/A2 — Sign-in gate. Centred card on parchment wash.
class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  // DEV-ONLY: prefill local test credentials to save typing during dev.
  // Remove before any non-local build.
  final emailCtrl = TextEditingController(text: 'owner@friendsonbikes.uk');
  final passCtrl = TextEditingController(text: 'admin1234');

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: FobColors.surfaceBg,
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 400),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(FobSpace.card),
              child: BlocConsumer<AuthCubit, AuthState>(
                listener: (context, state) {},
                builder: (context, state) {
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('FOB Booking Admin', style: FobText.pageTitle, textAlign: TextAlign.center),
                      const SizedBox(height: FobSpace.block),
                      AppField(label: 'Email', controller: emailCtrl, key: const Key('signin-email')),
                      const SizedBox(height: FobSpace.field),
                      AppField(label: 'Password', controller: passCtrl, obscure: true, key: const Key('signin-password')),
                      if (state.status == AuthStatus.error) ...[
                        const SizedBox(height: FobSpace.row),
                        Text(state.error ?? 'Sign-in failed.',
                            style: const TextStyle(color: FobColors.pinkText, fontSize: 12.5)),
                      ],
                      const SizedBox(height: FobSpace.block),
                      AppButton(
                        key: const Key('signin-submit'),
                        label: 'Sign in',
                        kind: AppButtonKind.primary,
                        loading: state.status == AuthStatus.signingIn,
                        onPressed: () => context.read<AuthCubit>().signIn(emailCtrl.text, passCtrl.text),
                      ),
                    ],
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}
