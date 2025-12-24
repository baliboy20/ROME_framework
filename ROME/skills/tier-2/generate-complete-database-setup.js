/**
 * /generate-complete-database-setup skill (Tier 2)
 * Generates complete database setup (schema + ORM + config)
 * Version: 1.0.0
 */

const path = require('path');

class GenerateCompleteDatabaseSetup {
  static async execute(params, executionId) {
    const { data_dictionary_file, design_directory, output_directory } = params;

    const { invokeSkill } = require('../lib/SkillInvoker');

    try {
      const filesGenerated = [];
      let tablesCreated = 0;

      console.log('Generating complete database setup...\n');

      // 1. Generate database schema
      console.log('  1/2 Generating database schema...');
      const schemaFile = path.join(output_directory, 'schema.sql');
      const schema = await invokeSkill('generate-database-schema', {
        data_dictionary_file,
        output_file: schemaFile,
        database_type: 'postgresql'
      });
      filesGenerated.push('schema.sql');
      tablesCreated = schema.tables_generated;
      console.log(`    ✅ ${schema.tables_generated} tables, ${schema.indexes_generated} indexes\n`);

      // 2. Generate ORM configuration
      console.log('  2/2 Generating ORM config...');
      const ormConfig = await invokeSkill('generate-orm-config', {
        design_directory,
        output_directory,
        orm_type: 'typeorm'
      });
      filesGenerated.push(...ormConfig.files_generated);
      console.log(`    ✅ ${ormConfig.files_generated.length} files\n`);

      console.log('Complete database setup generated\n');

      return {
        files_generated: filesGenerated,
        tables_created: tablesCreated
      };

    } catch (error) {
      throw new Error(`Complete database setup generation failed: ${error.message}`);
    }
  }
}

module.exports = GenerateCompleteDatabaseSetup;
