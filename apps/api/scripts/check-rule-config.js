/**
 * Check LLM config for automation rules
 */

const { PrismaClient } = require('@prisma/client');

async function main() {
  const ruleId = process.argv[2];

  const prisma = new PrismaClient();

  try {
    if (ruleId) {
      // Check specific rule
      const rule = await prisma.automationRule.findUnique({
        where: { id: ruleId },
        select: {
          id: true,
          name: true,
          copyMode: true,
          customStylePrompt: true,
          messageTemplate: true,
          llmModel: true
        }
      });

      if (!rule) {
        console.log(`Rule ${ruleId} not found`);
        return;
      }

      console.log('\nRule LLM Config:');
      console.log(`  ID: ${rule.id}`);
      console.log(`  Name: ${rule.name}`);
      console.log(`  copyMode: ${rule.copyMode}`);
      console.log(`  llmModel: ${rule.llmModel}`);
      console.log(`  customStylePrompt: "${rule.customStylePrompt || '(empty)'}"`);
      console.log(`  messageTemplate: ${rule.messageTemplate ? '(set)' : '(not set)'}`);
    } else {
      // List all rules with LLM config
      const rules = await prisma.automationRule.findMany({
        where: { copyMode: 'LLM' },
        select: {
          id: true,
          name: true,
          copyMode: true,
          customStylePrompt: true,
          llmModel: true
        }
      });

      console.log(`\nFound ${rules.length} rules with copyMode=LLM:\n`);

      for (const rule of rules) {
        console.log(`${rule.name} (${rule.id}):`);
        console.log(`  copyMode: ${rule.copyMode}`);
        console.log(`  llmModel: ${rule.llmModel}`);
        console.log(`  customStylePrompt: "${rule.customStylePrompt || '(empty)'}"`);
        console.log('');
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
