/**
 * /generate-result-types skill (Tier 1)
 * Generates native Dart sealed class Result<T> for error handling
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

class GenerateResultTypes {
  static async execute(params, executionId) {
    const { output_directory } = params;

    try {
      // Ensure output directory exists
      fs.mkdirSync(output_directory, { recursive: true });

      const filesGenerated = [];

      // Generate Result sealed class
      const resultFile = path.join(output_directory, 'result.dart');
      fs.writeFileSync(resultFile, this.generateResultType());
      filesGenerated.push('result.dart');

      return {
        files_generated: filesGenerated
      };

    } catch (error) {
      throw new Error(`Result type generation failed: ${error.message}`);
    }
  }

  static generateResultType() {
    let code = `/// Result type for error handling\n`;
    code += `/// Native Dart sealed class - no dartz dependency\n`;
    code += `sealed class Result<T> {\n`;
    code += `  const Result();\n\n`;

    code += `  /// Fold the result into a single value\n`;
    code += `  /// Executes onSuccess for Success, onError for Error\n`;
    code += `  U fold<U>(\n`;
    code += `    U Function(T value) onSuccess,\n`;
    code += `    U Function(String error) onError,\n`;
    code += `  ) {\n`;
    code += `    return switch (this) {\n`;
    code += `      Success(value: final value) => onSuccess(value),\n`;
    code += `      Error(message: final message) => onError(message),\n`;
    code += `    };\n`;
    code += `  }\n\n`;

    code += `  /// Check if result is success\n`;
    code += `  bool get isSuccess => this is Success<T>;\n\n`;

    code += `  /// Check if result is error\n`;
    code += `  bool get isError => this is Error<T>;\n\n`;

    code += `  /// Get value or null\n`;
    code += `  T? get valueOrNull {\n`;
    code += `    return switch (this) {\n`;
    code += `      Success(value: final value) => value,\n`;
    code += `      Error() => null,\n`;
    code += `    };\n`;
    code += `  }\n\n`;

    code += `  /// Get error message or null\n`;
    code += `  String? get errorOrNull {\n`;
    code += `    return switch (this) {\n`;
    code += `      Success() => null,\n`;
    code += `      Error(message: final message) => message,\n`;
    code += `    };\n`;
    code += `  }\n\n`;

    code += `  /// Get value or throw\n`;
    code += `  T get valueOrThrow {\n`;
    code += `    return switch (this) {\n`;
    code += `      Success(value: final value) => value,\n`;
    code += `      Error(message: final message) => throw Exception(message),\n`;
    code += `    };\n`;
    code += `  }\n\n`;

    code += `  /// Get value or default\n`;
    code += `  T valueOr(T defaultValue) {\n`;
    code += `    return switch (this) {\n`;
    code += `      Success(value: final value) => value,\n`;
    code += `      Error() => defaultValue,\n`;
    code += `    };\n`;
    code += `  }\n\n`;

    code += `  /// Map success value\n`;
    code += `  Result<U> map<U>(U Function(T value) transform) {\n`;
    code += `    return switch (this) {\n`;
    code += `      Success(value: final value) => Success(transform(value)),\n`;
    code += `      Error(message: final message) => Error(message),\n`;
    code += `    };\n`;
    code += `  }\n\n`;

    code += `  /// FlatMap for chaining operations\n`;
    code += `  Result<U> flatMap<U>(Result<U> Function(T value) transform) {\n`;
    code += `    return switch (this) {\n`;
    code += `      Success(value: final value) => transform(value),\n`;
    code += `      Error(message: final message) => Error(message),\n`;
    code += `    };\n`;
    code += `  }\n`;

    code += `}\n\n`;

    // Success class
    code += `/// Success result with value\n`;
    code += `final class Success<T> extends Result<T> {\n`;
    code += `  final T value;\n\n`;
    code += `  const Success(this.value);\n\n`;

    code += `  @override\n`;
    code += `  String toString() => 'Success(value: \$value)';\n\n`;

    code += `  @override\n`;
    code += `  bool operator ==(Object other) {\n`;
    code += `    return identical(this, other) ||\n`;
    code += `        other is Success<T> &&\n`;
    code += `        runtimeType == other.runtimeType &&\n`;
    code += `        value == other.value;\n`;
    code += `  }\n\n`;

    code += `  @override\n`;
    code += `  int get hashCode => value.hashCode;\n`;

    code += `}\n\n`;

    // Error class
    code += `/// Error result with message\n`;
    code += `final class Error<T> extends Result<T> {\n`;
    code += `  final String message;\n\n`;
    code += `  const Error(this.message);\n\n`;

    code += `  @override\n`;
    code += `  String toString() => 'Error(message: \$message)';\n\n`;

    code += `  @override\n`;
    code += `  bool operator ==(Object other) {\n`;
    code += `    return identical(this, other) ||\n`;
    code += `        other is Error<T> &&\n`;
    code += `        runtimeType == other.runtimeType &&\n`;
    code += `        message == other.message;\n`;
    code += `  }\n\n`;

    code += `  @override\n`;
    code += `  int get hashCode => message.hashCode;\n`;

    code += `}\n`;

    return code;
  }
}

module.exports = GenerateResultTypes;
