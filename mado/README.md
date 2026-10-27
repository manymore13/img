# Mado 示例资源

`mado/` 每个直接一级非隐藏目录都是一个 demo，目录名可含中文和空格。添加 `page.md`、`style.css`，按需添加图片、指南等相对引用资源。`page.md` Front Matter 的单行 `label` 优先作为显示名，其次 `title`，最后使用真实目录名。

小程序从以下 Pages 目录读取 `demos.json` 和资源：

```text
https://manymore13.github.io/img/mado/
```

## 清单契约

`node scripts/generate-mado-catalog.mjs` 无第三方依赖，默认生成 `mado/demos.json`；`--root <目录>` 可用于独立测试。

```json
{
  "schemaVersion": 1,
  "revision": "确定性的 SHA-256 摘要",
  "demos": [{ "dir": "真实目录名", "scene": "d加目录名SHA256前20位", "label": "显示名", "ready": true }],
  "versions": { "真实目录名/page.md": "文件内容的 SHA-256" }
}
```

所有一级 demo 目录（包括空目录）均列入清单；只有普通文件 `page.md` 和 `style.css` 都存在才有 `ready: true`。小程序应将 `ready: false` 显示为不可加载。资源递归扫描普通文件，跳过符号链接、隐藏项及依赖目录 `node_modules`、`bower_components`、`jspm_packages`、`vendor`；一级同名依赖目录也跳过。`versions` 的键使用真实名称和 `/`，小程序拼接相对 URL 时逐段 `encodeURIComponent`，并以对应 hash 作为 `v` 参数。

使用固定 `en` locale 排序并以原始字符串打破排序平局；没有时间戳。`revision` 对排序后的全部 demo 目录名和文件路径／内容 hash 计算摘要，新增、删除、重命名目录或修改单张图片均可改变摘要。各级 README.md、各级 qrcode.png／qrcode.jpg／qrcode.json、生成清单本身、根扫码配置和忽略项不参与计算，避免扫码元数据与展示表更新循环影响 revision。Front Matter 支持单行普通、单引号及 JSON 双引号字符串，不解析完整 YAML 或多行字段。

## 官方小程序码与一次性配置

公开配置位于 `qrcode.config.json`，默认 appid 为 `wxf872813f65e641bb`，页面为 `pages/index/index`，版本为 `develop`，宽度为 430。scene 固定为 `d + sha256(UTF8目录名).slice(0, 20)`；改显示名或素材不会改变 scene，改目录名会改变。小程序在页面 `onLoad(query)` 中对 `query.scene` 执行一次 `decodeURIComponent`，用 `catalog.demos.find(demo => demo.scene === scene && demo.ready)` 查找 demo，再按清单加载资源；需由宿主实现该查询逻辑，本仓库不修改宿主。

`node scripts/generate-mado-qrcodes.mjs` 从环境读取 `MADO_WECHAT_APPID`（可选覆盖公开配置）、`MADO_WECHAT_SECRET`，或已有的 `MADO_WECHAT_ACCESS_TOKEN`（不读取通用 `ACCESS_TOKEN`，避免误用其他服务凭据）。无凭据时不请求网络、不生成占位图片，只更新清单和带自动标记的两份 README。`--offline` 强制忽略所有环境凭据。仅 ready demo 可生成；参数及图片 hash、格式、尺寸与元数据全部匹配才复用旧码。微信 JSON 错误、MIME／签名不符、超过 5 MiB 或 1280 像素上限均拒绝，不以错误响应覆盖旧码。按真实格式保留官方原始字节：PNG 保存为 `qrcode.png`，JPEG 保存为 `qrcode.jpg`；`qrcode.json` 记录 `filename`、真实 MIME、尺寸及 hash。匹配时按 MIME 校验文件名（缺少 `filename` 时由 MIME 推导），两份 README 使用实际图片路径，旧格式文件不会自动删除；误将 JPEG 保存为 `.png` 的旧码不会复用，无凭据时保留旧文件并显示待授权生成。`generateQrcodes()` 返回本次成功生成的图片及元数据路径 `generatedFiles`，并通过 `changedPaths` 明确返回本次内容实际变化的图片、元数据、清单及 README 路径；重复运行无变化时返回空数组。

一次性在仓库 Actions Secrets 配置 `MADO_WECHAT_SECRET`，或短期使用 `MADO_WECHAT_ACCESS_TOKEN`；不要将凭据写入配置文件。需要覆盖时在 Actions Variables 配置 `MADO_WECHAT_APPID` 和 `MADO_WECHAT_ENV_VERSION`（`develop`／`trial`／`release`）。脚本先取得官方 token，再调用 `/wxa/getwxacodeunlimit`，不输出 token、secret 或原始错误响应。非 release 使用 `check_path: false`，release 使用 `true`；开发／体验版本仍需上传对应版本，扫码者需有相应成员权限，凭据也必须具备接口权限。配置完成后手动运行 Actions 即可生成真实官方码。

参数依据微信官方 [获取不限制的小程序码](https://developers.weixin.qq.com/minigame/dev/api-backend/qr-code/api_getunlimitedqrcode.html)：scene 最长 32 个可见字符、page 不带开头斜杠和查询参数、width 280–1280。旧小程序文档入口目前已迁移；官方社区也说明未发布页面使用非正式版本时应关闭 check_path。开发版配置本身不等于拥有生码授权。

离线验证执行 `node --test scripts/mado-generators.test.mjs`，所有测试使用临时 fixtures 和注入 fetch，不访问外网。README 自动区间为 `MADO-DEMOS:START` 到 `MADO-DEMOS:END`，区间外说明保留。

## 手动提交与发布

在资源仓库修改完成后自行执行（首次同时提交脚本、工作流和本说明）：

```bash
node scripts/generate-mado-catalog.mjs
node scripts/generate-mado-qrcodes.mjs --offline
# 明确列出本次要提交的素材路径，检查后自行提交
git add -- mado/demos.json README.md mado/README.md
git diff --cached
git commit -m "Update Mado demos"
git push origin main
```

每次 `main` push 或在 Actions 手动运行工作流都会重新生成清单；每次更新两份 README；有变化时机器人只提交 `mado/demos.json`、根 README、此 README 和本次成功生成的 `qrcode.png` 或 `qrcode.jpg` 及 `qrcode.json`，正常 push 到 `main`，不会将其他素材顺带提交。无凭据时正常部署并列出待生成项。同一发布组串行执行，每次检出最新 `main`。若运行期间有人继续推送，普通 push 会安全失败，不会强推覆盖；后续 push 触发的运行会再次生成，也可手动重跑。Git 不跟踪空目录，需放入一个非隐藏普通文件才能将该目录同步到远端。

## 首次 Pages 配置与权限

仓库目前使用 Pages 的 `main` 分支来源时，首次需在 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**，再推送或手动运行本工作流。仓库／组织需允许 Actions 运行及 `GITHUB_TOKEN` 的 `contents: write`、`pages: write`、`id-token: write`；分支保护／规则集需允许机器人直接写入清单，`github-pages` 环境需允许从 `main` 部署。若有审批要求，需完成环境审批。

工作流生成清单、按需提交后，用同一个 HEAD 的完整仓库快照上传 Pages artifact，并调用 `deploy-pages@v4` 显式部署；清单与资源来自同一份内容。机器人 token 的提交通常不会再次触发 push 工作流，不能依赖机器人提交自动触发旧的分支 Pages 构建。工作流直接发布静态文件，根目录保留 `.nojekyll`，避免 Front Matter Markdown 被 Jekyll 转换。

等待 Actions 的 Pages 部署成功后，重新扫码对应 demo 即可检查清单与资源更新；小程序为全屏沉浸式，没有底栏选择、刷新或更多入口。清单生成、提交或部署失败时请查看对应步骤日志；GitHub Pages CDN 传播期间可能短暂看到上一版资源。

图片来源：Wikimedia Commons，摄影 沈澄心、Xiaoding413，CC0。

<!-- MADO-DEMOS:START -->
## Mado demo 扫码目录

当前目标：`wxf872813f65e641bb` · `develop` · `pages/index/index`。开发版／体验版需要对应微信成员权限。

| Demo | 目录 | scene | 小程序码 |
| --- | --- | --- | --- |
| [最小示例](basic/) | basic | dfbb7b5bf4ca348eeeebf | 待授权生成 |
| [能力总览](capabilities/) | capabilities | d3fc0e5c4c484797a0035 | 待授权生成 |
| [晨雾手冲套装](coffee-set/) | coffee-set | db79b97c5b35142a960ea | 待授权生成 |
| [东林大佛 · 四十八米金身](donglin/) | donglin | dc808d1e31bb5fc1842ef | 待授权生成 |
| [节气行 · 山里的朱砂先红了](showcase/) | showcase | d9877f886f03e5e1c5200 | 待授权生成 |
| [山间一日](%E5%B1%B1%E5%A4%96%E6%9D%A5%E4%BF%A1/) | 山外来信 | d08e6a55d901d3a83cbff | 待授权生成 |
<!-- MADO-DEMOS:END -->
