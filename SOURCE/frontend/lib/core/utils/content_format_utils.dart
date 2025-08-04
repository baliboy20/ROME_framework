/// Utility functions for handling different content formats (HTML, Markdown)
/// This helps during the transition period while Reena adapts the backend

class ContentFormatUtils {
  /// Detects if content is likely HTML based on common HTML tags
  static bool isLikelyHtml(String content) {
    if (content.isEmpty) return false;
    
    // Check for common HTML patterns
    final htmlPatterns = [
      RegExp(r'<html[^>]*>', caseSensitive: false),
      RegExp(r'<body[^>]*>', caseSensitive: false),
      RegExp(r'<div[^>]*>', caseSensitive: false),
      RegExp(r'<p[^>]*>', caseSensitive: false),
      RegExp(r'<h[1-6][^>]*>', caseSensitive: false),
      RegExp(r'<span[^>]*>', caseSensitive: false),
      RegExp(r'<img[^>]*>', caseSensitive: false),
      RegExp(r'<a[^>]*href[^>]*>', caseSensitive: false),
    ];
    
    return htmlPatterns.any((pattern) => pattern.hasMatch(content));
  }
  
  /// Detects if content is likely Markdown based on common Markdown patterns
  static bool isLikelyMarkdown(String content) {
    if (content.isEmpty) return false;
    
    // Check for common Markdown patterns
    final markdownPatterns = [
      RegExp(r'^#{1,6}\s+.+$', multiLine: true), // Headers
      RegExp(r'^\*\s+.+$', multiLine: true),     // Bullet lists
      RegExp(r'^\d+\.\s+.+$', multiLine: true),  // Numbered lists
      RegExp(r'\*\*[^*]+\*\*'),                  // Bold
      RegExp(r'\*[^*]+\*'),                      // Italic
      RegExp(r'`[^`]+`'),                        // Inline code
      RegExp(r'```[\s\S]*?```'),                 // Code blocks
      RegExp(r'!\[[^\]]*\]\([^)]+\)'),          // Images
      RegExp(r'\[[^\]]+\]\([^)]+\)'),           // Links
    ];
    
    return markdownPatterns.any((pattern) => pattern.hasMatch(content));
  }
  
  /// Gets the detected content format
  static ContentFormat detectFormat(String content) {
    if (isLikelyHtml(content)) {
      return ContentFormat.html;
    } else if (isLikelyMarkdown(content)) {
      return ContentFormat.markdown;
    } else {
      return ContentFormat.plainText;
    }
  }
  
  /// Gets a display name for the content format
  static String getFormatDisplayName(ContentFormat format) {
    switch (format) {
      case ContentFormat.html:
        return 'HTML';
      case ContentFormat.markdown:
        return 'MD';
      case ContentFormat.plainText:
        return 'TEXT';
    }
  }
  
  /// Gets a color for the content format indicator
  static String getFormatColor(ContentFormat format) {
    switch (format) {
      case ContentFormat.html:
        return 'orange'; // HTML is being phased out
      case ContentFormat.markdown:
        return 'green';  // Preferred format
      case ContentFormat.plainText:
        return 'gray';   // Plain text
    }
  }
}

enum ContentFormat {
  html,
  markdown,
  plainText,
}