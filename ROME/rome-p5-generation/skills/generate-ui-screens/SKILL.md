# Generate UI Screens

**ID**: generate-ui-screens
**Category**: Frontend & UI
**Phase**: P5 (Generation)
**Robot**: Charlie

## Purpose

Generate screen/page implementations from use-cases.md

## Inputs

- use-cases.md (user workflows)
- design-system.md (styling)
- wireframes/ (layout)
- data-dictionary.yaml (form validations)

## Outputs

- Screen/page components
- Navigation setup
- Form implementations
- API integration

## Process

1. Read use case flows
2. Create screen scaffolding
3. Implement form fields with validation
4. Add API integration
5. Implement navigation
6. Add error handling
7. Apply design system

## Example Output

```dart
// lib/screens/register_screen.dart
class RegisterScreen extends StatefulWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Register')),
      body: Form(
        child: Column(
          children: [
            TextFormField(
              decoration: InputDecoration(labelText: 'Email'),
              validator: EmailValidator.validate,
            ),
            ElevatedButton(
              onPressed: _handleSubmit,
              child: Text('Create Account'),
            ),
          ],
        ),
      ),
    );
  }
}
```

## AORDL Traceability

- AORDL Intent → Screen purpose
- AORDL Preconditions → Navigation guards
- AORDL Outcomes → Success feedback
- AORDL Invariants → Form validation
