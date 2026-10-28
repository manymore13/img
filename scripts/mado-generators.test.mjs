import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { generateCatalog, demoScene, defaultMinEngine } from './generate-mado-catalog.mjs';
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

test('清单按页面声明输出 minEngine 与 capabilities，非法值回落且旧页面兼容', async (t) => {
  const root = await fixture(t);
  const legacy = (await generateCatalog(root)).demos.find((d) => d.dir === '中文 空格');
  assert.equal(legacy.ready, true);
  assert.equal(legacy.minEngine, defaultMinEngine);
  assert.deepEqual(legacy.capabilities, []);

  await mkdir(path.join(root, 'v2-page'));
  await writeFile(path.join(root, 'v2-page/page.md'),
    "---\ntitle: 新版\nminEngine: 0.3.0\ncapabilities: wechat:input@1, wechat:button@1 wechat:input@1\n---\n正文");
  await writeFile(path.join(root, 'v2-page/style.css'), 'page {}');
  const gated = (await generateCatalog(root)).demos.find((d) => d.dir === 'v2-page');
  assert.equal(gated.minEngine, '0.3.0');
  assert.deepEqual(gated.capabilities, ['wechat:button@1', 'wechat:input@1']);

  await writeFile(path.join(root, 'v2-page/page.md'), '---\nminEngine: latest\ncapabilities: javascript:exec@1 Bad@x\n---\n正文');
  const invalid = (await generateCatalog(root)).demos.find((d) => d.dir === 'v2-page');
  assert.equal(invalid.minEngine, defaultMinEngine);
  assert.deepEqual(invalid.capabilities, []);
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
  assert.deepEqual(first.changedPaths, [path.join(root, 'demos.json'), path.join(root, '..', 'README.md'), path.join(root, 'README.md'), path.join(root, 'index.html')]);
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
  assert.deepEqual(result.changedPaths, [imagePath, metadataPath, path.join(root, '..', 'README.md'), path.join(root, 'README.md'), path.join(root, 'index.html')]);
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

test('扫码页列出全部 demo，缺码与缺素材分状态显示且可重复生成', async (t) => {
  const root = await fixture(t);
  await mkdir(path.join(root, '待补样式'));
  await writeFile(path.join(root, '待补样式/page.md'), '---\nlabel: <b>未完成</b>\n---\n正文');

  const offline = await generateQrcodes({ root, fetchImpl: noNetwork });
  const page = await readFile(path.join(root, 'index.html'), 'utf8');
  assert.ok(offline.changedPaths.includes(path.join(root, 'index.html')));
  // 三个目录都在页面上，编码后的目录名可用作相对路径。
  assert.match(page, /<h2>测试 \| 展示<\/h2>/);
  assert.ok(page.includes('href="./%E4%B8%AD%E6%96%87%20%E7%A9%BA%E6%A0%BC/page.md"'));
  assert.match(page, /待生成小程序码/);
  assert.match(page, /缺 style\.css/);
  // 标签名里的尖括号必须转义，不能把页面结构写坏。
  assert.match(page, /<h2>&lt;b&gt;未完成&lt;\/b&gt;<\/h2>/);
  assert.doesNotMatch(page, /<h2><b>/);
  assert.match(page, /scene d[a-f0-9]{20}/);

  // 同一份清单重复生成不产生改动。
  const again = await generateQrcodes({ root, fetchImpl: noNetwork });
  assert.deepEqual(again.changedPaths, []);
  assert.equal(await readFile(path.join(root, 'index.html'), 'utf8'), page);

  // 有了码之后页面引用真实图片文件，而不是占位。
  await generateQrcodes({ root, env: { MADO_WECHAT_ACCESS_TOKEN: '测试token' }, fetchImpl: imageResponse });
  const withCode = await readFile(path.join(root, 'index.html'), 'utf8');
  assert.ok(withCode.includes('src="./%E4%B8%AD%E6%96%87%20%E7%A9%BA%E6%A0%BC/qrcode.png"'));
  assert.match(withCode, /alt="测试 \| 展示 的小程序码"/);
  assert.doesNotMatch(withCode, /测试 \| 展示<\/h2>\n<div class="placeholder">/);
});

test('新增目录后清单版本号、扫码页与码状态自动跟随', async (t) => {
  const root = await fixture(t);
  const before = await generateQrcodes({ root, env: { MADO_WECHAT_ACCESS_TOKEN: '测试token' }, fetchImpl: imageResponse });
  assert.deepEqual(before.pending, []);
  const firstCatalog = JSON.parse(await readFile(path.join(root, 'demos.json'), 'utf8'));

  // 手动加一个 demo：只写 page.md 与 style.css，其余不碰。
  await mkdir(path.join(root, '新增 demo'));
  await writeFile(path.join(root, '新增 demo/page.md'), '---\nlabel: 新加的一页\n---\n```html mado\n<view class="a">\n<text>正文</text>\n</view>\n```');
  await writeFile(path.join(root, '新增 demo/style.css'), 'page {}');

  const after = await generateQrcodes({ root, env: { MADO_WECHAT_ACCESS_TOKEN: '测试token' }, fetchImpl: imageResponse });
  const secondCatalog = JSON.parse(await readFile(path.join(root, 'demos.json'), 'utf8'));
  assert.notEqual(secondCatalog.revision, firstCatalog.revision);
  // 版本号是内容 SHA-256，自动带上，不需要手写 revision。
  const version = secondCatalog.versions[`新增 demo/page.md`];
  assert.match(version, /^[a-f0-9]{64}$/);
  assert.equal(version, createHash('sha256').update(await readFile(path.join(root, '新增 demo/page.md'))).digest('hex'));
  assert.deepEqual(after.pending, []);
  assert.equal(after.generatedFiles.length, 2);
  const page = await readFile(path.join(root, 'index.html'), 'utf8');
  assert.match(page, /<h2>新加的一页<\/h2>/);
  assert.ok(page.includes('src="./%E6%96%B0%E5%A2%9E%20demo/qrcode.png"'));
  // 老 demo 的码不会因为别人新增而被重算。
  assert.ok(!after.changedPaths.includes(path.join(root, '中文 空格', 'qrcode.png')));
});

test('凭据无效时只试一次，透出 errcode 且不泄露 secret', async (t) => {
  const root = await fixture(t);
  await mkdir(path.join(root, 'second'));
  await writeFile(path.join(root, 'second/page.md'), '---\nlabel: 第二页\n---\n正文');
  await writeFile(path.join(root, 'second/style.css'), 'page {}');
  let calls = 0;
  const fetchImpl = () => { calls++; return Response.json({ errcode: 40125, errmsg: 'invalid appid 测试凭据' }); };
  const result = await generateQrcodes({ root, env: { MADO_WECHAT_SECRET: '测试凭据' }, fetchImpl });
  // 拿不到 token 就不该继续逐个 demo 重试，否则一次配置错误会刷出 N 条一样的错。
  assert.equal(calls, 1);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].message, /errcode 40125/);
  assert.deepEqual([...result.pending].sort(), ['second', '中文 空格'].sort());
  const text = JSON.stringify(result);
  assert.doesNotMatch(text, /测试凭据/);
  assert.doesNotMatch(text, /invalid appid/);
});

test('token 失效类生码错误不逐个重试', async (t) => {
  const root = await fixture(t);
  await mkdir(path.join(root, 'second'));
  await writeFile(path.join(root, 'second/page.md'), '---\nlabel: 第二页\n---\n正文');
  await writeFile(path.join(root, 'second/style.css'), 'page {}');
  let calls = 0;
  const fetchImpl = () => { calls++; return Response.json({ errcode: 40001, errmsg: 'invalid credential 测试token' }); };
  const result = await generateQrcodes({ root, env: { MADO_WECHAT_ACCESS_TOKEN: '测试token' }, fetchImpl });
  assert.equal(calls, 1);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].message, /40001/);
  assert.doesNotMatch(JSON.stringify(result), /测试token/);
  assert.equal(result.generatedFiles.length, 0);
});

test('force 会忽略元数据匹配重新申领，且仍校验图片后落盘', async (t) => {
  const root = await fixture(t);
  const first = await generateQrcodes({ root, env: { MADO_WECHAT_ACCESS_TOKEN: '测试token' }, fetchImpl: imageResponse });
  assert.equal(first.generatedFiles.length, 2);
  // 不 force：命中元数据就复用，不发请求。
  const reused = await generateQrcodes({ root, env: { MADO_WECHAT_ACCESS_TOKEN: '测试token' }, fetchImpl: noNetwork });
  assert.deepEqual(reused.generatedFiles, []);
  // force：微信侧的码可能已失效，元数据匹配不代表还能扫，必须重领。
  const forced = await generateQrcodes({ root, env: { MADO_WECHAT_ACCESS_TOKEN: '测试token' }, fetchImpl: imageResponse, force: true });
  assert.equal(forced.generatedFiles.length, 2);
  assert.equal(forced.envVersion, 'develop');
  assert.equal(forced.force, true);
  assert.deepEqual(forced.errors, []);
  assert.deepEqual(forced.pending, []);
});
