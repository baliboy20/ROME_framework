import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fob_webapp_editor/bloc/auth/auth_cubit.dart';
import 'package:fob_webapp_editor/core/api_client.dart';
import 'package:fob_webapp_editor/screens/login_screen.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

Widget _wrap(AuthCubit cubit) {
  return MaterialApp(
    home: BlocProvider<AuthCubit>.value(
      value: cubit,
      child: const LoginScreen(),
    ),
  );
}

void main() {
  testWidgets('does not show a validation error before the field is touched',
      (tester) async {
    final api = ApiClient(
      baseUrl: 'https://api.test',
      httpClient: MockClient((req) async => http.Response('{}', 401)),
    );
    final cubit = AuthCubit(api);
    addTearDown(cubit.close);

    await tester.pumpWidget(_wrap(cubit));

    expect(find.text('Email is required'), findsNothing);
    expect(find.text('Password is required'), findsNothing);
  });

  testWidgets('shows validation errors on blur, not before', (tester) async {
    final api = ApiClient(
      baseUrl: 'https://api.test',
      httpClient: MockClient((req) async => http.Response('{}', 401)),
    );
    final cubit = AuthCubit(api);
    addTearDown(cubit.close);

    await tester.pumpWidget(_wrap(cubit));

    // Focus the email field, then move focus to password (blur) without typing.
    await tester.tap(find.byKey(const Key('email-field')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('password-field')));
    await tester.pumpAndSettle();

    expect(find.text('Email is required'), findsOneWidget);
  });

  testWidgets('submit blocked with inline errors when fields are empty',
      (tester) async {
    final api = ApiClient(
      baseUrl: 'https://api.test',
      httpClient: MockClient((req) async => http.Response('{}', 401)),
    );
    final cubit = AuthCubit(api);
    addTearDown(cubit.close);

    await tester.pumpWidget(_wrap(cubit));

    await tester.tap(find.byKey(const Key('login-submit')));
    await tester.pumpAndSettle();

    expect(find.text('Email is required'), findsOneWidget);
    expect(find.text('Password is required'), findsOneWidget);
    // Still on the auth cubit's unauthenticated state — login() was never called.
    expect(cubit.state.status, AuthStatus.unauthenticated);
  });
}
