# Mado 示例页面（静态资源）

由 `npm run build:pages` 从本地 `examples/` 导出，供 Mado 页面引擎的微信小程序端远程加载。

- `showcase/` 节气专题（纯文本 + CSS）
- `donglin/` 东林大佛景点页（含 `images/` 与可下载的 `guide.md`）
- `basic/` 最小示例

小程序里把 `remoteBase` 指向本目录的 Pages 地址即可：

```
https://manymore13.github.io/img/mado/
```

小程序启动或点击「刷新列表与资源」时，通过 GitHub 树 API 自动发现 main 分支中 `mado/` 下同时包含 `page.md` 与 `style.css` 的目录。不需要维护清单，也不用为新增示例重新打包小程序。

新增示例时，在 `mado/<示例名>/` 添加 `page.md` 和 `style.css`，按需放 `images/` 和 `guide.md`。`page.md` 的 Front Matter 用 `label: 示例显示名`（可选）和 `stylesheet: ./style.css`；图片使用 `./images/xxx.jpg` 相对引用。只使用 Mado 已支持的内容组件与 CSS 能力。

更新现有页面、CSS、图片或指南时，直接修改或替换原文件，文件名不必变化。小程序刷新时读取各文件的 Git blob SHA，将其作为资源地址的 `v` 参数，避免继续使用旧资源缓存；不再保留包内示例副本。

本地修改由用户自行提交并推送：

```bash
git -C D:/dev/github-img add mado
git -C D:/dev/github-img commit -m "Update Mado demos"
git -C D:/dev/github-img push origin main
```

推送后等待 GitHub Pages 发布完成，再在小程序点击「刷新列表与资源」。仓库根目录保留 `.nojekyll`，否则带 Front Matter 的 Markdown 可能被转换成 HTML，导致原地址不可用。GitHub API 与 Pages 存在发布延迟，尚未生效时请稍后重新刷新。

图片来源：Wikimedia Commons，摄影 沈澄心、Xiaoding413，CC0。
