#!/usr/bin/env node
/**
 * Vector Database Schema Inspector
 * 
 * Purpose: Inspect Weaviate schemas and record counts across MCP servers
 * Author: PMA (Project Manager/Architect)
 * 
 * Usage:
 * npx ts-node vdb_schema_inspector.ts [--server rome|flutter|all]
 */

import weaviate from 'weaviate-ts-client';

interface SchemaInfo {
  className: string;
  description: string;
  properties: Array<{
    name: string;
    dataType: string[];
    description: string;
  }>;
  vectorizer: string;
  recordCount: number;
}

interface VDBInspectionResult {
  server: string;
  host: string;
  port: number;
  status: 'healthy' | 'unhealthy' | 'unreachable';
  schemas: SchemaInfo[];
  totalRecords: number;
  lastChecked: string;
}

class VDBSchemaInspector {
  private createClient(host: string, port: number) {
    return weaviate.client({
      scheme: 'http',
      host: `${host}:${port}`,
    });
  }

  async inspectServer(serverName: string, host: string, port: number): Promise<VDBInspectionResult> {
    const client = this.createClient(host, port);
    const result: VDBInspectionResult = {
      server: serverName,
      host,
      port,
      status: 'unreachable',
      schemas: [],
      totalRecords: 0,
      lastChecked: new Date().toISOString(),
    };

    try {
      // Test connection
      const ready = await client.misc.readyChecker().do();
      if (!ready) {
        result.status = 'unhealthy';
        return result;
      }

      result.status = 'healthy';

      // Get all schemas
      const schema = await client.schema.getter().do();
      
      if (schema?.classes) {
        for (const schemaClass of schema.classes) {
          // Get record count for this class
          let recordCount = 0;
          try {
            const countResult = await client.graphql
              .aggregate()
              .withClassName(schemaClass.class!)
              .withFields('meta { count }')
              .do();

            const aggregateKey = `Aggregate${schemaClass.class}`;
            recordCount = countResult?.data?.Aggregate?.[schemaClass.class!]?.[0]?.meta?.count || 
                         countResult?.data?.[aggregateKey]?.[0]?.meta?.count || 0;
          } catch (error: any) {
            console.warn(`Could not get count for ${schemaClass.class}:`, error?.message || 'Unknown error');
          }

          const schemaInfo: SchemaInfo = {
            className: schemaClass.class!,
            description: schemaClass.description || 'No description',
            properties: (schemaClass.properties || []).map(prop => ({
              name: prop.name!,
              dataType: prop.dataType!,
              description: prop.description || 'No description',
            })),
            vectorizer: schemaClass.vectorizer || 'none',
            recordCount,
          };

          result.schemas.push(schemaInfo);
          result.totalRecords += recordCount;
        }
      }

    } catch (error: any) {
      console.error(`Error inspecting ${serverName}:`, error?.message || 'Unknown error');
      result.status = 'unreachable';
    }

    return result;
  }

  async inspectAllServers(): Promise<VDBInspectionResult[]> {
    // Both MCP servers share the same Weaviate instance on port 8088
    const servers = [
      { name: 'SHARED_VDB (MCP_ROME & MCP_FLUTTER)', host: 'localhost', port: 8088 },
    ];

    const results = await Promise.all(
      servers.map(server => 
        this.inspectServer(server.name, server.host, server.port)
      )
    );

    return results;
  }

  printResults(results: VDBInspectionResult[]): void {
    console.log('\n=== VECTOR DATABASE SCHEMA INSPECTION REPORT ===\n');
    console.log(`Inspection Time: ${new Date().toISOString()}\n`);

    for (const result of results) {
      console.log(`📊 ${result.server} (${result.host}:${result.port})`);
      console.log(`Status: ${this.getStatusEmoji(result.status)} ${result.status.toUpperCase()}`);
      console.log(`Total Records: ${result.totalRecords.toLocaleString()}`);
      console.log(`Schema Classes: ${result.schemas.length}\n`);

      if (result.schemas.length > 0) {
        for (const schema of result.schemas) {
          console.log(`  🏗️  Class: ${schema.className}`);
          console.log(`     Description: ${schema.description}`);
          console.log(`     Vectorizer: ${schema.vectorizer}`);
          console.log(`     Records: ${schema.recordCount.toLocaleString()}`);
          console.log(`     Properties: ${schema.properties.length}`);
          
          for (const prop of schema.properties) {
            console.log(`       • ${prop.name} (${prop.dataType.join('|')}) - ${prop.description}`);
          }
          console.log('');
        }
      } else {
        console.log('  ⚠️  No schemas found or server unreachable\n');
      }

      console.log('─'.repeat(80) + '\n');
    }

    // Summary
    const totalRecords = results.reduce((sum, r) => sum + r.totalRecords, 0);
    const totalSchemas = results.reduce((sum, r) => sum + r.schemas.length, 0);
    const healthyServers = results.filter(r => r.status === 'healthy').length;

    console.log('📋 SUMMARY');
    console.log(`Healthy Servers: ${healthyServers}/${results.length}`);
    console.log(`Total Schema Classes: ${totalSchemas}`);
    console.log(`Total Records: ${totalRecords.toLocaleString()}`);
    console.log('');
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'healthy': return '✅';
      case 'unhealthy': return '⚠️';
      case 'unreachable': return '❌';
      default: return '❓';
    }
  }

  async exportToJson(results: VDBInspectionResult[], filename?: string): Promise<void> {
    const fs = await import('fs');
    const outputFile = filename || `vdb_inspection_${Date.now()}.json`;
    
    const report = {
      inspectionTime: new Date().toISOString(),
      summary: {
        totalServers: results.length,
        healthyServers: results.filter(r => r.status === 'healthy').length,
        totalSchemas: results.reduce((sum, r) => sum + r.schemas.length, 0),
        totalRecords: results.reduce((sum, r) => sum + r.totalRecords, 0),
      },
      servers: results,
    };

    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));
    console.log(`📄 Report exported to: ${outputFile}`);
  }
}

// CLI Interface
async function main() {
  const inspector = new VDBSchemaInspector();
  const args = process.argv.slice(2);
  const serverFilter = args.find(arg => arg.startsWith('--server='))?.split('=')[1];
  const exportJson = args.includes('--export');

  try {
    console.log('🔍 Inspecting Vector Database Schemas...\n');
    
    const results = await inspector.inspectAllServers();
    
    // Filter results if server specified
    const filteredResults = serverFilter 
      ? results.filter(r => r.server.toLowerCase().includes(serverFilter.toLowerCase()))
      : results;

    inspector.printResults(filteredResults);

    if (exportJson) {
      await inspector.exportToJson(filteredResults);
    }

  } catch (error: any) {
    console.error('❌ Inspection failed:', error?.message || 'Unknown error');
    console.error('Stack trace:', error?.stack);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { VDBSchemaInspector };