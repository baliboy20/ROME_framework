# Reverse Text API

A simple Node.js/Express backend service that reverses text input.

## API Endpoint

### POST /question

Accepts a text string and returns the reversed version.

**Request Body:**
```json
{
  "text": "Hello World"
}
```

**Response:**
```json
{
  "original": "Hello World",
  "reversed": "dlroW olleH",
  "timestamp": "2024-01-18T12:00:00.000Z"
}
```

**Validation Rules:**
- `text` field is required
- Must be a string
- Maximum length: 100 characters

**Error Responses:**

400 Bad Request - Invalid input:
```json
{
  "error": "Invalid input. Text field is required and must be a string."
}
```

400 Bad Request - Text too long:
```json
{
  "error": "Text exceeds maximum length of 100 characters."
}
```

## Setup and Installation

1. Install dependencies:
```bash
npm install
```

2. Run in development mode:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

4. Run production build:
```bash
npm start
```

## Testing

Run unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Test API endpoints (requires server running):
```bash
./test-api.sh
```

## Technical Details

- **Framework**: Express.js with TypeScript
- **Port**: 3000 (configurable via PORT environment variable)
- **CORS**: Enabled for all origins
- **Error Handling**: Centralized error middleware
- **Character Support**: Full Unicode support including emojis

## Performance

The API is designed to respond in under 500ms for all requests. The string reversal algorithm properly handles Unicode characters and multi-byte sequences.