const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const stageDir = path.join(root, 'outputs', 'desktop-stage');
const finalDir = path.join(root, 'outputs', 'desktop');
const stageExe = path.join(stageDir, 'Controle-Financeiro-Mensal.exe');
const finalPortableExe = path.join(finalDir, 'Controle-Financeiro-Mensal.exe');
const finalInstallerExe = path.join(finalDir, 'Instalador-Controle-Financeiro-Mensal.exe');
const tmpUnpacked = path.join(stageDir, 'win-unpacked.tmp');
const unpacked = path.join(stageDir, 'win-unpacked');
const shouldPublishGithub =
  process.argv.includes('--publish-github') ||
  process.env.PUBLISH_GITHUB === '1' ||
  process.env.PUBLISH_GITHUB === 'true';
const githubOwner = process.env.GH_OWNER || process.env.GITHUB_OWNER || '';
const githubRepo = process.env.GH_REPO || process.env.GITHUB_REPO || '';
const hasGithubFeed = Boolean(githubOwner && githubRepo);

if (shouldPublishGithub && !hasGithubFeed) {
  throw new Error('Informe GH_OWNER e GH_REPO para publicar no GitHub Releases.');
}

if (shouldPublishGithub && !process.env.GH_TOKEN && !process.env.GITHUB_TOKEN) {
  throw new Error('Informe GH_TOKEN para publicar no GitHub Releases.');
}

function run(command, args) {
  execFileSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}

function runElectronBuilder(args) {
  run('npx', ['electron-builder', ...args]);
}

function getPublishConfigArgs(publishMode = 'never') {
  const args = ['--publish', publishMode];

  if (!hasGithubFeed) {
    return args;
  }

  return [
    ...args,
    '--config.publish.provider=github',
    `--config.publish.owner=${githubOwner}`,
    `--config.publish.repo=${githubRepo}`,
  ];
}

function writeUpdateConfig(resourcesDir) {
  if (!hasGithubFeed) return;

  const updateConfig = [
    'provider: github',
    `owner: ${githubOwner}`,
    `repo: ${githubRepo}`,
    'updaterCacheDirName: controle-financeiro-mensal-updater',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(resourcesDir, 'app-update.yml'), updateConfig);
}

function copyDirectory(source, destination) {
  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(source, destination, { recursive: true });
}

function preparePrepackagedApp(prepackagedDir) {
  const resourcesDir = path.join(prepackagedDir, 'resources');
  const appDir = path.join(resourcesDir, 'app');
  const electronExe = path.join(prepackagedDir, 'electron.exe');
  const productExe = path.join(prepackagedDir, 'Controle Financeiro Mensal.exe');

  fs.rmSync(appDir, { recursive: true, force: true });
  fs.mkdirSync(appDir, { recursive: true });

  copyDirectory(path.join(root, 'dist'), path.join(appDir, 'dist'));
  copyDirectory(path.join(root, 'electron'), path.join(appDir, 'electron'));
  writeUpdateConfig(resourcesDir);

  fs.writeFileSync(
    path.join(appDir, 'package.json'),
    `${JSON.stringify(
      {
        name: 'controle-financeiro-mensal',
        version: '1.0.0',
        main: 'electron/main.cjs',
      },
      null,
      2
    )}\n`
  );

  if (fs.existsSync(electronExe) && !fs.existsSync(productExe)) {
    fs.copyFileSync(electronExe, productExe);
  }
}

fs.rmSync(stageDir, { recursive: true, force: true });
fs.mkdirSync(finalDir, { recursive: true });
fs.rmSync(finalPortableExe, { force: true });
fs.rmSync(finalInstallerExe, { force: true });

run('npx', ['vite', 'build']);

let prepackagedDir;

try {
runElectronBuilder([
  '--win',
  'portable',
  ...getPublishConfigArgs('never'),
  '--config.directories.output=outputs/desktop-stage',
]);

  if (fs.existsSync(stageExe)) {
    fs.copyFileSync(stageExe, finalPortableExe);
  }
  prepackagedDir = unpacked;
} catch (error) {
  if (!fs.existsSync(tmpUnpacked)) {
    throw error;
  }

  preparePrepackagedApp(tmpUnpacked);
  prepackagedDir = tmpUnpacked;

  runElectronBuilder([
    '--win',
    'portable',
    ...getPublishConfigArgs('never'),
    '--prepackaged',
    'outputs/desktop-stage/win-unpacked.tmp',
    '--config.directories.output=outputs/desktop',
  ]);
}

if (prepackagedDir) {
  runElectronBuilder([
    '--win',
    'nsis',
    ...getPublishConfigArgs(shouldPublishGithub ? 'always' : 'never'),
    '--prepackaged',
    path.relative(root, prepackagedDir),
    '--config.directories.output=outputs/desktop',
  ]);
}

if (!fs.existsSync(finalPortableExe)) {
  throw new Error('O executavel portatil nao foi gerado.');
}

if (!fs.existsSync(finalInstallerExe)) {
  throw new Error('O instalador nao foi gerado.');
}

console.log(`\nExecutavel portatil criado em: ${path.relative(root, finalPortableExe)}`);
console.log(`Instalador criado em: ${path.relative(root, finalInstallerExe)}`);
