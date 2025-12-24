/**
 * /generate-database-schema skill (Tier 1)
 * Generates database schema SQL from data dictionary
 * Version: 1.0.0
 */

const fs = require('fs');
const path = require('path');

class GenerateDatabaseSchema {
  static async execute(params, executionId) {
    const { data_dictionary_file, output_file, database_type = 'postgresql' } = params;

    try {
      const dataDictionary = JSON.parse(fs.readFileSync(data_dictionary_file, 'utf8'));

      let schema = this.generateHeader(database_type);
      let tablesGenerated = 0;
      let indexesGenerated = 0;
      let constraintsGenerated = 0;

      // Generate CREATE TABLE statements
      dataDictionary.entities.forEach(entity => {
        const tableSQL = this.generateTable(entity, database_type);
        schema += tableSQL.sql;
        tablesGenerated++;
        indexesGenerated += tableSQL.indexes;
        constraintsGenerated += tableSQL.constraints;
      });

      // Generate foreign key constraints
      const fkSQL = this.generateForeignKeys(dataDictionary.entities, database_type);
      schema += fkSQL.sql;
      constraintsGenerated += fkSQL.count;

      // Generate indexes for common queries
      const idxSQL = this.generateIndexes(dataDictionary.entities, database_type);
      schema += idxSQL.sql;
      indexesGenerated += idxSQL.count;

      fs.writeFileSync(output_file, schema);

      return {
        tables_generated: tablesGenerated,
        indexes_generated: indexesGenerated,
        constraints_generated: constraintsGenerated
      };

    } catch (error) {
      throw new Error(`Database schema generation failed: ${error.message}`);
    }
  }

  static generateHeader(dbType) {
    let header = `-- Database Schema\n`;
    header += `-- Generated: ${new Date().toISOString()}\n`;
    header += `-- Database: ${dbType.toUpperCase()}\n\n`;

    if (dbType === 'postgresql') {
      header += `-- Enable UUID extension\n`;
      header += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n`;
    }

    return header;
  }

  static generateTable(entity, dbType) {
    let sql = `-- Table: ${entity.name}\n`;
    sql += `CREATE TABLE ${this.toSnakeCase(entity.name)} (\n`;

    const columns = [];
    let constraints = 0;
    let indexes = 0;

    // Add ID column
    if (dbType === 'postgresql') {
      columns.push(`    id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`);
    } else {
      columns.push(`    id SERIAL PRIMARY KEY`);
    }

    // Add entity attributes
    entity.attributes.forEach(attr => {
      const columnDef = this.generateColumn(attr, dbType);
      columns.push(`    ${columnDef}`);

      if (attr.unique) constraints++;
      if (attr.indexed) indexes++;
    });

    // Add audit columns
    columns.push(`    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    columns.push(`    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    columns.push(`    deleted_at TIMESTAMP NULL`);

    sql += columns.join(',\n');
    sql += `\n);\n\n`;

    // Add update trigger for updated_at
    if (dbType === 'postgresql') {
      sql += this.generateUpdateTrigger(entity.name);
    }

    return { sql, indexes, constraints };
  }

  static generateColumn(attr, dbType) {
    const colName = this.toSnakeCase(attr.name);
    const colType = this.mapDataType(attr.type, attr.length, dbType);

    let def = `${colName} ${colType}`;

    if (attr.required) def += ' NOT NULL';
    if (attr.unique) def += ' UNIQUE';
    if (attr.default !== undefined) {
      if (typeof attr.default === 'string') {
        def += ` DEFAULT '${attr.default}'`;
      } else {
        def += ` DEFAULT ${attr.default}`;
      }
    }

    return def;
  }

  static mapDataType(type, length, dbType) {
    if (!type) return 'TEXT';

    const typeMap = {
      string: length ? `VARCHAR(${length})` : 'TEXT',
      text: 'TEXT',
      integer: 'INTEGER',
      bigint: 'BIGINT',
      decimal: 'DECIMAL(10,2)',
      boolean: 'BOOLEAN',
      date: 'DATE',
      datetime: 'TIMESTAMP',
      timestamp: 'TIMESTAMP',
      json: dbType === 'postgresql' ? 'JSONB' : 'JSON',
      uuid: dbType === 'postgresql' ? 'UUID' : 'VARCHAR(36)',
      email: 'VARCHAR(255)',
      url: 'VARCHAR(2048)',
      phone: 'VARCHAR(20)'
    };

    return typeMap[type.toLowerCase()] || 'TEXT';
  }

  static generateForeignKeys(entities, dbType) {
    let sql = `-- Foreign Key Constraints\n`;
    let count = 0;

    entities.forEach(entity => {
      const tableName = this.toSnakeCase(entity.name);

      (entity.relationships || []).forEach(rel => {
        if (rel.type === 'many-to-one' || rel.type === 'one-to-one') {
          const fkColumn = this.toSnakeCase(rel.target) + '_id';
          const refTable = this.toSnakeCase(rel.target);

          sql += `ALTER TABLE ${tableName}\n`;
          sql += `    ADD CONSTRAINT fk_${tableName}_${fkColumn}\n`;
          sql += `    FOREIGN KEY (${fkColumn})\n`;
          sql += `    REFERENCES ${refTable}(id)\n`;
          sql += `    ON DELETE ${rel.onDelete || 'CASCADE'};\n\n`;
          count++;
        }
      });
    });

    return { sql, count };
  }

  static generateIndexes(entities, dbType) {
    let sql = `-- Indexes\n`;
    let count = 0;

    entities.forEach(entity => {
      const tableName = this.toSnakeCase(entity.name);

      // Index unique attributes
      entity.attributes.forEach(attr => {
        if (attr.indexed && !attr.unique) {
          const colName = this.toSnakeCase(attr.name);
          sql += `CREATE INDEX idx_${tableName}_${colName} ON ${tableName}(${colName});\n`;
          count++;
        }
      });

      // Index foreign keys
      (entity.relationships || []).forEach(rel => {
        if (rel.type === 'many-to-one' || rel.type === 'one-to-one') {
          const fkColumn = this.toSnakeCase(rel.target) + '_id';
          sql += `CREATE INDEX idx_${tableName}_${fkColumn} ON ${tableName}(${fkColumn});\n`;
          count++;
        }
      });

      // Soft delete index
      sql += `CREATE INDEX idx_${tableName}_deleted_at ON ${tableName}(deleted_at);\n`;
      count++;
    });

    sql += '\n';
    return { sql, count };
  }

  static generateUpdateTrigger(entityName) {
    const tableName = this.toSnakeCase(entityName);
    const funcName = `update_${tableName}_updated_at`;

    let sql = `-- Trigger for updated_at\n`;
    sql += `CREATE OR REPLACE FUNCTION ${funcName}()\n`;
    sql += `RETURNS TRIGGER AS $$\n`;
    sql += `BEGIN\n`;
    sql += `    NEW.updated_at = CURRENT_TIMESTAMP;\n`;
    sql += `    RETURN NEW;\n`;
    sql += `END;\n`;
    sql += `$$ LANGUAGE plpgsql;\n\n`;

    sql += `CREATE TRIGGER trigger_${tableName}_updated_at\n`;
    sql += `    BEFORE UPDATE ON ${tableName}\n`;
    sql += `    FOR EACH ROW\n`;
    sql += `    EXECUTE FUNCTION ${funcName}();\n\n`;

    return sql;
  }

  static toSnakeCase(str) {
    if (!str) return '';
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  }
}

module.exports = GenerateDatabaseSchema;
