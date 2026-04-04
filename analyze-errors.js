const data = JSON.parse(require('fs').readFileSync('eslint-report.json', 'utf8'));
const skipRules = ['@typescript-eslint/no-explicit-any'];
data.forEach(f => {
  const errors = f.messages.filter(m => m.severity === 2 && !skipRules.includes(m.ruleId));
  if (errors.length) {
    console.log('\n=== ' + f.filePath.replace(/.*smartschool-sn[\\/]/, ''));
    errors.forEach(m => console.log('  L' + m.line + ': [' + m.ruleId + '] ' + m.message.substring(0, 100)));
  }
});
