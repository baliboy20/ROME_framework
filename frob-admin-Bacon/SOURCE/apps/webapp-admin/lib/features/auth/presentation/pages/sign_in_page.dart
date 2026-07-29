import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../theme/tokens.dart';
import '../../../../widgets/app_button.dart';
import '../../../../widgets/app_field.dart';
import '../bloc/auth_bloc.dart';

/// A1/A2 — Sign-in gate. Centred card on parchment wash.
class SignInPage extends StatefulWidget {
  const SignInPage({super.key});

  @override
  State<SignInPage> createState() => _SignInPageState();
}

class _SignInPageState extends State<SignInPage> {
  // DEV-ONLY: prefill local test credentials to save typing during dev.
  final emailCtrl = TextEditingController(text: 'owner@friendsonbikes.uk');
  final passCtrl = TextEditingController(text: 'admin1234');

  @override
  void dispose() {
    emailCtrl.dispose();
    passCtrl.dispose();
    super.dispose();
  }

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
              child: BlocBuilder<AuthBloc, AuthState>(
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
                      if (state is AuthError) ...[
                        const SizedBox(height: FobSpace.row),
                        Text(state.message, style: const TextStyle(color: FobColors.pinkText, fontSize: 12.5)),
                      ],
                      const SizedBox(height: FobSpace.block),
                      AppButton(
                        key: const Key('signin-submit'),
                        label: 'Sign in',
                        kind: AppButtonKind.primary,
                        loading: state is AuthSigningIn,
                        onPressed: () => context.read<AuthBloc>().add(SignInRequested(emailCtrl.text, passCtrl.text)),
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
