import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { buildVectorStore, searchStore } from "./embed.js";

export async function startServer(docsDir = "../ROME") {
  console.error("🚀 ROME Vector Database MCP Server Starting...");
  console.error(`📁 Documents directory: ${docsDir}`);
  console.error("📊 Initializing vector store with vendor-free embeddings...");
  
  let store = await buildVectorStore(docsDir);
  
  // Display server state
  const uniqueFiles = [...new Set(store.map(r => r.file))];
  console.error("\n" + "=".repeat(60));
  console.error("🎯 ROME Vector Database - Server State");
  console.error("=".repeat(60));
  console.error(`📚 Documents indexed: ${uniqueFiles.length}`);
  console.error(`🧩 Searchable chunks: ${store.length}`);
  console.error(`🤖 Embedding model: all-MiniLM-L6-v2 (local)`);
  console.error(`🔗 Protocol: Model Context Protocol (stdio)`);
  console.error(`⚡ Status: READY FOR QUERIES`);
  console.error("=".repeat(60));
  console.error("\n📋 Available Files:");
  uniqueFiles.forEach(file => console.error(`   • ${file}`));
  console.error("\n🔧 Available Tools:");
  console.error("   • searchRomeDocs(query, topK?) - Semantic search");
  console.error("   • listRomeFiles() - List all documents");
  console.error("   • getRomeContext(role) - Role-specific guidance");
  console.error("   • rebuildRomeIndex() - Force re-embedding of all documents");
  console.error("\n⏰ Server started at:", new Date().toLocaleString());
  console.error("📡 Waiting for Claude Code connections...\n");

  // Activity tracking
  let requestCount = 0;
  const startTime = Date.now();
  
  function logActivity(action, details = "") {
    requestCount++;
    const timestamp = new Date().toLocaleTimeString();
    const uptime = Math.round((Date.now() - startTime) / 1000);
    console.error(`[${timestamp}] 🔍 ${action} | Req #${requestCount} | Uptime: ${uptime}s ${details}`);
  }

  const server = new Server(
    {
      name: "rome-vector-db",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logActivity("LIST_TOOLS", "| Client requesting available tools");
    return {
      tools: [
        {
          name: "searchRomeDocs",
          description: "Search ROME methodology documents using semantic similarity. Find relevant guidance, protocols, and procedures by meaning, not just keywords.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Your search query (e.g., 'PMA responsibilities', 'robot task protocols', 'module design principles')"
              },
              topK: {
                type: "number",
                description: "Number of results to return (default: 5, max: 10)",
                default: 5,
                maximum: 10
              }
            },
            required: ["query"],
          },
        },
        {
          name: "listRomeFiles",
          description: "List all ROME methodology documents available in the vector database",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "getRomeContext",
          description: "Get comprehensive ROME methodology context for a specific role or area",
          inputSchema: {
            type: "object",
            properties: {
              role: {
                type: "string",
                description: "Role or area: 'PMA', 'rodeo', 'backend', 'frontend', 'devops', 'data-architect'",
                enum: ["PMA", "rodeo", "backend", "frontend", "devops", "data-architect"]
              }
            },
            required: ["role"],
          },
        },
        {
          name: "rebuildRomeIndex",
          description: "Force re-embedding of all ROME documents to rebuild the vector database index",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "searchRomeDocs": {
          const { query, topK = 5 } = args;
          const numResults = Math.min(Math.max(1, topK), 10);
          
          logActivity("SEARCH", `| Query: "${query.substring(0, 50)}" | Results: ${numResults}`);
          
          const searchStart = Date.now();
          const results = await searchStore(store, query, numResults);
          const searchTime = Date.now() - searchStart;
          
          console.error(`    └─ Search completed in ${searchTime}ms | Found ${results.length} chunks | Top score: ${results[0]?.score.toFixed(3) || 'N/A'}`);

          if (results.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `# No Results Found\n\nNo relevant ROME documents found for query: "${query}"\n\nTry:\n- Different keywords\n- Broader search terms\n- Check available files with listRomeFiles`,
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `# ROME Search Results for: "${query}"\n\nFound ${results.length} relevant sections:\n\n` +
                  results
                    .map(
                      (result, i) =>
                        `## ${i + 1}. ${result.file} (Relevance: ${(result.score * 100).toFixed(1)}%)\n\n${result.text}\n\n---\n`
                    )
                    .join(""),
              },
            ],
          };
        }

        case "listRomeFiles": {
          logActivity("LIST_FILES", `| Returning ${[...new Set(store.map(r => r.file))].length} files`);
          const uniqueFiles = [...new Set(store.map((r) => r.file))].sort();
          return {
            content: [
              {
                type: "text",
                text: `# ROME Methodology Files\n\n**Database Status:**\n- Documents indexed: ${uniqueFiles.length}\n- Searchable chunks: ${store.length}\n- Embedding model: all-MiniLM-L6-v2 (vendor-free)\n\n**Available Documents:**\n\n` +
                uniqueFiles.map((file) => `- **${file}**`).join("\n"),
              },
            ],
          };
        }

        case "getRomeContext": {
          const { role } = args;
          logActivity("GET_CONTEXT", `| Role: ${role}`);
          
          const contextStart = Date.now();
          const roleQueries = {
            PMA: "PMA Project Manager Architect responsibilities requirements analysis system design coordination",
            rodeo: "robot developer rodeo 7-step protocol task execution responsibilities methodology workflow",
            backend: "backend development API database server-side coding practices architecture",
            frontend: "frontend UI UX interface client-side React Flutter development user experience",
            devops: "DevOps infrastructure deployment database administration DBA operations monitoring",
            "data-architect": "data architecture database design data modeling schema structure organization",
          };

          const query = roleQueries[role] || `${role} responsibilities tasks methodology`;
          const results = await searchStore(store, query, 8);
          const contextTime = Date.now() - contextStart;
          
          console.error(`    └─ Context search completed in ${contextTime}ms | Found ${results.length} relevant sections`);

          if (results.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `# No Context Found\n\nNo specific ROME context found for role: "${role}"\n\nAvailable roles: PMA, rodeo, backend, frontend, devops, data-architect`,
                },
              ],
            };
          }

          return {
            content: [
              {
                type: "text",
                text: `# ROME Context for ${role.toUpperCase()}\n\n*Comprehensive methodology guidance for the ${role} role*\n\n` +
                  results
                    .map(
                      (result) => `## ${result.file}\n\n${result.text}\n\n---\n`
                    )
                    .join(""),
              },
            ],
          };
        }

        case "rebuildRomeIndex": {
          logActivity("REBUILD_INDEX", "| Force re-embedding all documents");
          
          const rebuildStart = Date.now();
          console.error("🔄 Rebuilding vector database index...");
          
          try {
            store = await buildVectorStore(docsDir);
            const rebuildTime = Date.now() - rebuildStart;
            const uniqueFiles = [...new Set(store.map(r => r.file))];
            
            console.error(`✓ Index rebuild completed in ${rebuildTime}ms`);
            console.error(`📚 Reindexed: ${uniqueFiles.length} documents, ${store.length} chunks`);
            
            return {
              content: [
                {
                  type: "text",
                  text: `# ROME Index Rebuilt Successfully\n\n**Rebuild Summary:**\n- **Time taken:** ${rebuildTime}ms\n- **Documents processed:** ${uniqueFiles.length}\n- **Searchable chunks:** ${store.length}\n- **Embedding model:** all-MiniLM-L6-v2 (local)\n\n**Reindexed Files:**\n\n` +
                    uniqueFiles.map((file) => `- **${file}**`).join("\n") + 
                    `\n\n✅ Vector database is now ready for semantic search queries.`,
                },
              ],
            };
          } catch (error) {
            console.error(`✗ Index rebuild failed: ${error.message}`);
            return {
              content: [
                {
                  type: "text",
                  text: `# Index Rebuild Failed\n\nError rebuilding ROME vector database: ${error.message}\n\nPlease check that the ROME documents directory exists and contains markdown files.`,
                },
              ],
              isError: true,
            };
          }
        }

        default:
          logActivity("ERROR", `| Unknown tool: ${name}`);
          return {
            content: [
              {
                type: "text",
                text: `Error: Unknown tool "${name}". Available tools: searchRomeDocs, listRomeFiles, getRomeContext, rebuildRomeIndex`,
              },
            ],
            isError: true,
          };
      }
    } catch (error) {
      console.error(`Tool error: ${error.message}`);
      return {
        content: [
          {
            type: "text",
            text: `Error executing ${name}: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✓ ROME Vector Database MCP Server ready for Claude Code");
}