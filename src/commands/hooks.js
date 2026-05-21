import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../../templates/hooks');
const HOOKS_INSTALL_DIR = path.join(process.cwd(), '.claude', 'hooks');

function parseHookMeta(content) {
  const event = (content.match(/^# EVENT:\s*(.+)$/m) || [])[1]?.trim() ?? 'Unknown';
  const desc = (content.match(/^# DESCRIPTION:\s*(.+)$/m) || [])[1]?.trim() ?? '';
  return { event, desc };
}

function listTemplates() {
  if (!fs.existsSync(TEMPLATES_DIR)) return [];
  return fs.readdirSync(TEMPLATES_DIR)
    .filter(f => f.endsWith('.sh'))
    .map(f => {
      const full = path.join(TEMPLATES_DIR, f);
      const content = fs.readFileSync(full, 'utf8');
      const { event, desc } = parseHookMeta(content);
      const installed = fs.existsSync(path.join(HOOKS_INSTALL_DIR, f));
      return { name: f.replace('.sh', ''), file: f, event, desc, installed };
    });
}

function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

export async function hooksCommand(sub, name, opts) {
  sub = sub ?? 'list';

  if (sub === 'list') {
    const templates = listTemplates();
    if (templates.length === 0) {
      console.log(chalk.yellow('No hook templates found in templates/hooks/'));
      return;
    }
    console.log(chalk.bold('\nAvailable hooks:\n'));
    for (const t of templates) {
      const status = t.installed
        ? chalk.green('[installed]  ')
        : chalk.gray('[not installed]');
      const event = chalk.cyan(t.event.padEnd(20));
      console.log(`  ${t.name.padEnd(38)} ${status} ${event} ${t.desc}`);
    }
    console.log(chalk.dim('\nRun: cto hooks install <name>'));
    return;
  }

  if (sub === 'install') {
    const templates = listTemplates();
    // --all flag installs every template
    if (opts?.all) {
      fs.mkdirSync(HOOKS_INSTALL_DIR, { recursive: true });
      for (const hook of templates) {
        const src = path.join(TEMPLATES_DIR, hook.file);
        const dst = path.join(HOOKS_INSTALL_DIR, hook.file);
        fs.copyFileSync(src, dst);
        fs.chmodSync(dst, 0o755);
        console.log(chalk.green(`✓ Installed: .claude/hooks/${hook.file}`));
      }
      console.log(chalk.bold(`\n${templates.length} hooks installed.`));
      console.log(chalk.dim('Run: cto hooks settings  to get your settings.json block'));
      return;
    }
    if (!name) { console.error(chalk.red('Usage: cto hooks install <name>  or  cto hooks install --all')); process.exit(1); }
    const hook = templates.find(t => t.name === name);
    if (!hook) {
      console.error(chalk.red(`Hook not found: ${name}`));
      console.error(chalk.dim(`Available: ${templates.map(t => t.name).join(', ')}`));
      process.exit(1);
    }
    const src = path.join(TEMPLATES_DIR, hook.file);
    const dst = path.join(HOOKS_INSTALL_DIR, hook.file);
    fs.mkdirSync(HOOKS_INSTALL_DIR, { recursive: true });
    fs.copyFileSync(src, dst);
    fs.chmodSync(dst, 0o755);
    console.log(chalk.green(`✓ Installed: .claude/hooks/${hook.file}`));
    _printSettingsHint(hook);
    return;
  }

  if (sub === 'remove') {
    if (!name) { console.error(chalk.red('Usage: cto hooks remove <name>')); process.exit(1); }
    const dst = path.join(HOOKS_INSTALL_DIR, `${name}.sh`);
    if (!fs.existsSync(dst)) {
      console.error(chalk.red(`Not installed: ${name}`));
      process.exit(1);
    }
    if (!opts?.yes) {
      const ans = await confirm(`Remove .claude/hooks/${name}.sh? [y/N] `);
      if (ans.trim().toLowerCase() !== 'y') { console.log('Cancelled.'); return; }
    }
    fs.unlinkSync(dst);
    console.log(chalk.green(`✓ Removed: .claude/hooks/${name}.sh`));
    return;
  }

  if (sub === 'status') {
    const templates = listTemplates();
    const installed = templates.filter(t => t.installed);
    if (installed.length === 0) {
      console.log('No hooks installed. Run: cto hooks install <name>');
      return;
    }
    console.log(chalk.bold('\nInstalled hooks:\n'));
    for (const t of installed) {
      const stat = fs.statSync(path.join(HOOKS_INSTALL_DIR, t.file));
      const age = Math.round((Date.now() - stat.mtimeMs) / 60000);
      console.log(`  ${chalk.green('✓')} ${t.name.padEnd(38)} ${chalk.cyan(t.event.padEnd(20))} modified ${age}m ago`);
    }
    return;
  }

  if (sub === 'settings') {
    const templates = listTemplates();
    const installed = templates.filter(t => t.installed);
    if (installed.length === 0) {
      console.log('No hooks installed. Run: cto hooks install --all  first.');
      return;
    }
    // Group by event type
    const byEvent = {};
    for (const hook of installed) {
      if (!byEvent[hook.event]) byEvent[hook.event] = [];
      byEvent[hook.event].push(hook);
    }
    // Build settings.json hooks block
    const hooksBlock = {};
    for (const [event, hooks] of Object.entries(byEvent)) {
      hooksBlock[event] = hooks.map(h => ({
        hooks: [{ type: 'command', command: `bash .claude/hooks/${h.file}` }],
      }));
    }
    const output = JSON.stringify({ hooks: hooksBlock }, null, 2);
    console.log(output);
    // Only print the hint when stdout is a TTY (not when piped to a file/tool)
    if (process.stdout.isTTY) {
      console.log(chalk.dim('\nMerge this into ~/.claude/settings.json'));
    }
    return;
  }

  console.error(chalk.red(`Unknown subcommand: ${sub}`));
  console.error('Usage: cto hooks [list|install|remove|status|settings]');
  process.exit(1);
}

function _printSettingsHint(hook) {
  const eventMap = {
    PreToolUse: 'PreToolUse',
    PostToolUse: 'PostToolUse',
    UserPromptSubmit: 'UserPromptSubmit',
    Stop: 'Stop',
    Notification: 'Notification',
  };
  const event = eventMap[hook.event] ?? hook.event;
  console.log(chalk.dim(`\nAdd to ~/.claude/settings.json:`));
  console.log(chalk.dim(`  "${event}": [{ "hooks": [{ "type": "command", "command": "bash .claude/hooks/${hook.file}" }] }]`));
}
