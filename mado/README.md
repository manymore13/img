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
  "demos": [{ "dir": "真实目录名", "label": "显示名", "ready": true }],
  "versions": { "真实目录名/page.md": "文件内容的 SHA-256" }
}
```

所有一级 demo 目录（包括空目录）均列入清单；只有普通文件 `page.md` 和 `style.css` 都存在才有 `ready: true`。小程序应将 `ready: false` 显示为不可加载。资源递归扫描普通文件，跳过符号链接、隐藏项及依赖目录 `node_modules`、`bower_components`、`jspm_packages`、`vendor`；一级同名依赖目录也跳过。`versions` 的键使用真实名称和 `/`，小程序拼接相对 URL 时逐段 `encodeURIComponent`，并以对应 hash 作为 `v` 参数。

使用固定 `en` locale 排序并以原始字符串打破排序平局；没有时间戳。`revision` 对排序后的全部 demo 目录名和文件路径／内容 hash 计算摘要，新增、删除、重命名目录或修改单张图片均可改变摘要。根目录的 README、生成清单本身和忽略项不参与计算。Front Matter 支持单行普通、单引号及 JSON 双引号字符串，不解析完整 YAML 或多行字段。

## 手动提交与发布

在资源仓库修改完成后自行执行（首次同时提交脚本、工作流和本说明）：

```bash
node scripts/generate-mado-catalog.mjs
git add -- mado scripts/generate-mado-catalog.mjs .github/workflows/mado-catalog.yml
git diff --cached
git commit -m "Update Mado demos"
git push origin main
```

每次 `main` push 或在 Actions 手动运行工作流都会重新生成清单；有变化时机器人只提交 `mado/demos.json`，正常 push 到 `main`。同一发布组串行执行，每次检出最新 `main`。若运行期间有人继续推送，普通 push 会安全失败，不会强推覆盖；后续 push 触发的运行会再次生成，也可手动重跑。Git 不跟踪空目录，需放入一个非隐藏普通文件才能将该目录同步到远端。

## 首次 Pages 配置与权限

仓库目前使用 Pages 的 `main` 分支来源时，首次需在 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**，再推送或手动运行本工作流。仓库／组织需允许 Actions 运行及 `GITHUB_TOKEN` 的 `contents: write`、`pages: write`、`id-token: write`；分支保护／规则集需允许机器人直接写入清单，`github-pages` 环境需允许从 `main` 部署。若有审批要求，需完成环境审批。

工作流生成清单、按需提交后，用同一个 HEAD 的完整仓库快照上传 Pages artifact，并调用 `deploy-pages@v4` 显式部署；清单与资源来自同一份内容。机器人 token 的提交通常不会再次触发 push 工作流，不能依赖机器人提交自动触发旧的分支 Pages 构建。工作流直接发布静态文件，根目录保留 `.nojekyll`，避免 Front Matter Markdown 被 Jekyll 转换。

等待 Actions 的 Pages 部署成功后，再在小程序刷新列表与资源。清单生成、提交或部署失败时请查看对应步骤日志；GitHub Pages CDN 传播期间可能短暂看到上一版资源。

图片来源：Wikimedia Commons，摄影 沈澄心、Xiaoding413，CC0。
