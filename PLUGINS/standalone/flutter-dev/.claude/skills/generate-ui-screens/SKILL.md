# Generate UI Screens

**ID**: generate-ui-screens
**Category**: UI Generation

## Purpose

Generate screen/page implementations from use cases and requirements.

## Inputs

- User workflows / use cases
- Design system (styling)
- Wireframes / layout specifications
- Data models (form validations)

## Outputs

- Screen/page components
- Navigation setup
- Form implementations
- API integration

## Process

1. Read use case flows
2. Create screen scaffolding
3. Implement form fields with validation
4. Add API integration via BLoC/repository
5. Implement navigation
6. Add error, loading, and empty states
7. Apply design system

## Flutter Screen Example

```dart
// lib/features/auth/presentation/pages/register_page.dart
class RegisterPage extends StatelessWidget {
  const RegisterPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (context) => getIt<AuthBloc>(),
      child: const _RegisterView(),
    );
  }
}

class _RegisterView extends StatefulWidget {
  const _RegisterView();

  @override
  State<_RegisterView> createState() => _RegisterViewState();
}

class _RegisterViewState extends State<_RegisterView> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthSuccess) {
          context.go('/home');
        }
        if (state is AuthError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.message)),
          );
        }
      },
      builder: (context, state) {
        return Scaffold(
          appBar: AppBar(title: const Text('Register')),
          body: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  AppTextField(
                    label: 'Email',
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    validator: (value) {
                      if (value == null || !value.contains('@')) {
                        return 'Enter a valid email';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  AppTextField(
                    label: 'Password',
                    controller: _passwordController,
                    obscureText: true,
                    validator: (value) {
                      if (value == null || value.length < 8) {
                        return 'Password must be at least 8 characters';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),
                  AppButton(
                    label: 'Create Account',
                    loading: state is AuthLoading,
                    onPressed: _handleSubmit,
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _handleSubmit() {
    if (_formKey.currentState!.validate()) {
      context.read<AuthBloc>().add(
        RegisterEvent(
          email: _emailController.text,
          password: _passwordController.text,
        ),
      );
    }
  }
}
```

## Screen Checklist

- [ ] BlocProvider setup at page level
- [ ] Loading state shown during async operations
- [ ] Error state with user-friendly message and retry
- [ ] Empty state for lists with no data
- [ ] Form validation on all inputs
- [ ] Navigation on success (BlocListener)
- [ ] Keyboard dismissal on tap outside
- [ ] Controllers disposed in dispose()
- [ ] Accessibility labels on interactive elements
- [ ] Responsive layout for target platforms
