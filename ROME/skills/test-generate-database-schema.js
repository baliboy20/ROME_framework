/**
 * Test script for /generate-database-schema skill
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');
const fs = require('fs');

async function testGenerateDatabaseSchema() {
  console.log('Testing /generate-database-schema skill...\n');

  const dataDictFile = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS/02-analysis/data-dictionary.json'
  );

  const outputDir = path.join(__dirname, '../../ROME_architect/ARTIFACTS/06-database-schema');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFile = path.join(outputDir, 'schema-postgresql.sql');

  console.log('='.repeat(70));
  console.log('Generating PostgreSQL Database Schema');
  console.log('='.repeat(70));

  try {
    const result = await invokeSkill('generate-database-schema', {
      data_dictionary_file: dataDictFile,
      output_file: outputFile,
      database_type: 'postgresql',
      include_indexes: true,
      include_constraints: true
    });

    console.log(`\n📊 Database Schema Generated\n`);
    console.log(`Tables: ${result.table_count}`);
    console.log(`\nGenerated SQL DDL:\n`);
    console.log(result.sql_ddl);
    console.log(`\n✅ SQL DDL written to: ${outputFile}\n`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }

  console.log('✅ Test completed\n');
}

testGenerateDatabaseSchema();
