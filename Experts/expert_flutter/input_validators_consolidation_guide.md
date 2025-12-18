# Input Validators & Formatters Consolidation Guide
## The Art Deco Bakery - Flutter Application

### Overview
This guide consolidates **12 duplicated validators** and **2 duplicated formatter libraries** into a single, consistent source of truth. Current state shows 65% code duplication and 7 different validation patterns across 11 files.

---

## 1. Current State: Duplication Analysis

### 1.1 Duplicated Validators

| Validator | Locations | Return Types | Issue |
|-----------|-----------|--------------|-------|
| **Email** | 5 locations | `String?` × 3, `bool` × 2 | Different regex patterns |
| **Required** | 4 locations | `String?` × 3, `bool` × 1 | Inconsistent signatures |
| **Password** | 4 locations | `String?` × 3, `bool` × 1 | 6 vs 8 char requirements |
| **Postcode** | 2 locations | `String?`, `bool` | Two regex implementations |
| **Phone** | 2 locations | `String?`, `bool` | Different patterns |
| **Currency** | 2 locations | Formatters | Different input types |
| **Date** | 2 locations | Formatters | Different output formats |

### 1.2 Current Files (11 total)

**Validator Files:**
1. `/lib/core/utils/validators.dart` - ✓ Core, ✓ Reusable
2. `/lib/features/admin/core/utils/validators.dart` - ✗ Duplicate, ✗ Admin-only
3. `/lib/features/checkout/presentation/validators/card_validators.dart` - ✓ Specialized, ✓ Payment domain
4. Inline validators in 7 form widgets - ✗ Scattered, ✗ Non-reusable

**Formatter Files:**
5. `/lib/core/utils/formatters.dart` - ✓ Core, ✓ Top-level
6. `/lib/features/admin/core/utils/formatters.dart` - ✗ Duplicate, ✗ Admin-only

---

## 2. Unified Validator Pattern

### Standard Pattern

```dart
/// Input validator returning error message or null
///
/// Returns: null if valid, error message String if invalid
/// Pattern: `String? functionName(String? value, {options})`
```

### 2.1 Return Type Standard

✅ **ALWAYS use `String?` return type**

- `null` = value is valid
- Non-null String = error message to display

```dart
// ✅ CORRECT
String? validateEmail(String? value) {
  if (value == null || value.isEmpty) {
    return 'Email is required';
  }
  if (!_isValidEmail(value)) {
    return 'Please enter a valid email address';
  }
  return null; // Valid
}

// ❌ WRONG: Returns bool
bool isValidEmail(String? value) {
  return value != null && _isValidEmail(value);
}

// ❌ WRONG: Returns custom object
ValidationIssue? validateEmail(String? value) {
  if (value == null) {
    return ValidationIssue(field: 'email', message: 'Required');
  }
  return null;
}
```

### 2.2 Validator Naming Convention

```dart
// Pattern: validate[FieldName]
validateEmail()        // Not: isValidEmail, checkEmail
validatePassword()     // Not: isPassword, passwordIsValid
validatePhoneNumber()  // Not: isPhone, validatePhone
validatePostcode()     // Not: postcodeIsValid
validatePrice()        // Not: priceIsNumber
validateRequired()     // Not: isNotEmpty, hasValue
```

### 2.3 Error Messages

Always provide **user-friendly, field-aware error messages**:

```dart
// ✅ Good: Specific to field
String? validateEmail(String? value) {
  if (value == null || value.isEmpty) {
    return 'Email address is required';
  }
  if (!value.contains('@')) {
    return 'Please enter a valid email address';
  }
  return null;
}

// ✗ Bad: Generic or technical
String? validateEmail(String? value) {
  if (!RegExp(r'...').hasMatch(value ?? '')) {
    return 'Invalid format';
  }
  return null;
}
```

---

## 3. Master Validator Library

### Location
**Single source of truth**: `/lib/core/utils/validators.dart`

This file will contain ALL validators used across the application (except domain-specific ones like card validators).

### 3.1 Core Validators (Required Fields)

```dart
// 📁 lib/core/utils/validators.dart

/// Validates that field is not empty
String? validateRequired(String? value, {String fieldName = 'This field'}) {
  if (value == null || value.trim().isEmpty) {
    return '$fieldName is required';
  }
  return null;
}

/// Validates email format
String? validateEmail(String? value) {
  if (value == null || value.isEmpty) {
    return 'Email address is required';
  }

  // RFC 5322 simplified regex
  const emailRegex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
  if (!RegExp(emailRegex).hasMatch(value)) {
    return 'Please enter a valid email address';
  }
  return null;
}

/// Validates password strength
/// Requires: 8+ characters, at least 1 uppercase, 1 lowercase, 1 digit
String? validatePassword(String? value, {bool requireStrong = true}) {
  if (value == null || value.isEmpty) {
    return 'Password is required';
  }

  if (value.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  if (requireStrong) {
    if (!RegExp(r'[A-Z]').hasMatch(value)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!RegExp(r'[a-z]').hasMatch(value)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!RegExp(r'[0-9]').hasMatch(value)) {
      return 'Password must contain at least one digit';
    }
  }
  return null;
}

/// Validates confirmation password matches original
String? validatePasswordConfirmation(String? value, String originalPassword) {
  if (value == null || value.isEmpty) {
    return 'Please confirm your password';
  }
  if (value != originalPassword) {
    return 'Passwords do not match';
  }
  return null;
}

/// Validates phone number (UK format)
/// Accepts: +44, 0, 10-11 digits
String? validatePhoneNumber(String? value) {
  if (value == null || value.isEmpty) {
    return 'Phone number is required';
  }

  // Remove spaces, dashes, brackets
  final cleanNumber = value.replaceAll(RegExp(r'[\s\-()]'), '');

  // UK phone: +44 or 0, followed by 10-11 digits
  if (!RegExp(r'^(\+44|0)\d{10,11}$').hasMatch(cleanNumber)) {
    return 'Please enter a valid UK phone number';
  }
  return null;
}

/// Validates UK postcode format
String? validatePostcode(String? value) {
  if (value == null || value.isEmpty) {
    return 'Postcode is required';
  }

  // UK postcode validation (simplified)
  // Format: A(A)N(A/N) NAA or A(A)N AN(A/N)
  const postcodeRegex = r'^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$';
  if (!RegExp(postcodeRegex, caseSensitive: false).hasMatch(value.trim())) {
    return 'Please enter a valid UK postcode';
  }
  return null;
}

/// Validates numeric value is positive
String? validatePrice(String? value, {String fieldName = 'Price'}) {
  if (value == null || value.isEmpty) {
    return '$fieldName is required';
  }

  final parsed = double.tryParse(value);
  if (parsed == null) {
    return '$fieldName must be a number';
  }
  if (parsed <= 0) {
    return '$fieldName must be greater than 0';
  }
  return null;
}

/// Validates numeric value is positive integer (for stock, quantity)
String? validatePositiveInteger(String? value, {String fieldName = 'Value'}) {
  if (value == null || value.isEmpty) {
    return '$fieldName is required';
  }

  final parsed = int.tryParse(value);
  if (parsed == null) {
    return '$fieldName must be a whole number';
  }
  if (parsed < 0) {
    return '$fieldName must be 0 or greater';
  }
  return null;
}

/// Validates percentage (0-100)
String? validatePercentage(String? value, {String fieldName = 'Percentage'}) {
  if (value == null || value.isEmpty) {
    return '$fieldName is required';
  }

  final parsed = double.tryParse(value);
  if (parsed == null) {
    return '$fieldName must be a number';
  }
  if (parsed < 0 || parsed > 100) {
    return '$fieldName must be between 0 and 100';
  }
  return null;
}

/// Validates minimum length
String? validateMinLength(String? value, int minLength, {String fieldName = 'This field'}) {
  if (value == null || value.isEmpty) {
    return '$fieldName is required';
  }
  if (value.length < minLength) {
    return '$fieldName must be at least $minLength characters';
  }
  return null;
}

/// Validates maximum length
String? validateMaxLength(String? value, int maxLength, {String fieldName = 'This field'}) {
  if (value == null || value.isEmpty) {
    return '$fieldName is required';
  }
  if (value.length > maxLength) {
    return '$fieldName must be at most $maxLength characters';
  }
  return null;
}

/// Validates URL format
String? validateUrl(String? value) {
  if (value == null || value.isEmpty) {
    return 'URL is required';
  }

  try {
    Uri.parse(value);
    return null;
  } catch (e) {
    return 'Please enter a valid URL';
  }
}
```

### 3.2 Import and Usage

```dart
// ✅ In any form widget
import 'package:art_deco_bakery/core/utils/validators.dart';

class LoginPage extends StatefulWidget {
  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          // Use validator directly
          TextFormField(
            controller: _emailController,
            decoration: InputDecoration(
              labelText: 'Email',
              errorText: null, // Error shown below
            ),
            validator: validateEmail,
          ),
          TextFormField(
            controller: _passwordController,
            decoration: InputDecoration(
              labelText: 'Password',
            ),
            validator: validatePassword,
            obscureText: true,
          ),
          ElevatedButton(
            onPressed: () {
              if (_formKey.currentState!.validate()) {
                // Form is valid
              }
            },
            child: Text('Login'),
          ),
        ],
      ),
    );
  }
}
```

---

## 4. Domain-Specific Validators

### 4.1 Payment/Card Validators

**Location**: `/lib/features/checkout/presentation/validators/card_validators.dart` (KEEP, specialized domain)

```dart
// Payment domain is specialized enough to keep separate
class CardValidators {
  /// Validates credit card number using Luhn algorithm
  static String? validateCardNumber(String? value) {
    if (value == null || value.isEmpty) {
      return 'Card number is required';
    }

    final cardNumber = value.replaceAll(RegExp(r'\s'), '');
    if (!RegExp(r'^\d{13,19}$').hasMatch(cardNumber)) {
      return 'Card number must be 13-19 digits';
    }

    if (!_luhnCheck(cardNumber)) {
      return 'Card number is invalid';
    }
    return null;
  }

  /// Validates expiry date (MM/YY format)
  static String? validateExpiryDate(String? value) {
    if (value == null || value.isEmpty) {
      return 'Expiry date is required';
    }

    final parts = value.split('/');
    if (parts.length != 2) {
      return 'Use MM/YY format';
    }

    final month = int.tryParse(parts[0]);
    final year = int.tryParse(parts[1]);

    if (month == null || month < 1 || month > 12) {
      return 'Invalid month';
    }

    if (year == null) {
      return 'Invalid year';
    }

    // Check if card expired
    final now = DateTime.now();
    final expiry = DateTime(2000 + year, month);
    if (expiry.isBefore(now)) {
      return 'Card has expired';
    }

    return null;
  }

  /// Validates CVC (3-4 digits)
  static String? validateCvc(String? value) {
    if (value == null || value.isEmpty) {
      return 'CVC is required';
    }

    if (!RegExp(r'^\d{3,4}$').hasMatch(value)) {
      return 'CVC must be 3-4 digits';
    }
    return null;
  }

  /// Luhn algorithm for card number validation
  static bool _luhnCheck(String cardNumber) {
    int sum = 0;
    int isEven = 0;

    for (int i = cardNumber.length - 1; i >= 0; i--) {
      int digit = int.parse(cardNumber[i]);

      if (isEven == 1) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven ^= 1;
    }

    return (sum % 10) == 0;
  }
}
```

---

## 5. Input Formatters Consolidation

### 5.1 Core Formatters (Unified Location)

**Location**: `/lib/core/utils/formatters.dart` (Updated to be comprehensive)

```dart
// 📁 lib/core/utils/formatters.dart

class CurrencyFormatter {
  /// Formats pence as GBP (£)
  /// Example: 2999 → "£29.99"
  static String formatPence(int pence) {
    final pounds = (pence / 100).toStringAsFixed(2);
    return '£$pounds';
  }

  /// Formats pounds as GBP (£)
  /// Example: 29.99 → "£29.99"
  static String formatPounds(double pounds) {
    return '£${pounds.toStringAsFixed(2)}';
  }

  /// Format currency with custom symbol
  /// Example: formatCurrency(2999, 'USD', 'usd') → "$29.99"
  static String formatCurrency(int cents, String symbol, [String? code]) {
    final amount = (cents / 100).toStringAsFixed(2);
    return '$symbol$amount';
  }
}

class DateFormatter {
  /// Formats DateTime as dd MMM yyyy
  /// Example: DateTime(2025, 1, 15) → "15 Jan 2025"
  static String formatDate(DateTime date) {
    const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${date.day} ${months[date.month]} ${date.year}';
  }

  /// Formats DateTime as dd/MM/yyyy
  /// Example: DateTime(2025, 1, 15) → "15/01/2025"
  static String formatDateShort(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/'
           '${date.month.toString().padLeft(2, '0')}/'
           '${date.year}';
  }

  /// Formats DateTime with time HH:mm
  /// Example: DateTime(2025, 1, 15, 14, 30) → "15 Jan 2025, 14:30"
  static String formatDateTime(DateTime dateTime) {
    final date = formatDate(dateTime);
    final time = dateTime.hour.toString().padLeft(2, '0') +
                 ':' +
                 dateTime.minute.toString().padLeft(2, '0');
    return '$date, $time';
  }

  /// Formats time only HH:mm
  /// Example: DateTime(2025, 1, 15, 14, 30) → "14:30"
  static String formatTime(DateTime dateTime) {
    return '${dateTime.hour.toString().padLeft(2, '0')}:'
           '${dateTime.minute.toString().padLeft(2, '0')}';
  }

  /// Formats DateTime as relative string
  /// Example: 5 minutes ago → "5m ago"
  static String formatRelative(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inDays > 0) {
      return '${diff.inDays}d ago';
    } else if (diff.inHours > 0) {
      return '${diff.inHours}h ago';
    } else if (diff.inMinutes > 0) {
      return '${diff.inMinutes}m ago';
    } else {
      return 'just now';
    }
  }
}

class PhoneFormatter {
  /// Formats phone number as UK format
  /// Example: "07911123456" → "07911 123456"
  static String formatPhone(String phone) {
    final clean = phone.replaceAll(RegExp(r'\D'), '');
    if (clean.length != 11) return phone;

    return '${clean.substring(0, 5)} ${clean.substring(5)}';
  }

  /// Formats phone with country code
  /// Example: "07911123456" → "+44 7911 123456"
  static String formatPhoneInternational(String phone) {
    final clean = phone.replaceAll(RegExp(r'\D'), '');
    if (clean.startsWith('0')) {
      final international = '+44${clean.substring(1)}';
      return formatPhone(international);
    }
    return phone;
  }
}

class PostcodeFormatter {
  /// Formats UK postcode
  /// Example: "SW1A2AA" → "SW1A 2AA"
  static String formatPostcode(String postcode) {
    final clean = postcode.replaceAll(RegExp(r'\s'), '').toUpperCase();
    if (clean.length < 6) return clean;

    final part1 = clean.substring(0, clean.length - 3);
    final part2 = clean.substring(clean.length - 3);
    return '$part1 $part2';
  }
}

class NumberFormatter {
  /// Formats number with thousands separator
  /// Example: 1234567 → "1,234,567"
  static String formatNumber(num value) {
    return value.toString().replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (Match m) => ',',
    );
  }

  /// Formats percentage
  /// Example: 0.25 → "25%"
  static String formatPercentage(double value) {
    return '${(value * 100).toStringAsFixed(1)}%';
  }

  /// Formats file size
  /// Example: 1024000 → "1.0 MB"
  static String formatFileSize(int bytes) {
    const suffixes = ['B', 'KB', 'MB', 'GB', 'TB'];
    var index = 0;
    var size = bytes.toDouble();

    while (size > 1024 && index < suffixes.length - 1) {
      size /= 1024;
      index++;
    }

    return '${size.toStringAsFixed(1)} ${suffixes[index]}';
  }
}
```

### 5.2 Input Formatters (TextInputFormatter)

**Location**: `/lib/core/presentation/input_formatters/`

```dart
// 📁 lib/core/presentation/input_formatters/currency_input_formatter.dart

import 'package:flutter/services.dart';

class CurrencyInputFormatter extends TextInputFormatter {
  /// Formats input as currency with £ symbol
  /// Allows: digits and decimal point only
  /// Example: typing "1234" → "£12.34"
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    // Remove non-digit characters
    String text = newValue.text.replaceAll(RegExp(r'[^\d]'), '');

    if (text.isEmpty) {
      return newValue.copyWith(text: '');
    }

    // Pad with leading zero if needed
    if (text.length == 1) {
      text = '0$text';
    }

    // Format as currency
    final buffer = StringBuffer();
    final amount = int.parse(text);

    if (amount >= 100) {
      buffer.write('£');
      final pounds = amount ~/ 100;
      final pence = amount % 100;
      buffer.write('$pounds.${pence.toString().padLeft(2, '0')}');
    } else {
      buffer.write('£0.${amount.toString().padLeft(2, '0')}');
    }

    final string = buffer.toString();
    return newValue.copyWith(
      text: string,
      selection: TextSelection.collapsed(offset: string.length),
    );
  }
}

// 📁 lib/core/presentation/input_formatters/phone_input_formatter.dart

class PhoneInputFormatter extends TextInputFormatter {
  /// Formats input as UK phone number
  /// Example: typing "07911123456" → "07911 123456"
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    String text = newValue.text.replaceAll(RegExp(r'[^\d]'), '');

    if (text.length <= 5) {
      return newValue.copyWith(text: text);
    }

    // Format: XXXXX XXXXXX
    String formatted = '${text.substring(0, 5)} ${text.substring(5)}';
    if (text.length > 11) {
      formatted = formatted.substring(0, 12);
    }

    return newValue.copyWith(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}
```

**Payment Formatters** (Keep Separate in checkout feature):

```dart
// 📁 lib/features/checkout/presentation/input_formatters/card_number_input_formatter.dart

class CardNumberInputFormatter extends TextInputFormatter {
  /// Formats credit card number with spaces every 4 digits
  /// Example: "4532015112830366" → "4532 0151 1283 0366"
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final text = newValue.text.replaceAll(RegExp(r'[^\d]'), '');
    if (text.length > 19) return oldValue; // Limit length

    final buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      if (i > 0 && i % 4 == 0) {
        buffer.write(' ');
      }
      buffer.write(text[i]);
    }

    final string = buffer.toString();
    return newValue.copyWith(
      text: string,
      selection: TextSelection.collapsed(offset: string.length),
    );
  }
}

// 📁 lib/features/checkout/presentation/input_formatters/expiry_input_formatter.dart

class ExpiryInputFormatter extends TextInputFormatter {
  /// Formats expiry date as MM/YY with auto-slash insertion
  /// Example: typing "12" → "12/", typing "1225" → "12/25"
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    String text = newValue.text.replaceAll(RegExp(r'[^\d]'), '');
    if (text.length > 4) text = text.substring(0, 4);

    if (text.length <= 2) {
      return newValue.copyWith(text: text);
    }

    final mm = text.substring(0, 2);
    final yy = text.substring(2);
    final formatted = '$mm/$yy';

    return newValue.copyWith(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}
```

---

## 6. Migration Checklist

### Step 1: Update All Imports
- [ ] Remove imports from `/lib/features/admin/core/utils/validators.dart`
- [ ] Remove imports from inline validators
- [ ] Update all form widgets to import from `/lib/core/utils/validators.dart`

### Step 2: Consolidate Admin Validators
- [ ] Move admin-specific validators to `/lib/core/utils/validators.dart`
- [ ] Delete `/lib/features/admin/core/utils/validators.dart`

### Step 3: Remove Inline Validators
- [ ] Extract inline validators from 7 form widget files
- [ ] Use consolidated validators instead
- [ ] Keep formatters inline if UI-specific

### Step 4: Update Formatters
- [ ] Consolidate formatters in `/lib/core/utils/formatters.dart`
- [ ] Delete `/lib/features/admin/core/utils/formatters.dart`
- [ ] Create input formatter directory: `/lib/core/presentation/input_formatters/`

### Step 5: Code Review
- [ ] Verify all validators use `String?` return type
- [ ] Verify all error messages are user-friendly
- [ ] Verify all validators named `validate*`
- [ ] Verify no duplicate validators remain

---

## 7. Complete Validator Reference

### Validators Checklist
- [x] validateRequired() - Empty check
- [x] validateEmail() - Email format
- [x] validatePassword() - Password strength
- [x] validatePasswordConfirmation() - Password match
- [x] validatePhoneNumber() - UK phone format
- [x] validatePostcode() - UK postcode format
- [x] validatePrice() - Positive decimal
- [x] validatePositiveInteger() - Positive whole number
- [x] validatePercentage() - 0-100 range
- [x] validateMinLength() - Minimum characters
- [x] validateMaxLength() - Maximum characters
- [x] validateUrl() - URL format
- [x] CardValidators.validateCardNumber() - Luhn algorithm
- [x] CardValidators.validateExpiryDate() - MM/YY format
- [x] CardValidators.validateCvc() - 3-4 digits

### Formatters Checklist
- [x] CurrencyFormatter.formatPence() - Pence to GBP
- [x] CurrencyFormatter.formatPounds() - Pounds to GBP
- [x] DateFormatter.formatDate() - Long date
- [x] DateFormatter.formatDateShort() - Short date
- [x] DateFormatter.formatDateTime() - Date with time
- [x] DateFormatter.formatTime() - Time only
- [x] DateFormatter.formatRelative() - Relative time
- [x] PhoneFormatter.formatPhone() - UK phone format
- [x] PhoneFormatter.formatPhoneInternational() - International phone
- [x] PostcodeFormatter.formatPostcode() - UK postcode spacing
- [x] NumberFormatter.formatNumber() - Thousands separator
- [x] NumberFormatter.formatPercentage() - Percentage
- [x] NumberFormatter.formatFileSize() - File size
- [x] CurrencyInputFormatter - TextInputFormatter
- [x] PhoneInputFormatter - TextInputFormatter
- [x] CardNumberInputFormatter - TextInputFormatter
- [x] ExpiryInputFormatter - TextInputFormatter

---

## 8. Usage Examples

### Form with Validators

```dart
// ✅ After consolidation
import 'package:art_deco_bakery/core/utils/validators.dart';
import 'package:art_deco_bakery/core/presentation/input_formatters/phone_input_formatter.dart';

class RegistrationForm extends StatefulWidget {
  @override
  State<RegistrationForm> createState() => _RegistrationFormState();
}

class _RegistrationFormState extends State<RegistrationForm> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          TextFormField(
            decoration: InputDecoration(labelText: 'Email'),
            validator: validateEmail,  // Direct reference
          ),
          TextFormField(
            decoration: InputDecoration(labelText: 'Phone'),
            inputFormatters: [PhoneInputFormatter()],
            validator: validatePhoneNumber,
          ),
          TextFormField(
            decoration: InputDecoration(labelText: 'Postcode'),
            validator: validatePostcode,
          ),
          TextFormField(
            decoration: InputDecoration(labelText: 'Password'),
            validator: validatePassword,
            obscureText: true,
          ),
          TextFormField(
            decoration: InputDecoration(labelText: 'Confirm Password'),
            validator: (value) => validatePasswordConfirmation(
              value,
              _passwordController.text,
            ),
            obscureText: true,
          ),
          ElevatedButton(
            onPressed: () {
              if (_formKey.currentState!.validate()) {
                // Form is valid
              }
            },
            child: Text('Register'),
          ),
        ],
      ),
    );
  }
}
```

### Payment Form with Domain-Specific Validators

```dart
// ✅ Specialized validators for payment domain
import 'package:art_deco_bakery/features/checkout/presentation/validators/card_validators.dart';
import 'package:art_deco_bakery/features/checkout/presentation/input_formatters/card_number_input_formatter.dart';
import 'package:art_deco_bakery/features/checkout/presentation/input_formatters/expiry_input_formatter.dart';

class PaymentForm extends StatefulWidget {
  @override
  State<PaymentForm> createState() => _PaymentFormState();
}

class _PaymentFormState extends State<PaymentForm> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        children: [
          TextFormField(
            decoration: InputDecoration(labelText: 'Card Number'),
            inputFormatters: [CardNumberInputFormatter()],
            validator: CardValidators.validateCardNumber,
          ),
          TextFormField(
            decoration: InputDecoration(labelText: 'Expiry (MM/YY)'),
            inputFormatters: [ExpiryInputFormatter()],
            validator: CardValidators.validateExpiryDate,
          ),
          TextFormField(
            decoration: InputDecoration(labelText: 'CVC'),
            validator: CardValidators.validateCvc,
            obscureText: true,
          ),
        ],
      ),
    );
  }
}
```

---

## 9. Best Practices

✅ **DO:**
- Always use `String?` return type for validators
- Return null for valid input, error message for invalid
- Provide user-friendly, field-specific error messages
- Put validators in `/lib/core/utils/validators.dart`
- Put formatters in `/lib/core/utils/formatters.dart`
- Keep domain-specific validators in feature folder (e.g., CardValidators)
- Use TextInputFormatter for real-time formatting
- Test validators with empty, null, and edge-case inputs

❌ **DON'T:**
- Return bool from validators
- Use generic error messages
- Scatter validators across multiple files
- Mix validation logic into widgets
- Use regex patterns without testing
- Forget to handle null and empty cases
- Create validators that can throw exceptions

---

## 10. Timeline

- **Phase 1 (1 day)**: Consolidate validators in core
- **Phase 2 (1 day)**: Update imports in all form widgets
- **Phase 3 (1 day)**: Consolidate formatters
- **Phase 4 (1 day)**: Delete duplicate files and test
- **Phase 5 (ongoing)**: Code review all new validators

---

## References

- **Input Validators**: `/lib/core/utils/validators.dart`
- **Formatters**: `/lib/core/utils/formatters.dart`
- **Input Formatters**: `/lib/core/presentation/input_formatters/`
- **Card Validators**: `/lib/features/checkout/presentation/validators/card_validators.dart`
- **Form Patterns**: See forms in respective features

