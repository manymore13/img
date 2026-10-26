# Mado 示例页面（静态资源）

由 `npm run build:pages` 从本地 `examples/` 导出，供 Mado 页面引擎的微信小程序端远程加载。

- `showcase/` 节气专题（纯文本 + CSS）
- `donglin/` 东林大佛景点页（含 `images/` 与可下载的 `guide.md`）
- `basic/` 最小示例

小程序里把 `remoteBase` 指向本目录的 Pages 地址即可：

```
https://manymore13.github.io/img/mado/
```

每个示例目录里都是 `page.md` + `style.css`（+ `images/`），`page.md` 的 Front Matter 用 `stylesheet: ./style.css` 相对引用，图片用 `./images/xxx.jpg`，按目录整体移动不会断链。

图片来源：Wikimedia Commons，摄影 沈澄心、Xiaoding413，CC0。
