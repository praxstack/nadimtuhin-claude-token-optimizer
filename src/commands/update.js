import chalk from 'chalk';
import { createRequire } from 'node:module';
import { execSync, spawnSync } from 'node:child_process';

const { version: current } = createRequire(import.meta.url)('../../package.json');

function getLatestVersion() {
  try {
    const out = execSync('npm view claude-token-optimizer version', { encoding: 'utf8', timeout: 10000 });
    return out.trim();
  } catch {
    return null;
  }
}

function isGlobalInstall() {
  try {
    const out = execSync('npm list -g claude-token-optimizer --depth=0 2>/dev/null', { encoding: 'utf8' });
    return out.includes('claude-token-optimizer');
  } catch {
    return false;
  }
}

export async function updateCommand() {
  console.log('');
  console.log(chalk.bold('Checking for updates...'));
  console.log('');

  const latest = getLatestVersion();

  if (!latest) {
    console.log(chalk.red('✗ Could not reach npm registry. Check your internet connection.'));
    process.exit(1);
  }

  console.log(`  Current : ${chalk.dim(current)}`);
  console.log(`  Latest  : ${chalk.green(latest)}`);
  console.log('');

  if (current === latest) {
    console.log(chalk.green('✓ Already up to date.'));
    console.log('');
    return;
  }

  const global = isGlobalInstall();

  if (global) {
    console.log(chalk.blue(`Updating ${current} → ${latest} (global install)...`));
    console.log('');
    const result = spawnSync('npm', ['install', '-g', `claude-token-optimizer@${latest}`], {
      stdio: 'inherit',
      shell: false,
    });
    if (result.status !== 0) {
      console.log('');
      console.log(chalk.red('✗ Update failed. Try manually:'));
      console.log(`  npm install -g claude-token-optimizer@${latest}`);
      process.exit(1);
    }
    console.log('');
    console.log(chalk.green(`✓ Updated to ${latest}`));
  } else {
    console.log(chalk.yellow(`ℹ cto is not globally installed — cannot self-update.`));
    console.log('');
    console.log('Run one of:');
    console.log(`  ${chalk.cyan(`npm install -g claude-token-optimizer@${latest}`)}`);
    console.log(`  ${chalk.cyan(`curl -fsSL https://raw.githubusercontent.com/nadimtuhin/claude-token-optimizer/main/install.sh | bash`)}`);
  }
  console.log('');
}
