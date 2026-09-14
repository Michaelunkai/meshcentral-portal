'use strict';

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const repository = __dirname;
const urlFile = path.join(repository, '..', 'meshcentral-data', 'public-url.txt');
const indexFile = path.join(repository, 'index.html');
const publicUrl = fs.readFileSync(urlFile, 'utf8').trim().replace(/\/$/, '');

if (!/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i.test(publicUrl)) {
    throw new Error('Invalid public tunnel URL');
}

const html = '<!doctype html>\n<html><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=' + publicUrl + '/"></head><body><p>Opening MeshCentral...</p><script>location.replace(' + JSON.stringify(publicUrl + '/') + ');</script></body></html>\n';
if (!fs.existsSync(indexFile) || fs.readFileSync(indexFile, 'utf8') !== html) fs.writeFileSync(indexFile, html, 'utf8');

if (process.argv.includes('--publish')) {
    const run = (args) => childProcess.execFileSync('git', args, { cwd: repository, stdio: 'inherit' });
    run(['add', 'index.html']);
    let changed = true;
    try { childProcess.execFileSync('git', ['diff', '--cached', '--quiet'], { cwd: repository, stdio: 'ignore' }); changed = false; } catch (error) { }
    if (changed) {
        run(['commit', '-m', 'Update public MeshCentral entry point']);
        run(['push', 'origin', 'main']);
    }
}

console.log(publicUrl);
