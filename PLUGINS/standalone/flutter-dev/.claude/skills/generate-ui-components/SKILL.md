# Generate UI Components

**ID**: generate-ui-components
**Category**: UI Generation

## Purpose

Generate reusable UI component library from design system and screen designs.

## Inputs

- Screen mockups, component specifications
- Design system (colors, typography, spacing, component patterns)
- UI framework (Flutter)

## Outputs

- Reusable UI components
- Component props/interfaces
- Component documentation

## Process

1. Extract reusable patterns from screen designs
2. Generate atomic components (buttons, inputs, cards)
3. Build composite components (forms, lists, modals)
4. Implement design system tokens
5. Add proper typing and documentation

## Flutter Component Example

```dart
// lib/core/widgets/app_button.dart
enum ButtonVariant { primary, secondary, danger }
enum ButtonSize { small, medium, large }

class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final ButtonSize size;
  final bool loading;

  const AppButton({
    Key? key,
    required this.label,
    this.onPressed,
    this.variant = ButtonVariant.primary,
    this.size = ButtonSize.medium,
    this.loading = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: loading ? null : onPressed,
      style: _buttonStyle(context),
      child: loading
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Text(label),
    );
  }

  ButtonStyle _buttonStyle(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    final backgroundColor = switch (variant) {
      ButtonVariant.primary => colorScheme.primary,
      ButtonVariant.secondary => colorScheme.secondary,
      ButtonVariant.danger => colorScheme.error,
    };

    final padding = switch (size) {
      ButtonSize.small => const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      ButtonSize.medium => const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ButtonSize.large => const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
    };

    return ElevatedButton.styleFrom(
      backgroundColor: backgroundColor,
      padding: padding,
    );
  }
}
```

```dart
// lib/core/widgets/app_text_field.dart
class AppTextField extends StatelessWidget {
  final String label;
  final String? hint;
  final TextEditingController? controller;
  final String? Function(String?)? validator;
  final bool obscureText;
  final TextInputType? keyboardType;

  const AppTextField({
    Key? key,
    required this.label,
    this.hint,
    this.controller,
    this.validator,
    this.obscureText = false,
    this.keyboardType,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      validator: validator,
      obscureText: obscureText,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        border: const OutlineInputBorder(),
      ),
    );
  }
}
```

## Component Checklist

- [ ] Const constructor where possible
- [ ] All customizable properties exposed as parameters
- [ ] Reasonable defaults for optional parameters
- [ ] Accessibility semantics included
- [ ] Responds to theme changes
- [ ] Handles loading, error, and disabled states
- [ ] Widget test written
