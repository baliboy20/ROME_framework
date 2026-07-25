import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../bloc/auth/auth_cubit.dart';
import '../theme/forest_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailFocus = FocusNode();
  final _passwordFocus = FocusNode();
  bool _emailTouched = false;
  bool _passwordTouched = false;

  @override
  void initState() {
    super.initState();
    _emailFocus.addListener(_onEmailFocusChange);
    _passwordFocus.addListener(_onPasswordFocusChange);
  }

  void _onEmailFocusChange() {
    if (_emailFocus.hasFocus) return;
    setState(() => _emailTouched = true);
    WidgetsBinding.instance
        .addPostFrameCallback((_) => _formKey.currentState?.validate());
  }

  void _onPasswordFocusChange() {
    if (_passwordFocus.hasFocus) return;
    setState(() => _passwordTouched = true);
    WidgetsBinding.instance
        .addPostFrameCallback((_) => _formKey.currentState?.validate());
  }

  @override
  void dispose() {
    _emailFocus.removeListener(_onEmailFocusChange);
    _passwordFocus.removeListener(_onPasswordFocusChange);
    _emailFocus.dispose();
    _passwordFocus.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String? _validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) return 'Email is required';
    if (!value.contains('@')) return 'Enter a valid email address';
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) return 'Password is required';
    return null;
  }

  void _submit() {
    setState(() {
      _emailTouched = true;
      _passwordTouched = true;
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!(_formKey.currentState?.validate() ?? false)) return;
      context.read<AuthCubit>().login(
            email: _emailController.text.trim(),
            password: _passwordController.text,
          );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 400),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(ForestTokens.space6),
              child: Form(
                key: _formKey,
                autovalidateMode: AutovalidateMode.disabled,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text('Friends on Bikes',
                        style: Theme.of(context).textTheme.headlineMedium,
                        textAlign: TextAlign.center),
                    const SizedBox(height: ForestTokens.space2),
                    Text('Content editor sign-in',
                        style: Theme.of(context).textTheme.bodyMedium,
                        textAlign: TextAlign.center),
                    const SizedBox(height: ForestTokens.space6),
                    TextFormField(
                      key: const Key('email-field'),
                      controller: _emailController,
                      focusNode: _emailFocus,
                      decoration: const InputDecoration(labelText: 'Email'),
                      keyboardType: TextInputType.emailAddress,
                      autovalidateMode: AutovalidateMode.onUserInteraction,
                      validator: _emailTouched ? _validateEmail : (_) => null,
                    ),
                    const SizedBox(height: ForestTokens.space4),
                    TextFormField(
                      key: const Key('password-field'),
                      controller: _passwordController,
                      focusNode: _passwordFocus,
                      decoration: const InputDecoration(labelText: 'Password'),
                      obscureText: true,
                      autovalidateMode: AutovalidateMode.onUserInteraction,
                      validator:
                          _passwordTouched ? _validatePassword : (_) => null,
                      onFieldSubmitted: (_) => _submit(),
                    ),
                    const SizedBox(height: ForestTokens.space6),
                    BlocBuilder<AuthCubit, AuthState>(
                      builder: (context, state) {
                        if (state.errorMessage != null) {
                          return Padding(
                            padding:
                                const EdgeInsets.only(bottom: ForestTokens.space4),
                            child: Text(
                              state.errorMessage!,
                              style: const TextStyle(color: ForestTokens.error),
                            ),
                          );
                        }
                        return const SizedBox.shrink();
                      },
                    ),
                    BlocBuilder<AuthCubit, AuthState>(
                      builder: (context, state) {
                        final loading = state.status == AuthStatus.authenticating;
                        return ElevatedButton(
                          key: const Key('login-submit'),
                          onPressed: loading ? null : _submit,
                          child: loading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2, color: Colors.white),
                                )
                              : const Text('Sign in'),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
