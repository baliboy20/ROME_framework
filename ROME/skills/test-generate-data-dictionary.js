/**
 * Test script for /generate-data-dictionary skill
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');

async function testGenerateDataDictionary() {
  console.log('Testing /generate-data-dictionary skill...\n');

  const requirementsDir = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS/01-requirements'
  );

  const outputFile = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS/02-analysis/data-dictionary.json'
  );

  const outputMdFile = path.join(
    __dirname,
    '../../ROME_architect/ARTIFACTS/02-analysis/data-dictionary.md'
  );

  try {
    console.log('Generating data dictionary from all pilot requirements...\n');

    const result = await invokeSkill('generate-data-dictionary', {
      requirements_directory: requirementsDir,
      output_file: outputFile,
      output_format: 'json',
      include_inferred_types: true,
      include_relationships: true
    });

    console.log('='.repeat(70));
    console.log('Data Dictionary Generated');
    console.log('='.repeat(70));

    console.log(`\nStatistics:`);
    console.log(`  Total Entities: ${result.statistics.total_entities}`);
    console.log(`  Total Relationships: ${result.statistics.total_relationships}`);
    console.log(`  Total Attributes: ${result.statistics.total_attributes}`);
    console.log(`  Avg Attributes/Entity: ${result.statistics.avg_attributes_per_entity}`);
    console.log(`  Requirements Analyzed: ${result.statistics.requirements_analyzed}`);

    console.log(`\nEntity Type Distribution:`);
    for (const [type, count] of Object.entries(result.statistics.entity_type_distribution)) {
      console.log(`  ${type}: ${count}`);
    }

    console.log(`\nMost Mentioned Entities:`);
    for (const entity of result.statistics.most_mentioned_entities) {
      console.log(`  ${entity.name}: ${entity.mention_count} mentions`);
    }

    console.log(`\nMost Common Attributes:`);
    for (const attr of result.statistics.most_common_attributes) {
      console.log(`  ${attr.name}: ${attr.count} entities`);
    }

    console.log(`\nTop 10 Entities (by mentions):\n`);
    result.entities.slice(0, 10).forEach((entity, i) => {
      console.log(`${i + 1}. ${entity.name} (${entity.type})`);
      console.log(`   Mentions: ${entity.mention_count}`);
      console.log(`   Attributes: ${entity.attributes.length}`);
      if (entity.attributes.length > 0) {
        const attrSummary = entity.attributes.slice(0, 5).join(', ');
        const more = entity.attributes.length > 5 ? ` +${entity.attributes.length - 5} more` : '';
        console.log(`   → ${attrSummary}${more}`);
      }
      console.log('');
    });

    if (result.relationships.length > 0) {
      console.log(`Relationships (showing first 5):\n`);
      result.relationships.slice(0, 5).forEach((rel, i) => {
        console.log(`${i + 1}. ${rel.from_entity} --[${rel.relationship_type}]--> ${rel.to_entity}`);
      });
      console.log('');
    }

    // Also generate Markdown version
    console.log('Generating Markdown version...');
    await invokeSkill('generate-data-dictionary', {
      requirements_directory: requirementsDir,
      output_file: outputMdFile,
      output_format: 'markdown',
      include_inferred_types: true,
      include_relationships: true
    });

    console.log(`\n✅ Data dictionary generated successfully!`);
    console.log(`   JSON: ${outputFile}`);
    console.log(`   Markdown: ${outputMdFile}\n`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testGenerateDataDictionary();
