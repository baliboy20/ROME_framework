/**
 * Test script to verify ROME Skills integration with Claude Code
 * Run this from the talib directory to verify skills are working
 */

const path = require('path');

async function testIntegration() {
  console.log('Testing ROME Skills Integration...\n');

  try {
    // Test 1: Load SkillInvoker
    console.log('1. Loading SkillInvoker...');
    const ROME_SKILLS_PATH = path.join(__dirname, '../../../../skills');
    const { skillInvoker } = require(path.join(ROME_SKILLS_PATH, 'lib/SkillInvoker.js'));
    console.log('   ✅ SkillInvoker loaded successfully\n');

    // Test 2: Check loaded skills
    console.log('2. Checking loaded skills...');
    const loadedSkills = skillInvoker.getLoadedSkills();
    console.log(`   ✅ ${loadedSkills.length} skills loaded\n`);

    // Test 3: Test list-skills
    console.log('3. Testing list-skills...');
    const listSkill = require('./list-skills.js');
    const listResult = await listSkill.execute({});
    console.log(`   ✅ list-skills executed successfully`);
    console.log(`   Found ${listResult.data.total_count} skills\n`);

    // Test 4: Test explain-skill
    console.log('4. Testing explain-skill...');
    const explainSkill = require('./explain-skill.js');
    const explainResult = await explainSkill.execute({ 'skill-name': 'list-skills' });
    console.log(`   ✅ explain-skill executed successfully\n`);

    // Test 5: Test recommend-skills
    console.log('5. Testing recommend-skills...');
    const recommendSkill = require('./recommend-skills.js');
    const recommendResult = await recommendSkill.execute({
      'task-description': 'I need to validate requirements',
      'current-phase': 'P1'
    });
    console.log(`   ✅ recommend-skills executed successfully`);
    if (recommendResult.data && recommendResult.data.recommendations) {
      console.log(`   Got ${recommendResult.data.recommendations.length} recommendations\n`);
    } else {
      console.log(`   Result: ${JSON.stringify(recommendResult, null, 2)}\n`);
    }

    console.log('✅ All integration tests passed!\n');
    console.log('Skills are ready to use in Claude Code.');
    console.log('Try: /list-skills or /recommend-skills in a Claude Code session\n');

    return true;

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run test if executed directly
if (require.main === module) {
  testIntegration().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { testIntegration };
