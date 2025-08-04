# Medium Flutter Link Extractor - User Journey Guide

## 📋 Complete User Journey to View Emails

### Prerequisites
✅ **Gmail OAuth Token**: Already configured in `/PROJECT/user_docs/token.json`
✅ **MongoDB**: Running on localhost:27017
✅ **Backend Server**: Running on port 3000
✅ **Frontend**: Running on port 8080

---

## 🚀 Step-by-Step Journey

### 1. Start the System

#### Backend (Terminal 1):
```bash
cd SOURCE/backend
npm run dev
```

**What happens:**
- Server starts on port 3000
- Automatically loads existing Gmail token from `/PROJECT/user_docs/token.json`
- Token is migrated to the system for user `default-user`
- You'll see: `✅ Successfully migrated existing Gmail token`

#### Frontend (Terminal 2):
```bash
cd SOURCE/frontend
flutter run -d web-server --web-port=8080
```

### 2. Access the Application
Open browser: http://localhost:8080

### 3. Fetch Emails

#### In the Email Filter Panel (Left side):
1. **Date Range**: 
   - Default: Last 30 days
   - Click calendar icons to adjust dates
   
2. **Email Subjects**: 
   - Default: "Medium Daily Digest"
   - Add multiple subjects separated by commas
   
3. **Keywords**: 
   - Default: "flutter"
   - Add multiple keywords separated by commas
   
4. **Click "Fetch Emails" button**

### 4. What Happens Behind the Scenes

1. **Frontend** → Sends filter request to backend
2. **Backend** → Uses existing Gmail OAuth token
3. **Gmail API** → Fetches emails matching criteria
4. **Backend** → Extracts Flutter-related links from emails
5. **MongoDB** → Stores processed emails
6. **Frontend** → Displays email count

### 5. View Emails (NEW!)

After clicking "Fetch Emails":
- Success notification shows email count
- **Click "Emails" tab** in the right panel to see:
  - Email subject and sender
  - Date received
  - Link counts (total and Flutter-specific)
  - Expandable preview
  - "View Full Email" button for complete content
  - "Process Links" button for individual email processing

### 6. View Articles

Click the "Articles" tab to see:
- Articles automatically extracted from all emails
- Limited to 50 articles to prevent browser crashes
- Each article shows:
  - Title
  - Author
  - Date
  - Reading time
  - Link to original Medium article

### 7. Interact with Articles

- **Select Articles**: Check boxes to select multiple
- **Scrape Content**: Click "Scrape Selected" to fetch full article content
- **View Article**: Click the external link icon to open on Medium
- **Progress Tracking**: Real-time WebSocket updates during scraping

---

## 🔧 Troubleshooting

### "No emails found"
- Check date range includes recent emails
- Verify Gmail account has Medium Daily Digest emails
- Check keywords match article content

### "Authentication failed"
- Token exists but may be expired
- Backend will auto-refresh using refresh token
- Check backend logs for detailed auth errors

### Browser crashes
- System now limits display to 50 articles
- Use date filters to narrow results
- Clear browser cache if issues persist

---

## 📝 Important Notes

1. **No Manual OAuth Required**: The existing token in `/PROJECT/user_docs/token.json` handles authentication automatically

2. **Default User**: System uses `default-user` as the user ID

3. **Token Refresh**: Backend automatically refreshes expired access tokens using the refresh token

4. **Data Persistence**: All fetched emails and articles are stored in MongoDB for future access

---

## 🎯 Quick Test

1. Start backend & frontend
2. Open http://localhost:8080
3. Click "Fetch Emails" with default settings
4. See emails appear with article count
5. Articles display in the table
6. Select a few and click external link icons to verify

The system should now work seamlessly without any manual authentication steps!