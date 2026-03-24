const { execSync } = require('child_process');
try {
    const out = execSync('npx next lint --no-cache 2>&1', { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    require('fs').writeFileSync('lint_result.txt', out);
    console.log('Done. Output written to lint_result.txt');
} catch (e) {
    require('fs').writeFileSync('lint_result.txt', (e.stdout || '') + (e.stderr || ''));
    console.log('Lint had errors. Output written to lint_result.txt');
}
