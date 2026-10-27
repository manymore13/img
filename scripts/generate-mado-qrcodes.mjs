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

export async function updateReadmes(root, catalog, config) {
  const statuses = new Map();
  const changedPaths = [];
  for (const demo of catalog.demos) statuses.set(demo.dir, demo.ready && await matchingFilename(path.join(root, demo.dir), qrMetadata(config, demo)));
  for (const [filename, prefix] of [[path.join(root, '..', 'README.md'), 'mado/'], [path.join(root, 'README.md'), '']]) {
    const content = await readFile(filename, 'utf8');
    const rows = catalog.demos.map((demo) => {
      const base = `${prefix}${encoded(demo.dir)}/`;
      const status = !demo.ready ? '素材未就绪' : statuses.get(demo.dir)
        ? `<img src="${base}${statuses.get(demo.dir)}" width="160" alt="官方小程序码">`
        : '待授权生成';
      return `| [${escapeCell(demo.label)}](${base}) | ${escapeCell(demo.dir)} | ${demo.scene} | ${status} |`;
    });
    const block = ['<!-- MADO-DEMOS:START -->', '## Mado demo 扫码目录', '',
      `当前目标：\`${config.appid}\` · \`${config.env_version}\` · \`${config.page}\`。开发版／体验版需要对应微信成员权限。`, '',
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
  changedPaths.push(...await updateReadmes(root, catalog, config));
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
