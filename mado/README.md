# Mado 示例资源

`mado/` 每个直接一级非隐藏目录都是一个 demo，目录名可含中文和空格。添加 `page.md`、`style.css`，按需添加图片、指南等相对引用资源。`page.md` Front Matter 的单行 `label` 优先作为显示名，其次 `title`，最后使用真实目录名。

资源有两个可访问入口，内容同源：

```text
GitHub Pages（扫码页、给人看）  https://manymore13.github.io/img/mado/
Gitee raw（小程序取数）        https://gitee.com/manymore13/img/raw/main/mado/
```

小程序侧当前仍读 GitHub Pages（`app.js` 里 `REMOTE = 'github'`）：`github.io` 个人无法备案，体验版真机会被域名校验拦下，**临时办法是进入小程序后点右上角「···」打开调试模式**，校验会被豁免；正式可用的前提是备案域名到位后把 base 换成自己的域名（`REMOTE = 'custom'`），内容不用搬家。

也可以改读 Gitee raw：`gitee.com` 是备案域名，能进服务器域名白名单，但它会 302 跳到 `raw.giteeusercontent.com`（签名地址），小程序跟随跳转时**跳转后的域名也要在白名单**，所以后台要同时加 `https://gitee.com` 与 `https://raw.giteeusercontent.com`（`request` 与 `downloadFile` 各一组）。`v` 版本参数会在跳转里被丢掉，实际靠 Gitee 自己的 60 秒缓存，内容更新最多滞后一分钟；`mp3` 会被响应成 `application/octet-stream`，音频可能播不出来。

## 加一个 demo：只准备文件，其余自动

1. 新建 `mado/<目录名>/`，放入 `page.md` 与 `style.css`（图片、指南等同目录相对引用）。
2. 提交并推送到 `main`。
3. 等 Actions 跑完，打开 `https://manymore13.github.io/img/mado/` 扫码。这个页面就是扫码目录，每次发布自动重写。

推上去之后这些都由 Actions 自动完成，不需要在本地跑脚本、不需要手写版本号、也不需要单独生码：

- `demos.json` 的 `revision`、每个文件的 SHA-256 版本号（小程序用它做 `v` 缓存参数）。
- 新 demo 的官方小程序码 `qrcode.png`／`qrcode.jpg` 与 `qrcode.json` 元数据，已有 demo 的码原样复用。
- 两份 README 的扫码表与 `mado/index.html` 扫码页。
- Pages 部署。

`page.md` 里的 `revision` 字段是可选的业务标识，引擎不会校验它，也不会用它做缓存键；版本号由内容 hash 自动算。

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

使用固定 `en` locale 排序并以原始字符串打破排序平局；没有时间戳。`revision` 对排序后的全部 demo 目录名和文件路径／内容 hash 计算摘要，新增、删除、重命名目录或修改单张图片均可改变摘要。各级 README.md、各级 qrcode.png／qrcode.jpg／qrcode.json、生成清单本身、根扫码配置和忽略项不参与计算，避免扫码元数据与展示表更新循环影响 revision；扫码页 `mado/index.html` 在一级目录之外，同样不参与。Front Matter 支持单行普通、单引号及 JSON 双引号字符串，不解析完整 YAML 或多行字段。

## 官方小程序码与一次性配置

公开配置位于 `qrcode.config.json`，默认 appid 为 `wxf872813f65e641bb`，页面为 `pages/index/index`，版本为 `trial`（体验版），宽度为 430。scene 固定为 `d + sha256(UTF8目录名).slice(0, 20)`；改显示名或素材不会改变 scene，改目录名会改变。小程序在页面 `onLoad(query)` 中对 `query.scene` 执行一次 `decodeURIComponent`，用 `catalog.demos.find(demo => demo.scene === scene && demo.ready)` 查找 demo，再按清单加载资源；需由宿主实现该查询逻辑，本仓库不修改宿主。

### 码的有效期：为什么用体验版

三种 `env_version` 的差别不只是「打开哪个版本」，还决定了码能活多久：

| env_version | 扫码打开 | 有效期 | 扫码者限制 |
| --- | --- | --- | --- |
| `develop` | 开发版 | **绑当次开发版会话，约 24–48 小时失效**，过期提示「码已过期」，重新上传后需重新申领 | 开发者／体验者 |
| `trial` | 体验版 | 长期有效，不随会话过期 | 体验成员 |
| `release` | 线上版 | 永久 | 无（需已通过审核发布） |

所以默认用 `trial`：上传一次、在后台「选为体验版」、把自己的微信号加进体验成员，之后加 demo 只管 push，扫码一直有效。

**码失效在微信侧，元数据匹配看不出来**——文件名、hash、参数全都对得上，码却已经过期。需要重领时用 `--force`（本地 `node scripts/generate-mado-qrcodes.mjs --force`），或在 Actions 里手动运行工作流并勾选 `force_codes`。普通 push 不会强制重算，避免每次改动都白刷 7 次接口。

体验版一次性设置：开发者工具「上传」→ 后台 管理 → 版本管理 → 开发版本「选为体验版」→ 成员管理添加体验成员。未上线也能设体验版；`develop` 的码只适合临时看一眼，不适合长期挂着扫码。

`node scripts/generate-mado-qrcodes.mjs` 从环境读取 `MADO_WECHAT_APPID`（可选覆盖公开配置）、`MADO_WECHAT_SECRET`，或已有的 `MADO_WECHAT_ACCESS_TOKEN`（不读取通用 `ACCESS_TOKEN`，避免误用其他服务凭据）。无凭据时不请求网络、不生成占位图片，只更新清单和带自动标记的两份 README。`--offline` 强制忽略所有环境凭据。仅 ready demo 可生成；参数及图片 hash、格式、尺寸与元数据全部匹配才复用旧码。微信 JSON 错误、MIME／签名不符、超过 5 MiB 或 1280 像素上限均拒绝，不以错误响应覆盖旧码。按真实格式保留官方原始字节：PNG 保存为 `qrcode.png`，JPEG 保存为 `qrcode.jpg`；`qrcode.json` 记录 `filename`、真实 MIME、尺寸及 hash。匹配时按 MIME 校验文件名（缺少 `filename` 时由 MIME 推导），两份 README 使用实际图片路径，旧格式文件不会自动删除；误将 JPEG 保存为 `.png` 的旧码不会复用，无凭据时保留旧文件并显示待授权生成。`generateQrcodes()` 返回本次成功生成的图片及元数据路径 `generatedFiles`，并通过 `changedPaths` 明确返回本次内容实际变化的图片、元数据、清单、README 与扫码页路径，同时带回 `envVersion` 与 `force` 供工作流摘要使用；重复运行无变化时返回空数组。

同一个脚本还会写 `mado/index.html`（Pages 上的扫码目录页）：每个 ready demo 一张码、显示名、目录、scene 与 `page.md`／`style.css` 入口；还没有码的显示「待生成」，缺 `page.md` 或 `style.css` 的显示缺哪个文件。页面内容只由清单推导，不含时间戳，重复生成不产生噪声。工作流把生码失败降级为警告：内容照常提交和部署，码等下次成功后自动补齐，不会因为一个码卡住整站发布；发布结束会在 Actions 摘要里列出新生成数量、待生成列表与失败原因。

一次性在仓库 Actions Secrets 配置 `MADO_WECHAT_SECRET`，或短期使用 `MADO_WECHAT_ACCESS_TOKEN`；不要将凭据写入配置文件。需要覆盖时在 Actions Variables 配置 `MADO_WECHAT_APPID` 和 `MADO_WECHAT_ENV_VERSION`（`develop`／`trial`／`release`）。脚本先取得官方 token，再调用 `/wxa/getwxacodeunlimit`，不输出 token、secret 或原始错误响应。非 release 使用 `check_path: false`，release 使用 `true`；开发／体验版本仍需上传对应版本，扫码者需有相应成员权限，凭据也必须具备接口权限。配置完成后手动运行 Actions 即可生成真实官方码。

参数依据微信官方 [获取不限制的小程序码](https://developers.weixin.qq.com/minigame/dev/api-backend/qr-code/api_getunlimitedqrcode.html)：scene 最长 32 个可见字符、page 不带开头斜杠和查询参数、width 280–1280。旧小程序文档入口目前已迁移；官方社区也说明未发布页面使用非正式版本时应关闭 check_path。开发版配置本身不等于拥有生码授权。

离线验证执行 `node --test scripts/mado-generators.test.mjs`，所有测试使用临时 fixtures 和注入 fetch，不访问外网。README 自动区间为 `MADO-DEMOS:START` 到 `MADO-DEMOS:END`，区间外说明保留。

## 手动提交与发布

在资源仓库修改完成后自行执行（首次同时提交脚本、工作流和本说明）：

```bash
node scripts/generate-mado-catalog.mjs
node scripts/generate-mado-qrcodes.mjs --offline
# 明确列出本次要提交的素材路径，检查后自行提交
git add -- mado/demos.json mado/index.html README.md mado/README.md
git diff --cached
git commit -m "Update Mado demos"
git push origin main
```

每次 `main` push 或在 Actions 手动运行工作流都会重新生成清单；每次更新两份 README 与扫码页；有变化时机器人只提交 `mado/demos.json`、`mado/index.html`、根 README、此 README 和本次成功生成的 `qrcode.png` 或 `qrcode.jpg` 及 `qrcode.json`，正常 push 到 `main`，不会将其他素材顺带提交。无凭据时正常部署并列出待生成项。同一发布组串行执行，每次检出最新 `main`。若运行期间有人继续推送，普通 push 会安全失败，不会强推覆盖；后续 push 触发的运行会再次生成，也可手动重跑。Git 不跟踪空目录，需放入一个非隐藏普通文件才能将该目录同步到远端。

## 同步到 Gitee（国内镜像）

Gitee 上有一份镜像 `https://gitee.com/manymore13/img.git`。工作流在提交生成物之后会把 `main` 推过去：

- 需要仓库 Actions Secrets 配 `GITEE_TOKEN`（Gitee 私人令牌，勾 `projects` 权限）；没配就静默跳过，不影响其它步骤。
- 目标地址可用 Actions Variables `GITEE_URL` 覆盖，默认 `https://gitee.com/manymore13/img.git`。
- 推送失败只记 warning，GitHub 侧的提交与 Pages 发布照常完成，不会因为镜像挂了整站发不出去。
- 令牌只出现在一条 `git push` 命令里，输出统一打码后再进日志。

**镜像不等于托管。** Gitee Pages 已于 2024-07-15 下线，新项目开不了、推代码也不触发构建；`*.gitee.io` 也不是可备案域名，加不进小程序服务器域名白名单。所以镜像只解决「国内能直接读源码」，小程序取数仍必须走已备案域名或微信云开发——见上一节的码有效期说明。

## 首次 Pages 配置与权限

仓库目前使用 Pages 的 `main` 分支来源时，首次需在 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**，再推送或手动运行本工作流。仓库／组织需允许 Actions 运行及 `GITHUB_TOKEN` 的 `contents: write`、`pages: write`、`id-token: write`；分支保护／规则集需允许机器人直接写入清单，`github-pages` 环境需允许从 `main` 部署。若有审批要求，需完成环境审批。

工作流生成清单、按需提交后，用同一个 HEAD 的完整仓库快照上传 Pages artifact，并调用 `deploy-pages@v4` 显式部署；清单与资源来自同一份内容。机器人 token 的提交通常不会再次触发 push 工作流，不能依赖机器人提交自动触发旧的分支 Pages 构建。工作流直接发布静态文件，根目录保留 `.nojekyll`，避免 Front Matter Markdown 被 Jekyll 转换。

等待 Actions 的 Pages 部署成功后，重新扫码对应 demo 即可检查清单与资源更新；小程序为全屏沉浸式，没有底栏选择、刷新或更多入口。清单生成、提交或部署失败时请查看对应步骤日志；GitHub Pages CDN 传播期间可能短暂看到上一版资源。

图片来源：Wikimedia Commons，摄影 沈澄心、Xiaoding413，CC0。

<!-- MADO-DEMOS:START -->
## Mado demo 扫码目录

当前目标：`wxf872813f65e641bb` · `trial` · `pages/index/index`。开发版／体验版需要对应微信成员权限。

扫码页（每次发布自动重写）：<https://manymore13.github.io/img/mado/>

| Demo | 目录 | scene | 小程序码 |
| --- | --- | --- | --- |
| [最小示例](basic/) | basic | dfbb7b5bf4ca348eeeebf | <img src="basic/qrcode.jpg" width="160" alt="官方小程序码"> |
| [能力总览](capabilities/) | capabilities | d3fc0e5c4c484797a0035 | <img src="capabilities/qrcode.jpg" width="160" alt="官方小程序码"> |
| [晨雾手冲套装](coffee-set/) | coffee-set | db79b97c5b35142a960ea | <img src="coffee-set/qrcode.jpg" width="160" alt="官方小程序码"> |
| [东林大佛 · 四十八米金身](donglin/) | donglin | dc808d1e31bb5fc1842ef | <img src="donglin/qrcode.jpg" width="160" alt="官方小程序码"> |
| [庐山 · 山行手册](lushan/) | lushan | d13659f896f78df541cd1 | <img src="lushan/qrcode.jpg" width="160" alt="官方小程序码"> |
| [节气行 · 山里的朱砂先红了](showcase/) | showcase | d9877f886f03e5e1c5200 | <img src="showcase/qrcode.jpg" width="160" alt="官方小程序码"> |
| [山间一日](%E5%B1%B1%E5%A4%96%E6%9D%A5%E4%BF%A1/) | 山外来信 | d08e6a55d901d3a83cbff | <img src="%E5%B1%B1%E5%A4%96%E6%9D%A5%E4%BF%A1/qrcode.jpg" width="160" alt="官方小程序码"> |
<!-- MADO-DEMOS:END -->
