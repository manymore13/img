import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const defaultRoot = fileURLToPath(new URL('../mado/', import.meta.url));
const dependencies = new Set(['node_modules', 'bower_components', 'jspm_packages', 'vendor']);
const collator = new Intl.Collator('en', { usage: 'sort', sensitivity: 'variant', numeric: false });
const compare = (a, b) => collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);
const hash = (content) => createHash('sha256').update(content).digest('hex');
const included = (entry) => !entry.name.startsWith('.') && !dependencies.has(entry.name)
  && !['README.md', 'qrcode.png', 'qrcode.jpg', 'qrcode.json'].includes(entry.name);
export const demoScene = (dir) => `d${hash(Buffer.from(dir, 'utf8')).slice(0, 20)}`;

/**
 * 只读取 Front Matter 的单行字符串，不执行 YAML 标签或表达式。
 * label/title 用于显示名；minEngine/capabilities 用于客户端版本门禁。
 */
function pageFields(content) {
  const frontmatter = content.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) return new Map();
  const fields = new Map();
  for (const line of frontmatter[1].split(/\r?\n/)) {
    const match = line.match(/^(label|title|minEngine|capabilities|featured):\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if (value.startsWith('"')) {
      const quoted = value.match(/^"(?:\\.|[^"\\])*"/);
      if (!quoted || !/^(?:\s+#.*)?$/.test(value.slice(quoted[0].length))) continue;
      try { value = JSON.parse(quoted[0]); } catch { continue; }
    } else if (value.startsWith("'")) {
      const quoted = value.match(/^'((?:''|[^'])*)'(?:\s+#.*)?$/);
      if (!quoted) continue;
      value = quoted[1].replace(/''/g, "'");
    } else {
      value = value.replace(/\s+#.*$/, '').trim();
      if (/^(?:[>|\[\]{&*!]|null$|~$)/i.test(value)) continue;
    }
    if (value.trim()) fields.set(match[1], value.trim());
  }
  return fields;
}

export const defaultMinEngine = '0.1';
const engineVersion = /^\d+\.\d+(?:\.\d+)?$/;
// 能力名只描述平台契约，禁止伪装成可执行协议。
const capabilityName = /^[a-z][a-z0-9-]*:[a-z0-9-]+@\d+$/;
const capabilityBlocked = /^(?:javascript|data|vbscript|blob):/i;

/** 非法或缺失的门槛回落到最宽松值，避免旧页面因手误被误判为不兼容。 */
function pageGate(fields) {
  const declared = fields.get('minEngine');
  const minEngine = declared && engineVersion.test(declared) ? declared : defaultMinEngine;
  const capabilities = (fields.get('capabilities') || '').split(/[,\s]+/).filter(Boolean);
  const featured = fields.get('featured') === 'true';
  return { ...(featured ? { featured: true } : {}), minEngine, capabilities: [...new Set(capabilities.filter((name) => capabilityName.test(name) && !capabilityBlocked.test(name)))].sort(compare) };
}

export async function generateCatalog(root = defaultRoot) {
  const demos = [];
  const files = new Map();
  const directories = [];
  const entries = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => included(entry) && entry.isDirectory())
    .sort((a, b) => compare(a.name, b.name));

  async function scan(relative) {
    directories.push(relative);
    const children = (await readdir(path.join(root, relative), { withFileTypes: true }))
      .filter(included).sort((a, b) => compare(a.name, b.name));
    for (const child of children) {
      const key = `${relative}/${child.name}`;
      if (child.isDirectory()) await scan(key);
      else if (child.isFile()) files.set(key, await readFile(path.join(root, key)));
      // Dirent 的符号链接与其他特殊文件均跳过，不跟随链接。
    }
  }

  for (const entry of entries) {
    await scan(entry.name);
    const page = files.get(`${entry.name}/page.md`);
    const fields = page ? pageFields(page.toString('utf8')) : new Map();
    demos.push({
      dir: entry.name,
      scene: demoScene(entry.name),
      label: fields.get('label') || fields.get('title') || entry.name,
      ready: files.has(`${entry.name}/page.md`) && files.has(`${entry.name}/style.css`),
      ...pageGate(fields),
    });
  }
  const versions = Object.fromEntries([...files.keys()].sort(compare)
    .map((key) => [key, hash(files.get(key))]));
  // 目录名也参与摘要，因此空目录的新增、删除和重命名同样改变 revision。
  const revision = hash(JSON.stringify({ dirs: directories.sort(compare), versions }));
  return { schemaVersion: 1, revision, demos, versions };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--root' || !args[1])) {
    throw new Error('用法：node scripts/generate-mado-catalog.mjs [--root <mado目录>]');
  }
  const root = args.length ? path.resolve(args[1]) : defaultRoot;
  const catalog = await generateCatalog(root);
  await writeFile(path.join(root, 'demos.json'), `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`已生成 demos.json：${catalog.demos.length} 个目录，revision=${catalog.revision}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
