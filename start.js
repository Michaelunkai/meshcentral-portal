'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = __dirname;
const dataPath = process.env.MESH_DATA_PATH || '/data/meshcentral-data';
const filesPath = process.env.MESH_FILES_PATH || '/data/meshcentral-files';
const port = Number(process.env.PORT || 10000);
const publicUrl = process.env.MESH_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '';
const publicHost = (() => {
  try { return new URL(publicUrl).hostname; } catch (_) { return publicUrl.replace(/^https?:\/\//, '').split('/')[0]; }
})();
const postgresUrl = process.env.MESH_POSTGRES_URL || '';

if (!publicHost) {
  console.error('MESH_PUBLIC_URL or RENDER_EXTERNAL_URL is required.');
  process.exit(2);
}

if (postgresUrl) {
  try {
    const parsedPostgresUrl = new URL(postgresUrl);
    if (parsedPostgresUrl.protocol !== 'postgres:' && parsedPostgresUrl.protocol !== 'postgresql:') {
      throw new Error('unsupported protocol');
    }
  } catch (_) {
    console.error('MESH_POSTGRES_URL must be a valid PostgreSQL connection URL.');
    process.exit(2);
  }
}

fs.mkdirSync(dataPath, { recursive: true });
fs.mkdirSync(filesPath, { recursive: true });

const config = {
  settings: {
    cert: publicHost,
    WANonly: true,
    port,
    portbind: '0.0.0.0',
    aliasPort: 443,
    agentAliasDNS: publicHost,
    agentAliasPort: 443,
    sessionKey: process.env.MESH_SESSION_KEY || crypto.randomBytes(32).toString('hex'),
    minify: true,
    datapath: dataPath,
    filespath: filesPath
  },
  domains: {
    '': {
      title: process.env.MESH_TITLE || 'MeshCentral Global',
      certurl: publicUrl,
      newAccounts: process.env.MESH_NEW_ACCOUNTS === 'true',
      userNameIsEmail: false
    }
  }
};

// MeshCentral supports PostgreSQL through the settings object. Keep this
// optional so the public repository remains deployable without a database;
// when supplied as a private host environment variable, account, mesh, and
// node state survive web-service filesystem replacement.
if (postgresUrl) config.settings.postgres = postgresUrl;

fs.writeFileSync(path.join(dataPath, 'config.json'), JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });

const meshcentral = path.join(root, 'node_modules', 'meshcentral', 'meshcentral.js');
const common = ['--datapath', dataPath];
const adminUser = process.env.MESH_ADMIN_USER;
const adminPassword = process.env.MESH_ADMIN_PASSWORD;

if (adminUser && adminPassword && !fs.existsSync(path.join(dataPath, '.admin-initialized'))) {
  const setup = (args) => spawnSync(process.execPath, [meshcentral, ...common, ...args], { cwd: root, stdio: 'ignore' });
  setup(['--createaccount', adminUser, '--pass', adminPassword, '--email', process.env.MESH_ADMIN_EMAIL || 'admin@localhost']);
  setup(['--adminaccount', adminUser]);
  fs.writeFileSync(path.join(dataPath, '.admin-initialized'), new Date().toISOString() + '\n', { mode: 0o600 });
}

const args = [
  meshcentral,
  ...common,
  '--port', String(port),
  '--portbind', '0.0.0.0',
  '--wanonly',
  '--tlsoffload',
  '--exactports'
];

const child = require('child_process').spawn(process.execPath, args, { cwd: root, stdio: 'inherit' });
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));

