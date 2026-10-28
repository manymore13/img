import { createHash } from 'node:crypto';
import { readFile, writeFile, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { generateCatalog } from './generate-mado-catalog.mjs';

const defaultRoot = fileURLToPath(new URL('../mado/', import.meta.url));
const maxBytes = 5 * 1024 * 1024;
const digest = (data) => createHash('sha256').update(data).digest('hex');
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

export function qrMetadata(config, demo) {
  return { schemaVersion: 1, appid: config.appid, page: config.page, scene: demo.scene,
    env_version: config.env_version, check_path: config.env_version === 'release',
    width: config.width, auto_color: false, is_hyaline: false };
}

export function validateImage(bytes, mime) {
  mime = mime.split(';')[0].trim().toLowerCase();
  if (!bytes.length || bytes.length > maxBytes) throw new Error('图片字节大小无效');
  let width, height;
  if (mime === 'image/png' && bytes.length >= 33
      && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      && bytes.readUInt32BE(8) === 13 && bytes.toString('ascii', 12, 16) === 'IHDR') {
    width = bytes.readUInt32BE(16); height = bytes.readUInt32BE(20);
  } else if (mime === 'image/jpeg' && bytes[0] === 255 && bytes[1] === 216
      && bytes[bytes.length - 2] === 255 && bytes[bytes.length - 1] === 217) {
    let i = 2;
    while (i + 3 < bytes.length) {
      if (bytes[i++] !== 255) break;
      while (bytes[i] === 255) i++;
      const marker = bytes[i++];
      if (marker === 218 || marker === 217) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      if (i + 2 > bytes.length) break;
      const size = bytes.readUInt16BE(i);
      if (size < 2 || i + size > bytes.length) break;
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker) && size >= 8) {
        height = bytes.readUInt16BE(i + 3); width = bytes.readUInt16BE(i + 5); break;
      }
      i += size;
    }
  }
  if (!width || !height || width > 1280 || height > 1280) {
    throw new Error('响应不是受支持的 PNG/JPEG 图片或像素尺寸超限');
  }
  return { content_type: mime, image_width: width, image_height: height };
}

async function boundedBody(response) {
  if (Number(response.headers.get('content-length')) > maxBytes) throw new Error('响应过大');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('响应无内容');
  const chunks = []; let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) { await reader.cancel(); throw new Error('响应过大'); }
      chunks.push(Buffer.from(value));
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}

async function request(fetchImpl, url, options = {}) {
  try {
    return await fetchImpl(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(30000) });
  } catch { throw new Error('微信请求失败（网络、重定向或超时），凭据已隐藏'); }
}

const imageFilename = (mime) => ({ 'image/png': 'qrcode.png', 'image/jpeg': 'qrcode.jpg' })[mime];

async function writeChanged(filename, content, atomic = false) {
  const bytes = Buffer.from(content);
  try {
    if ((await readFile(filename)).equals(bytes)) return false;
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (atomic) {
    const temporary = path.join(path.dirname(filename), `.${path.basename(filename)}.tmp`);
    await writeFile(temporary, bytes);
    await rename(temporary, filename);
  } else await writeFile(filename, bytes);
  return true;
}

async function matchingFilename(directory, expected) {
  try {
    const metadata = JSON.parse(await readFile(path.join(directory, 'qrcode.json'), 'utf8'));
    if (!Object.entries(expected).every(([key, value]) => metadata[key] === value)) return false;
    const filename = imageFilename(metadata.content_type);
    if (!filename || (metadata.filename !== undefined && metadata.filename !== filename)) return false;
    const filepath = path.join(directory, filename);
    if ((await stat(filepath)).size > maxBytes) return false;
    const bytes = await readFile(filepath);
    const image = validateImage(bytes, metadata.content_type);
    return metadata.sha256 === digest(bytes)
      && image.image_width === metadata.image_width && image.image_height === metadata.image_height
      ? filename : false;
  } catch { return false; }
}

export async function matchingCode(directory, expected) {
  return !!(await matchingFilename(directory, expected));
}

const escapeCell = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/\|/g, '&#124;').replace(/[\r\n]/g, ' ');
const encoded = (dir) => encodeURIComponent(dir).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/** 每个 demo 的扫码状态：文件名表示可用，false 表示还没有码。 */
async function demoStatuses(root, catalog, config) {
  const statuses = new Map();
  for (const demo of catalog.demos) {
    statuses.set(demo.dir, demo.ready
      ? await matchingFilename(path.join(root, demo.dir), qrMetadata(config, demo))
      : false);
  }
  return statuses;
}

/** 缺哪些文件，直接写在页面上，省得去微信里猜为什么打不开。 */
async function missingFiles(root, demo) {
  const missing = [];
  for (const name of ['page.md', 'style.css']) {
    try { await stat(path.join(root, demo.dir, name)); } catch { missing.push(name); }
  }
  return missing;
}

const escapeHtml = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const SCAN_PAGE_CSS = `:root { color-scheme: light; }
* { box-sizing: border-box; }
body { margin: 0; background: #f3eee2; color: #1f2b24;
  font: 16px/1.7 -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; }
header, main, footer { max-width: 1100px; margin: 0 auto; }
header { padding: 40px 24px 0; }
h1 { margin: 0 0 10px; font-size: 28px; letter-spacing: 0.02em; }
.lede { margin: 0; color: #44524a; }
.meta { margin: 14px 0 0; font-size: 13px; color: #6d786e; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.92em;
  background: rgba(31, 43, 36, 0.07); padding: 1px 5px; border-radius: 4px;
  overflow-wrap: anywhere; }
main { padding: 24px; display: grid; gap: 18px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
.card { display: flex; flex-direction: column; gap: 10px; padding: 18px;
  background: #fbf8f0; border: 1px solid rgba(31, 43, 36, 0.12); border-radius: 14px; }
.card h2 { margin: 0; font-size: 17px; line-height: 1.4; }
.qr { width: 100%; max-width: 220px; aspect-ratio: 1 / 1; background: #fff;
  border-radius: 10px; image-rendering: pixelated; }
.placeholder { width: 100%; max-width: 220px; aspect-ratio: 1 / 1; display: grid;
  place-items: center; padding: 12px; text-align: center; font-size: 13px; color: #6d786e;
  border: 1px dashed rgba(31, 43, 36, 0.3); border-radius: 10px; }
.scene { font-size: 12px; color: #6d786e; word-break: break-all; }
.links { display: flex; flex-wrap: wrap; gap: 10px; font-size: 13px; }
.links a { color: #a8452c; text-decoration: none; border-bottom: 1px solid rgba(168, 69, 44, 0.3); }
.links a + a { color: #6d786e; border-bottom-color: rgba(109, 120, 110, 0.4); }
.warn { color: #a8452c; }
footer { padding: 0 24px 56px; font-size: 13px; color: #44524a; }
footer h2 { margin: 24px 0 8px; font-size: 15px; }
footer ol { margin: 0; padding-left: 22px; }
@media print { body { background: #fff; } .card { break-inside: avoid; } }`;

/**
 * 扫码目录页：打开一个网址就能看到全部 demo 的小程序码。
 * 内容完全由清单推导，不含时间戳，重复生成不产生噪声。
 */
export function renderScanPage(catalog, config, rows) {
  const ready = catalog.demos.filter((demo) => demo.ready).length;
  const cards = rows.map(({ demo, code, missing }) => {
    const base = `./${encoded(demo.dir)}/`;
    const figure = demo.ready && code
      ? `<img class="qr" src="${base}${code}" alt="${escapeHtml(demo.label)} 的小程序码" loading="lazy">`
      : `<div class="placeholder">${demo.ready
        ? '待生成小程序码<br>配置凭据后自动补齐'
        : `素材未就绪<br>缺 ${missing.map(escapeHtml).join('、')}`}</div>`;
    const links = [`<a href="${base}page.md">page.md</a>`];
    if (demo.ready) links.push(`<a href="${base}style.css">style.css</a>`);
    return [
      '<article class="card">',
      figure,
      `<h2>${escapeHtml(demo.label)}</h2>`,
      `<p class="scene">${escapeHtml(demo.dir)} · scene ${demo.scene}</p>`,
      `<div class="links">${links.join('')}</div>`,
      '</article>',
    ].join('\n');
  });
  return [
    '<!doctype html>',
    '<html lang="zh-CN">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<link rel="icon" href="data:,">',
    '<title>Mado 扫码目录</title>',
    `<style>${SCAN_PAGE_CSS}</style>`,
    '</head>',
    '<body>',
    '<header>',
    '<h1>Mado 扫码目录</h1>',
    '<p class="lede">推送到 <code>main</code> 之后自动重算文件版本号，并给每个 demo 补生成官方小程序码。用微信扫卡片里的码，直接进对应页面。</p>',
    `<p class="meta">目标 <code>${escapeHtml(config.appid)}</code> · <code>${escapeHtml(config.env_version)}</code> · <code>${escapeHtml(config.page)}</code> · 共 ${catalog.demos.length} 个 demo（${ready} 个可加载） · 清单 revision <code title="${catalog.revision}">${catalog.revision.slice(0, 12)}</code></p>`,
    '</header>',
    '<main>',
    ...cards,
    '</main>',
    '<footer>',
    '<h2>加一个 demo</h2>',
    '<ol>',
    '<li>新建 <code>mado/&lt;目录名&gt;/</code>，放入 <code>page.md</code> 与 <code>style.css</code>，图片指南等相对引用放在同目录。</li>',
    '<li>提交并推送到 <code>main</code>。清单 revision、每个文件的 SHA-256 版本号、小程序码都由 Actions 生成并回填。</li>',
    '<li>等 Pages 部署完成，回到这一页扫码即可。改了内容只会更新版本号，<code>scene</code> 与码不变，不用重新扫码。</li>',
    '</ol>',
    '<p>生码需要仓库 Secrets 里有 <code>MADO_WECHAT_SECRET</code>（或临时用 <code>MADO_WECHAT_ACCESS_TOKEN</code>）；缺凭据时本页显示「待生成」，内容照常发布，补上凭据后自动补齐。开发版／体验版的码要求扫码者是该小程序成员。</p>',
    '</footer>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

export async function updateReadmes(root, catalog, config, statuses) {
  const changedPaths = [];
  const state = statuses || await demoStatuses(root, catalog, config);
  for (const [filename, prefix] of [[path.join(root, '..', 'README.md'), 'mado/'], [path.join(root, 'README.md'), '']]) {
    const content = await readFile(filename, 'utf8');
    const rows = catalog.demos.map((demo) => {
      const base = `${prefix}${encoded(demo.dir)}/`;
      const status = !demo.ready ? '素材未就绪' : state.get(demo.dir)
        ? `<img src="${base}${state.get(demo.dir)}" width="160" alt="官方小程序码">`
        : '待授权生成';
      return `| [${escapeCell(demo.label)}](${base}) | ${escapeCell(demo.dir)} | ${demo.scene} | ${status} |`;
    });
    const block = ['<!-- MADO-DEMOS:START -->', '## Mado demo 扫码目录', '',
      `当前目标：\`${config.appid}\` · \`${config.env_version}\` · \`${config.page}\`。开发版／体验版需要对应微信成员权限。`, '',
      ...(config.site ? [`扫码页（每次发布自动重写）：<${config.site}>`, ''] : []),
      '| Demo | 目录 | scene | 小程序码 |', '| --- | --- | --- | --- |', ...rows, '<!-- MADO-DEMOS:END -->'].join('\n');
    const pattern = /<!-- MADO-DEMOS:START -->[\s\S]*?<!-- MADO-DEMOS:END -->/;
    if (await writeChanged(filename, pattern.test(content) ? content.replace(pattern, () => block) : `${content.trimEnd()}\n\n${block}\n`)) changedPaths.push(filename);
  }
  return changedPaths;
}

export async function generateQrcodes({ root = defaultRoot, env = {}, fetchImpl = globalThis.fetch } = {}) {
  const config = JSON.parse(await readFile(path.join(root, 'qrcode.config.json'), 'utf8'));
  config.appid = env.MADO_WECHAT_APPID || config.appid;
  config.env_version = env.MADO_WECHAT_ENV_VERSION || config.env_version;
  if (!/^wx[a-f0-9]{16}$/.test(config.appid) || config.page !== 'pages/index/index'
      || !['develop', 'trial', 'release'].includes(config.env_version)
      || !Number.isInteger(config.width) || config.width < 280 || config.width > 1280) throw new Error('扫码公开配置无效');
  // site 只是给人点的扫码页地址；写错不影响生码，直接忽略。
  if (config.site !== undefined) {
    if (typeof config.site !== 'string' || !/^https:\/\/[^\s]+$/.test(config.site)) delete config.site;
    else if (!config.site.endsWith('/')) config.site += '/';
  }
  const catalog = await generateCatalog(root);
  const generatedFiles = []; const pending = []; const errors = []; const changedPaths = [];
  let token = env.MADO_WECHAT_ACCESS_TOKEN;
  const credentials = !!(token || env.MADO_WECHAT_SECRET);
  let tokenFailed = false;
  for (const demo of catalog.demos.filter((item) => item.ready)) {
    const directory = path.join(root, demo.dir);
    const expected = qrMetadata(config, demo);
    if (await matchingCode(directory, expected)) continue;
    pending.push(demo.dir);
    if (!credentials || tokenFailed) continue;
    try {
      if (!token) {
        const url = new URL('https://api.weixin.qq.com/cgi-bin/token');
        url.search = new URLSearchParams({ grant_type: 'client_credential', appid: config.appid, secret: env.MADO_WECHAT_SECRET });
        try {
          const response = await request(fetchImpl, url);
          const data = JSON.parse((await boundedBody(response)).toString('utf8'));
          if (!response.ok || typeof data.access_token !== 'string' || !data.access_token || data.errcode) throw new Error();
          token = data.access_token;
        } catch { tokenFailed = true; throw new Error('获取微信 token 失败，凭据及响应已隐藏'); }
      }
      const url = new URL('https://api.weixin.qq.com/wxa/getwxacodeunlimit');
      url.searchParams.set('access_token', token);
      const { schemaVersion, appid, ...payload } = expected;
      const response = await request(fetchImpl, url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const bytes = await boundedBody(response);
      if (!response.ok) throw new Error(`微信 HTTP 错误 ${response.status}`);
      const mime = response.headers.get('content-type') || '';
      if (mime.toLowerCase().includes('json') || /^\s*\{/.test(bytes.subarray(0, 32).toString('utf8'))) {
        let code;
        try { code = JSON.parse(bytes.toString('utf8')).errcode; } catch { /* 不输出原始响应。 */ }
        throw new Error(`微信生码返回 JSON 错误${Number.isInteger(code) ? `（${code}）` : ''}`);
      }
      const image = validateImage(bytes, mime);
      const filename = imageFilename(image.content_type);
      const metadata = { ...expected, ...image, filename, sha256: digest(bytes) };
      // 响应全部校验通过后才替换；保留其他扩展名的旧码。
      const imagePath = path.join(directory, filename);
      const metadataPath = path.join(directory, 'qrcode.json');
      if (await writeChanged(imagePath, bytes, true)) changedPaths.push(imagePath);
      if (await writeChanged(metadataPath, json(metadata), true)) changedPaths.push(metadataPath);
      generatedFiles.push(imagePath, metadataPath);
      pending.pop();
    } catch (error) { errors.push({ dir: demo.dir, message: error.message }); }
  }
  const catalogPath = path.join(root, 'demos.json');
  if (await writeChanged(catalogPath, json(catalog))) changedPaths.push(catalogPath);
  const statuses = await demoStatuses(root, catalog, config);
  changedPaths.push(...await updateReadmes(root, catalog, config, statuses));

  // 扫码目录页：内容和清单同源，方便在电脑上打开一次、逐个扫码。
  const rows = [];
  for (const demo of catalog.demos) {
    rows.push({ demo, code: statuses.get(demo.dir) || null, missing: demo.ready ? [] : await missingFiles(root, demo) });
  }
  const scanPath = path.join(root, 'index.html');
  if (await writeChanged(scanPath, renderScanPage(catalog, config, rows))) changedPaths.push(scanPath);
  return { generatedFiles, changedPaths, pending, errors, credentials };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--offline')) throw new Error('用法：node scripts/generate-mado-qrcodes.mjs [--offline]');
  const result = await generateQrcodes({ env: args.includes('--offline') ? {} : process.env });
  console.log(`生成 ${result.generatedFiles.length / 2} 个官方码；待生成：${result.pending.join('、') || '无'}`);
  if (!result.credentials) console.log('未配置凭据，README 已标记待授权生成。');
  for (const error of result.errors) console.error(`${error.dir}：${error.message}`);
  if (result.errors.length) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(() => { console.error('生成失败，请检查公开配置和文件权限（敏感详情已隐藏）'); process.exitCode = 1; });
}
