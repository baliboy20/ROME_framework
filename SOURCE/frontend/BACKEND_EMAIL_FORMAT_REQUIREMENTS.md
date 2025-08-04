# Backend Email Format Requirements

## 🎯 Objective
**No HTML should be returned to the client - only Markdown format for email content.**

## 📋 Current Issues
- Frontend receives `htmlContent` field with raw HTML
- Email "View Full Email" displays HTML as raw text (poor UX)
- Should display properly formatted Markdown instead

## ✅ Required Backend Changes

### 1. Email Response Format
**Replace this:**
```json
{
  "id": "email123",
  "subject": "Medium Daily Digest",
  "sender": "noreply@medium.com",
  "date": "2024-01-15T10:30:00Z",
  "htmlContent": "<div><p>Raw HTML content here...</p></div>",
  "bodyPreview": "Plain text preview...",
  "allLinks": [...],
  "flutterLinks": [...]
}
```

**With this:**
```json
{
  "id": "email123", 
  "subject": "Medium Daily Digest",
  "sender": "noreply@medium.com",
  "date": "2024-01-15T10:30:00Z",
  "markdownContent": "# Email Title\n\nProperly formatted **Markdown** content here...",
  "bodyPreview": "Plain text preview...",
  "allLinks": [...],
  "flutterLinks": [...]
}
```

### 2. HTML-to-Markdown Conversion
- Convert `htmlContent` → `markdownContent` on the backend
- Use libraries like `turndown`, `html2md`, or similar
- Preserve formatting: headers, bold, italic, links, lists
- Clean up email-specific HTML artifacts

### 3. Fallback Handling
During transition period, backend can send both:
```json
{
  "markdownContent": "# Converted markdown here...",
  "htmlContent": "<div>Original HTML...</div>"  // Remove this once conversion is stable
}
```

Frontend will prioritize `markdownContent` and show warning for HTML.

## 🖥️ Frontend Implementation Status

### ✅ Already Implemented:
- `MarkdownViewer` component with syntax highlighting
- Content format detection and indicators
- Graceful handling of HTML during transition
- Debug logging for content format detection

### 📱 Current Behavior:
1. **If `markdownContent` exists**: Beautiful Markdown rendering
2. **If only `htmlContent` exists**: Shows HTML with warning message
3. **If only `bodyPreview` exists**: Shows plain text
4. **If no content**: Shows "No content available" message

### 🔍 Debug Features:
- Console logging shows received content format
- Visual format indicators (MD=green, HTML=orange, TEXT=gray)
- Content length information in logs

## 🧪 Testing Instructions

### For Backend Developer (Reena):
1. Modify email fetching endpoint to return `markdownContent` field
2. Test with various email types (HTML newsletters, plain text, etc.)
3. Verify HTML tags are converted to proper Markdown syntax
4. Check console logs show `Has markdownContent: true`

### For Frontend Testing:
1. Fetch emails using date filter
2. Click "View Full Email" on any email
3. **Expected**: Beautiful formatted content with green "MD" indicator
4. **Current**: Raw HTML text with orange "HTML" warning

## 🔧 Example Conversion

**Input HTML:**
```html
<h1>Medium Daily Digest</h1>
<p>Check out these <strong>amazing</strong> articles:</p>
<ul>
  <li><a href="https://medium.com/article1">Flutter State Management</a></li>
  <li><a href="https://medium.com/article2">Riverpod Best Practices</a></li>
</ul>
```

**Output Markdown:**
```markdown
# Medium Daily Digest

Check out these **amazing** articles:

- [Flutter State Management](https://medium.com/article1)
- [Riverpod Best Practices](https://medium.com/article2)
```

## 🚀 Benefits After Implementation
- ✅ Clean, readable email content
- ✅ Proper text formatting and styling  
- ✅ Clickable links
- ✅ Syntax highlighting for code blocks
- ✅ Copy-to-clipboard functionality
- ✅ Consistent formatting with article content
- ✅ Better user experience

---

**Status**: Frontend ready, waiting for backend HTML→Markdown conversion
**Priority**: High - affects core email viewing functionality