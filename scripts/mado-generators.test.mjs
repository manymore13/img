import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { generateCatalog, demoScene } from './generate-mado-catalog.mjs';
import { generateQrcodes, matchingCode, qrMetadata, validateImage } from './generate-mado-qrcodes.mjs';

const config = { appid: 'wxf872813f65e641bb', page: 'pages/index/index', env_version: 'develop', width: 430 };
// 仅测试图片容器验证的固定 PNG fixture，不作为 demo 小程序码保存。
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64');
const jpeg = Buffer.from([255,216,255,192,0,8,8,0,1,0,1,1,255,217]);
async function fixture(t) {
  const base = await mkdtemp(path.join(tmpdir(), 'mado-test-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const root = path.join(base, 'mado');
  await mkdir(path.join(root, '中文 空格'), { recursive: true });
  await mkdir(path.join(root, 'not-ready'));
  await writeFile(path.join(base, 'README.md'), '# 原根说明\n');
  await writeFile(path.join(root, 'README.md'), '# 原资源说明\n');
  await writeFile(path.join(root, 'qrcode.config.json'), JSON.stringify(config));
  await writeFile(path.join(root, '中文 空格/page.md'), '---\nlabel: 测试 | 展示\n---\n正文');
  await writeFile(path.join(root, '中文 空格/style.css'), 'page {}');
  return root;
}
const noNetwork = () => { throw new Error('测试禁止访问网络'); };
const imageResponse = () => new Response(png, { headers: { 'content-type': 'image/png' } });

test('中文目录 scene 按 UTF8 稳定且不依赖显示名', async (t) => {
  const root = await fixture(t);
  const expected = `d${createHash('sha256').update(Buffer.from('中文 空格', 'utf8')).digest('hex').slice(0, 20)}`;
  assert.equal(demoScene('中文 空格'), expected);
  const first = await generateCatalog(root);
  await writeFile(path.join(root, '中文 空格/page.md'), '改名');
  assert.equal((await generateCatalog(root)).demos.find((d) => d.dir === '中文 空格').scene, expected);
  assert.match(expected, /^d[a-f0-9]{20}$/);
  assert.notEqual(first.revision, (await generateCatalog(root)).revision);
});

test('无凭据不造图；README保留说明、列所有demo且重复运行幂等', async (t) => {
  const root = await fixture(t);
  const first = await generateQrcodes({ root, fetchImpl: noNetwork });
  assert.deepEqual(first.pending, ['中文 空格']);
  assert.equal(first.generatedFiles.length, 0);
  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  assert.match(readme, /原资源说明/);
  assert.match(readme, /待授权生成/);
  assert.match(readme, /素材未就绪/);
  assert.match(readme, /测试 &#124; 展示/);
  assert.doesNotMatch(readme, /<img/);
  const catalog = await readFile(path.join(root, 'demos.json'), 'utf8');
  assert.deepEqual(first.changedPaths, [path.join(root, 'demos.json'), path.join(root, '..', 'README.md'), path.join(root, 'README.md')]);
  const second = await generateQrcodes({ root, fetchImpl: noNetwork });
  assert.deepEqual(second.changedPaths, []);
  assert.equal(await readFile(path.join(root, 'README.md'), 'utf8'), readme);
  assert.equal(await readFile(path.join(root, 'demos.json'), 'utf8'), catalog);
  assert.deepEqual((await readdir(path.join(root, '中文 空格'))).sort(), ['page.md', 'style.css']);
});

test('token与生码请求参数、ready过滤、元数据匹配跳过与失效', async (t) => {
  const root = await fixture(t);
  let calls = 0;
  const fetchImpl = async (url, options) => {
    calls++;
    if (url.pathname === '/cgi-bin/token') {
      assert.equal(url.searchParams.get('appid'), config.appid);
      assert.equal(url.searchParams.get('secret'), '测试凭据');
      return Response.json({ access_token: '测试token' });
    }
    assert.equal(url.pathname, '/wxa/getwxacodeunlimit');
    assert.equal(url.searchParams.get('access_token'), '测试token');
    const body = JSON.parse(options.body);
    assert.equal(body.page, config.page);
    assert.equal(body.scene, demoScene('中文 空格'));
    assert.equal(body.env_version, 'develop');
    assert.equal(body.check_path, false);
    assert.equal(body.appid, undefined);
    return imageResponse();
  };
  const result = await generateQrcodes({ root, env: { MADO_WECHAT_SECRET: '测试凭据' }, fetchImpl });
  assert.equal(calls, 2);
  assert.equal(result.generatedFiles.length, 2);
  assert.equal(result.errors.length, 0);
  const demo = (await generateCatalog(root)).demos.find((d) => d.ready);
  const expected = qrMetadata(config, demo);
  const directory = path.join(root, demo.dir);
  assert.equal(await matchingCode(directory, expected), true);
  for (const changed of [{ appid: 'wx0000000000000000' }, { scene: 'd0' }, { page: 'pages/other/index' }, { env_version: 'release' }, { width: 500 }, { check_path: true }]) {
    assert.equal(await matchingCode(directory, { ...expected, ...changed }), false);
  }
  await generateQrcodes({ root, env: { MADO_WECHAT_ACCESS_TOKEN: '测试token' }, fetchImpl: noNetwork });
  assert.match(await readFile(path.join(root, 'README.md'), 'utf8'), /<img/);
  const metadataPath = path.join(directory, 'qrcode.json');
  const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
  await writeFile(metadataPath, JSON.stringify({ ...metadata, sha256: '损坏' }));
  assert.equal(await matchingCode(directory, expected), false);
});

test('微信JSON错误及伪装响应不覆盖旧码或元数据，不泄露响应', async (t) => {
  const root = await fixture(t);
  await generateQrcodes({ root, env: { MADO_WECHAT_ACCESS_TOKEN: '测试token' }, fetchImpl: imageResponse });
  const directory = path.join(root, '中文 空格');
  const oldImage = await readFile(path.join(directory, 'qrcode.png'));
  const oldMetadata = await readFile(path.join(directory, 'qrcode.json'));
  for (const response of [() => Response.json({ errcode: 40001, errmsg: 'secret-token' }),
    () => new Response('{"errcode":40001}', { headers: { 'content-type': 'image/png' } }),
    () => new Response(png, { headers: { 'content-type': 'text/plain' } })]) {
    const result = await generateQrcodes({ root, env: { MADO_WECHAT_ACCESS_TOKEN: '测试token', MADO_WECHAT_ENV_VERSION: 'trial' }, fetchImpl: response });
    assert.equal(result.errors.length, 1);
    assert.doesNotMatch(JSON.stringify(result), /secret-token/);
    assert.deepEqual(await readFile(path.join(directory, 'qrcode.png')), oldImage);
    assert.deepEqual(await readFile(path.join(directory, 'qrcode.json')), oldMetadata);
    assert.match(await readFile(path.join(root, 'README.md'), 'utf8'), /待授权生成/);
  }
});

test('README和码产物不改变revision；清单重复生成相同', async (t) => {
  const root = await fixture(t);
  const first = await generateCatalog(root);
  await generateQrcodes({ root, env: { MADO_WECHAT_ACCESS_TOKEN: '测试token' }, fetchImpl: imageResponse });
  await writeFile(path.join(root, '中文 空格/README.md'), '生成说明');
  assert.deepEqual(await generateCatalog(root), first);
  assert.deepEqual(await generateCatalog(root), await generateCatalog(root));
  assert.equal(qrMetadata({ ...config, env_version: 'release' }, first.demos[0]).check_path, true);
});

test('通用 ACCESS_TOKEN 不作为微信凭据且不请求网络', async (t) => {
  const root = await fixture(t);
  let calls = 0;
  const result = await generateQrcodes({ root, env: { ACCESS_TOKEN: '其他服务token' }, fetchImpl: () => { calls++; return imageResponse(); } });
  assert.equal(calls, 0);
  assert.equal(result.credentials, false);
  assert.deepEqual(result.generatedFiles, []);
  assert.deepEqual(result.pending, ['中文 空格']);
  assert.match(await readFile(path.join(root, 'README.md'), 'utf8'), /待授权生成/);
});

test('JPEG按jpg持久化、两份README引用实际路径、复用且保留旧PNG', async (t) => {
  const root = await fixture(t);
  const before = await generateCatalog(root);
  await generateQrcodes({ root, env: { MADO_WECHAT_ACCESS_TOKEN: '测试token' }, fetchImpl: imageResponse });
  const directory = path.join(root, '中文 空格');
  const imagePath = path.join(directory, 'qrcode.jpg');
  const metadataPath = path.join(directory, 'qrcode.json');
  const result = await generateQrcodes({ root,
    env: { MADO_WECHAT_ACCESS_TOKEN: '测试token', MADO_WECHAT_ENV_VERSION: 'trial' },
    fetchImpl: () => new Response(jpeg, { headers: { 'content-type': 'image/jpeg; charset=binary' } }) });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.pending, []);
  assert.deepEqual(result.generatedFiles, [imagePath, metadataPath]);
  assert.deepEqual(result.changedPaths, [imagePath, metadataPath, path.join(root, '..', 'README.md'), path.join(root, 'README.md')]);
  assert.deepEqual(await readFile(imagePath), jpeg);
  assert.deepEqual(await readFile(path.join(directory, 'qrcode.png')), png);
  const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
  assert.equal(metadata.filename, 'qrcode.jpg');
  assert.equal(metadata.content_type, 'image/jpeg');
  assert.equal(metadata.sha256, createHash('sha256').update(jpeg).digest('hex'));
  const expected = qrMetadata({ ...config, env_version: 'trial' }, before.demos.find((d) => d.ready));
  assert.equal(await matchingCode(directory, expected), true);
  for (const [readme, prefix] of [[path.join(root, '..', 'README.md'), 'mado/'], [path.join(root, 'README.md'), '']]) {
    const content = await readFile(readme, 'utf8');
    assert.ok(content.includes(`src="${prefix}${encodeURIComponent('中文 空格')}/qrcode.jpg"`));
    assert.doesNotMatch(content, /qrcode\.png/);
  }
  assert.deepEqual(await generateCatalog(root), before);
  const reused = await generateQrcodes({ root, env: { MADO_WECHAT_ENV_VERSION: 'trial' }, fetchImpl: noNetwork });
  assert.deepEqual(reused.generatedFiles, []);
  assert.deepEqual(reused.changedPaths, []);
  assert.deepEqual(reused.pending, []);
  // 无 filename 的元数据可从 MIME 推导；不接受不一致或任意路径。
  const { filename, ...legacy } = metadata;
  await writeFile(metadataPath, JSON.stringify(legacy));
  assert.equal(await matchingCode(directory, expected), true);
  for (const invalid of ['qrcode.png', '../qrcode.jpg']) {
    await writeFile(metadataPath, JSON.stringify({ ...metadata, filename: invalid }));
    assert.equal(await matchingCode(directory, expected), false);
  }
  await writeFile(metadataPath, JSON.stringify(metadata));
  await writeFile(imagePath, png);
  assert.equal(await matchingCode(directory, expected), false);
});

test('旧JPEG即使误存png也不复用、不自动删除', async (t) => {
  const root = await fixture(t);
  await generateQrcodes({ root, env: { MADO_WECHAT_ACCESS_TOKEN: '测试token' },
    fetchImpl: () => new Response(jpeg, { headers: { 'content-type': 'image/jpeg' } }) });
  const directory = path.join(root, '中文 空格');
  await writeFile(path.join(directory, 'qrcode.png'), jpeg);
  await rm(path.join(directory, 'qrcode.jpg'));
  const result = await generateQrcodes({ root, fetchImpl: noNetwork });
  assert.deepEqual(result.pending, ['中文 空格']);
  assert.deepEqual(result.generatedFiles, []);
  assert.deepEqual(await readFile(path.join(directory, 'qrcode.png')), jpeg);
  assert.match(await readFile(path.join(root, 'README.md'), 'utf8'), /待授权生成/);
});

test('图片MIME、签名、字节及像素上限校验', () => {
  assert.equal(validateImage(png, 'image/png').image_width, 1);
  assert.throws(() => validateImage(png, 'image/jpeg'));
  assert.throws(() => validateImage(Buffer.alloc(5 * 1024 * 1024 + 1), 'image/png'));
  const large = Buffer.from(png); large.writeUInt32BE(1281, 16);
  assert.throws(() => validateImage(large, 'image/png'));
  assert.equal(validateImage(jpeg, 'image/jpeg').image_height, 1);
  assert.throws(() => validateImage(Buffer.from('JSON错误'), 'image/png'));
});
