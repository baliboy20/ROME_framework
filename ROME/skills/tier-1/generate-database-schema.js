/**
 * /generate-database-schema skill
 *
 * Generates database schema (SQL DDL) from data dictionary.
 *
 * Generates:
 * - CREATE TABLE statements
 * - Column definitions with types and constraints
 * - Primary keys and foreign keys
 * - Indexes
 * - Timestamps (created_at, updated_at)
 *
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Load SQL type mappings from manifest
const manifestPath = path.join(__dirname, '../registry/generate-database-schema.yaml');
const manifest = yaml.load(fs.readFileSync(manifestPath, 'utf8'));

const SQL_TYPE_MAPPING = manifest.sql_type_mapping;

class GenerateDatabaseSchema {
  static async execute(params, executionId) {
    const {
      data_dictionary_file,
      output_file = null,
      database_type = 'postgresql',
      include_indexes = true,
      include_constraints = true
    } = params;

    try {
      // Load data dictionary
      const dictContent = fs.readFileSync(data_dictionary_file, 'utf8');
      const dataDict = JSON.parse(dictContent);

      // Filter to primary entities (only these become tables)
      const primaryEntities = dataDict.entities.filter(e => e.type === 'primary');

      // Generate DDL statements
      const ddlStatements = [];

      // Generate CREATE TABLE statements
      primaryEntities.forEach(entity => {
        const tableDDL = this.generateTableDDL(entity, database_type, include_constraints);
        ddlStatements.push(tableDDL);
      });

      // Generate indexes if requested
      if (include_indexes) {
        primaryEntities.forEach(entity => {
          const indexDDL = this.generateIndexes(entity, database_type);
          if (indexDDL) {
            ddlStatements.push(indexDDL);
          }
        });
      }

      // Join all DDL statements
      const sqlDDL = ddlStatements.join('\n\n');

      // Write output file if requested
      if (output_file) {
        fs.writeFileSync(output_file, sqlDDL);
      }

      return {
        sql_ddl: sqlDDL,
        table_count: primaryEntities.length,
        output_file
      };

    } catch (error) {
      throw new Error(`Database schema generation failed: ${error.message}`);
    }
  }

  /**
   * Generate CREATE TABLE DDL for entity
   */
  static generateTableDDL(entity, databaseType, includeConstraints) {
    const tableName = this.toSnakeCase(entity.name);
    const typeMapping = SQL_TYPE_MAPPING[databaseType];

    let ddl = `CREATE TABLE ${tableName} (\n`;

    const columns = [];

    // Primary key (id)
    const idType = typeMapping.reference;
    columns.push(`  id ${idType} PRIMARY KEY`);

    // Entity attributes
    if (entity.inferred_attributes && entity.inferred_attributes.length > 0) {
      entity.inferred_attributes.forEach(attr => {
        const columnDef = this.generateColumnDef(attr, typeMapping, includeConstraints);
        columns.push(columnDef);
      });
    }

    // Standard timestamps
    const timestampType = typeMapping.datetime;
    columns.push(`  created_at ${timestampType} NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    columns.push(`  updated_at ${timestampType} NOT NULL DEFAULT CURRENT_TIMESTAMP`);

    ddl += columns.join(',\n');
    ddl += '\n);';

    return ddl;
  }

  /**
   * Generate column definition
   */
  static generateColumnDef(attribute, typeMapping, includeConstraints) {
    const columnName = this.toSnakeCase(attribute.name);
    const sqlType = typeMapping[attribute.inferred_type] || typeMapping.string;

    let def = `  ${columnName} ${sqlType}`;

    // Add constraints
    if (includeConstraints && attribute.constraints) {
      if (attribute.constraints.includes('required')) {
        def += ' NOT NULL';
      }

      if (attribute.constraints.includes('unique')) {
        def += ' UNIQUE';
      }
    }

    return def;
  }

  /**
   * Generate index definitions
   */
  static generateIndexes(entity, databaseType) {
    const tableName = this.toSnakeCase(entity.name);
    const indexes = [];

    if (entity.inferred_attributes && entity.inferred_attributes.length > 0) {
      entity.inferred_attributes.forEach(attr => {
        // Create indexes for indexed constraints
        if (attr.constraints && attr.constraints.includes('indexed')) {
          const columnName = this.toSnakeCase(attr.name);
          const indexName = `idx_${tableName}_${columnName}`;
          indexes.push(`CREATE INDEX ${indexName} ON ${tableName} (${columnName});`);
        }
      });
    }

    // Always index created_at for common queries
    indexes.push(`CREATE INDEX idx_${tableName}_created_at ON ${tableName} (created_at);`);

    return indexes.length > 0 ? indexes.join('\n') : null;
  }

  /**
   * Convert PascalCase to snake_case
   */
  static toSnakeCase(str) {
    return str
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
  }
}

module.exports = GenerateDatabaseSchema;
