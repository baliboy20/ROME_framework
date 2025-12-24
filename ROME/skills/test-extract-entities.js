/**
 * Test script for /extract-entities skill
 */

const { invokeSkill } = require('./lib/SkillInvoker');
const path = require('path');

async function testExtractEntities() {
  console.log('Testing /extract-entities skill...\n');

  // Test with multiple requirements to see entity extraction patterns
  const testRequirements = [
    'REQ-001', // create project
    'REQ-002', // create task
    'REQ-011', // create team-member
    'REQ-021'  // create api-token
  ];

  for (const reqId of testRequirements) {
    console.log('='.repeat(60));
    console.log(`Testing ${reqId}`);
    console.log('='.repeat(60));

    const requirementFile = path.join(
      __dirname,
      '../../ROME_architect/ARTIFACTS/01-requirements',
      `${reqId}.yaml`
    );

    try {
      const result = await invokeSkill('extract-entities', {
        requirement_file: requirementFile,
        include_relationships: true
      });

      console.log(`\nRequirement: ${result.requirement_id}`);
      console.log(`\nEntities Found: ${result.entities.length}`);

      result.entities.forEach((entity, i) => {
        console.log(`\n${i + 1}. ${entity.name} (${entity.type})`);
        console.log(`   Source Fields: ${entity.source_fields.join(', ')}`);
        if (entity.attributes.length > 0) {
          console.log(`   Attributes: ${entity.attributes.join(', ')}`);
        }
      });

      if (result.relationships.length > 0) {
        console.log(`\nRelationships Found: ${result.relationships.length}`);
        result.relationships.forEach((rel, i) => {
          console.log(`${i + 1}. ${rel.from_entity} --[${rel.relationship_type}]--> ${rel.to_entity}`);
          console.log(`   Source: ${rel.source_field}`);
        });
      } else {
        console.log('\nNo explicit relationships found.');
      }

      console.log('\n');

    } catch (error) {
      console.error(`❌ Test failed for ${reqId}:`, error.message);
      console.error(error.stack);
    }
  }

  console.log('✅ All tests completed\n');
}

testExtractEntities();
