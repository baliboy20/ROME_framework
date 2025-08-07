# MCP Documentation Server - User Guide

## 🚀 Quick Start

### 1. Start the Server
```bash
cd SOURCE
npm run dev
```
Server runs on: `http://localhost:3000`
Health check: `http://localhost:3000/health`

### 2. Add Your Documentation
```bash
# Create documents directory if needed
mkdir -p SOURCE/documents

# Add your docs (any format)
cp your-docs.md SOURCE/documents/
cp -r your-project-docs/ SOURCE/documents/
```

### 3. Connect to Claude Code Session

Add the MCP server to your Claude Code configuration:

#### **Option A: Session Configuration**
```bash
# In your project directory, create/edit claude_desktop_config.json
{
  "mcpServers": {
    "flutter-docs": {
      "command": "node",
      "args": ["/path/to/rome_tdd/SOURCE/dist/index.js"],
      "env": {
        "OPENAI_API_KEY": "your-key-here",
        "WEAVIATE_URL": "http://localhost:8080"
      }
    }
  }
}
```

#### **Option B: Global Configuration**
```bash
# Edit ~/.config/claude-desktop/config.json
{
  "mcpServers": {
    "flutter-docs": {
      "command": "node",
      "args": ["/Users/will/flutterProjects/Exercises/august/rome_tdd/SOURCE/dist/index.js"]
    }
  }
}
```

### 4. Use with Claude Code
In your Claude Code terminal, the MCP server provides these tools:

#### **🔍 Search Documents**
```
search_docs(
  query="How to implement authentication", 
  category="architecture",
  limit=3
)
```

#### **📄 Get Code Snippets**
```
get_snippet(name="auth_bloc_template")
```

#### **📋 Get Architecture Rules**
```
get_rules(topic="state", context="BLoC implementation")
```

#### **✅ Validate Code**
```
validate_architecture(
  code="your_code_here",
  featureName="user_auth"
)
```

---

## 📁 Document Organization

### **Recommended Structure:**
```
SOURCE/documents/
├── architecture/        # System design docs
├── state-management/    # BLoC, Provider, etc.
├── ui-components/       # Widget guides
├── testing/            # Test patterns
├── deployment/         # CI/CD, Docker
├── examples/           # Code examples
└── snippets/           # Reusable templates
```

### **Supported Formats:**
- **Markdown** (`.md`) - Documentation
- **Text** (`.txt`) - Plain text
- **JSON** (`.json`) - API specs
- **Code files** (`.dart`, `.js`, `.ts`) - Examples

---

## ⚙️ Configuration

### **Environment Setup**
```bash
# Copy environment template
cp SOURCE/.env.example SOURCE/.env

# Required: OpenAI API key for embeddings
OPENAI_API_KEY=your-key-here

# Required: Weaviate database URL
WEAVIATE_URL=http://localhost:8080
```

### **Optional Docker Setup**
```bash
# Start full stack with Weaviate
docker-compose up -d weaviate

# Or use existing Weaviate instance
# Just update WEAVIATE_URL in .env
```

---

## 🔧 Usage Examples

### **In Claude Code Terminal:**

1. **Find BLoC documentation:**
   ```
   search_docs(query="BLoC pattern implementation", category="state")
   ```

2. **Get error handling template:**
   ```
   get_snippet(name="error_boundary_template")
   ```

3. **Validate architecture:**
   ```
   validate_architecture(
     code="class UserBloc extends Bloc<UserEvent, UserState> {...}",
     featureName="user_management"
   )
   ```

### **Query Types:**
- **Concept search:** "How to handle async operations"
- **Pattern lookup:** "Repository pattern implementation"
- **Error solutions:** "Flutter navigation error"
- **Best practices:** "State management rules"

---

## 🚨 Troubleshooting

### **Server Won't Start:**
```bash
# Check Node.js version (needs 18+)
node --version

# Install dependencies
npm install

# Check environment variables
cat .env
```

### **No Search Results:**
1. Add documents to `SOURCE/documents/`
2. Restart server to re-index
3. Check OpenAI API key in `.env`

### **Slow Responses:**
1. Start Weaviate locally: `docker-compose up weaviate`
2. Enable caching in config
3. Check server logs for errors

---

## 📊 Monitoring

### **Health Check:**
```bash
curl http://localhost:3000/health
```

### **Metrics (if enabled):**
```bash
curl http://localhost:9090/metrics
```

### **Logs:**
Server logs to console in development mode.

---

## 🔄 Document Updates

1. **Add new documents:** Place in `SOURCE/documents/`
2. **Restart server:** `npm run dev`
3. **Auto-indexing:** Documents are processed on startup

---

## 💡 Pro Tips

1. **Organize by topic** - Use subdirectories for better categorization
2. **Use descriptive filenames** - Helps with search relevance
3. **Include code examples** - Mixed docs/code works best
4. **Tag important sections** - Use clear headings
5. **Keep chunks focused** - Break up large documents

---

## 🆘 Support

**Need help?**
- Check the health endpoint: `/health`
- Review server logs for errors
- Verify environment variables
- Ensure Weaviate is accessible

**Project Structure:**
- **Server Code:** `SOURCE/src/`
- **Documents:** `SOURCE/documents/`
- **Config:** `SOURCE/.env`
- **Tests:** `SOURCE/tests/`