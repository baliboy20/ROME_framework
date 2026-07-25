import 'package:flutter/material.dart';
import '../theme/tokens.dart';

/// Field — labelled form field. `money` uses the serif (Source Serif 4). UXC-FRM-1: format
/// validation fires on blur; required-field validation on submit attempt.
class AppField extends StatelessWidget {
  final String label;
  final String? hint;
  final String? errorText;
  final bool money;
  final bool obscure;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final FocusNode? focusNode;
  final TextInputType? keyboardType;

  const AppField({
    super.key,
    required this.label,
    this.hint,
    this.errorText,
    this.money = false,
    this.obscure = false,
    this.controller,
    this.onChanged,
    this.focusNode,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: FobText.microLabel),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          focusNode: focusNode,
          obscureText: obscure,
          onChanged: onChanged,
          keyboardType: keyboardType,
          style: money ? FobText.money : FobText.body,
          decoration: InputDecoration(
            hintText: hint,
            errorText: errorText,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            filled: true,
            fillColor: FobColors.surfaceRaised,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(FobRadius.field),
              borderSide: const BorderSide(color: FobColors.hairline),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(FobRadius.field),
              borderSide: const BorderSide(color: FobColors.hairline),
            ),
          ),
        ),
      ],
    );
  }
}
