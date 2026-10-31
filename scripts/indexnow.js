/**
 * Ping IndexNow after a Pages deploy.
 *
 * The key file is public/<key>.txt. The first deploy that adds the key submits
 * every sitemap URL. Later deploys submit URLs whose lastmod changed.
 *
 *   node scripts/indexnow.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const HOST = 'derivativecalculatorai.com';
const SITEMAP = path.join(ROOT, 'public', 'sitemap.xml');
const ENDPOINT = 'https://api.indexnow.org/indexnow';

function parseSitemapEntries(xml) {
  if (!xml) return [];
  const entries = [];
  const blocks = String(xml).split(/<url>/).slice(1);
  for (const block of blocks) {
    const loc = (block.match(/<loc>([^<]*)<\/loc>/) || [])[1] || '';
    const lastmod = (block.match(/<lastmod>([^<]*)<\/lastmod>/) || [])[1] || '';
    if (loc) entries.push({ loc, lastmod });
  }
  return entries;
}

function selectIndexNowUrls({ currentXml, previousXml, keyIsNew }) {
  const current = parseSitemapEntries(currentXml);
  if (keyIsNew || !previousXml) return current.map((entry) => entry.loc);
  const previous = new Map(parseSitemapEntries(previousXml).map((entry) => [entry.loc, entry.lastmod]));
  return current.filter((entry) => previous.get(entry.loc) !== entry.lastmod).map((entry) => entry.loc);
}

function findKeyFile() {
  const matches = fs.readdirSync(path.join(ROOT, 'public')).filter((name) => /^[a-f0-9]{8,128}\.txt$/.test(name));
  if (matches.length !== 1) {
    throw new Error(`Expected one IndexNow key file in public/, found ${matches.length}.`);
  }
  const key = matches[0].replace(/\.txt$/, '');
  const body = fs.readFileSync(path.join(ROOT, 'public', matches[0]), 'utf8').trim();
  if (body !== key) throw new Error('IndexNow key file contents do not match the file name.');
  return key;
}

function gitShow(rev) {
  try {
    return execSync(`git show ${rev}`, { cwd: ROOT, encoding: 'utf8' });
  } catch {
    return '';
  }
}

async function postUrls(key, urlList) {
  const payload = {
    host: HOST,
    key,
    keyLocation: `https://${HOST}/${key}.txt`,
    urlList,
  };
  let lastStatus = 0;
  let lastBody = '';
  for (let attempt = 1; attempt <= 8; attempt++) {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
    lastStatus = response.status;
    lastBody = await response.text();
    if (response.status === 200 || response.status === 202) {
      return { status: response.status, body: lastBody, attempt };
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 4000));
  }
  return { status: lastStatus, body: lastBody, attempt: 8 };
}

async function main() {
  const key = findKeyFile();
  const currentXml = fs.readFileSync(SITEMAP, 'utf8');
  const previousXml = gitShow('HEAD~1:public/sitemap.xml');
  const keyIsNew = !gitShow(`HEAD~1:public/${key}.txt`);
  const urls = selectIndexNowUrls({ currentXml, previousXml, keyIsNew });
  if (urls.length === 0) {
    console.log('IndexNow: no changed sitemap URLs.');
    return;
  }
  console.log(`IndexNow: submitting ${urls.length} URL(s). keyIsNew=${keyIsNew}`);
  const result = await postUrls(key, urls);
  console.log(`IndexNow response ${result.status} on attempt ${result.attempt}: ${result.body.slice(0, 300)}`);
  if (result.status !== 200 && result.status !== 202) {
    process.exitCode = 1;
  }
}

module.exports = { parseSitemapEntries, selectIndexNowUrls, findKeyFile };

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
