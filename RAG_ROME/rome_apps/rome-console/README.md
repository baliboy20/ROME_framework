# 🖥️ ROME Management Console

A web-based management interface for the ROME VDB Management Service.

## 🚀 Quick Start

### Prerequisites
- ROME VDB Management Service running on http://localhost:8081
- Node.js 18+ installed

### Start the Console

```bash
# Navigate to console directory
cd services/rome-console

# Install dependencies (first time only)
npm install

# Start the console server
npm start

# Open in browser
open http://localhost:8082
```

## 📊 Features

### **Dashboard Overview**
- **Project Progress**: Real-time overall completion percentage
- **Active Robots**: Number of robots currently working
- **Document Count**: Total documents in ROME knowledge base

### **Robot Status Panel**
- **Live Robot Monitoring**: See all active robots and their progress
- **Protocol Step Tracking**: Current TDD step (1-8) for each robot
- **Progress Bars**: Visual progress indicators
- **Current Tasks**: What each robot is working on

### **Quick Actions**
- **🔍 Document Search**: Semantic search through ROME knowledge base
- **🔄 Status Refresh**: Manual refresh of all data
- **🔗 Integration Status**: Check integration readiness
- **📋 Contract Types**: View available contract templates
- **📊 Export Report**: Generate status reports (coming soon)

## 🎯 Usage

### **Monitor Project Progress**
The main dashboard shows real-time project metrics:
- Overall completion percentage
- Number of active robots
- Knowledge base size

### **Track Robot Activity**
The robot panel displays:
- Which robots are active
- Current protocol step (1-8)
- Task progress percentage
- Current task description

### **Search Knowledge Base**
Use the search box to find ROME documents:
1. Enter search terms (e.g., "API design patterns")
2. Click "Search Knowledge" or press Enter
3. View results with relevance scores

### **Quick Status Checks**
- Click "Refresh Status" to update all data
- Click "Integration Status" to see deployment readiness
- Click "View Contracts" to see available templates

## 🔧 Technical Details

### **API Integration**
The console connects to the ROME VDB Management Service at:
- **Base URL**: http://localhost:8081
- **Health Check**: `/health`
- **Coordination**: `/api/v1/coordination/status`
- **Document Search**: `/api/v1/documents/search`
- **Integration**: `/api/v1/integration/readiness`

### **Auto-Refresh**
- Status updates every 30 seconds automatically
- Manual refresh available via "Refresh Status" button
- Connection status indicator in header

### **Error Handling**
- Shows "Offline" status if ROME service is unreachable
- Displays error messages for failed operations
- Graceful fallbacks for missing data

## 🎨 Interface

### **Modern Design**
- **Glassmorphism**: Translucent cards with backdrop blur
- **Responsive**: Works on desktop, tablet, and mobile
- **Interactive**: Hover effects and smooth transitions
- **Accessible**: Clear typography and color contrast

### **Color Coding**
- **Green**: Healthy status, high progress
- **Purple**: ROME branding and primary actions
- **Red**: Errors and offline status
- **Gray**: Secondary information

## 🚀 Advanced Usage

### **Custom Searches**
Search supports:
- **Natural language**: "API design best practices"
- **Category filtering**: Protocols, standards, contracts
- **Robot-specific**: Content for specific robot types

### **Integration Monitoring**
Integration status shows:
- **Overall readiness score** (0-10)
- **Deployment status** (ready/conditional/not ready)
- **Active blockers** with severity levels

### **Real-time Updates**
- Robot status updates automatically
- Progress bars animate on changes
- Status badges update on connection changes

## 🛠️ Development

### **File Structure**
```
rome-console/
├── index.html          # Main console interface
├── package.json        # NPM configuration
└── README.md           # This file
```

### **Customization**
- Modify colors in CSS variables
- Add new panels by extending the grid layout
- Integrate additional API endpoints as needed

### **Deployment**
- Can be served by any web server
- No build process required (vanilla HTML/CSS/JS)
- CORS enabled on ROME VDB Management Service

---

**🎯 The console provides a visual, user-friendly way to monitor and manage your ROME TDD projects!**