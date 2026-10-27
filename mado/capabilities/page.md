---
id: capabilities
title: 能力总览 · Mado
label: 能力总览
revision: "1"
version: 2
styleProtocol: 1
minEngine: "0.2"
featured: true
capabilities: wechat:button@1, wechat:input@1, wechat:switch@1
stylesheet: ./style.css
---

<view class="hero">
<text class="eyebrow">MADO · 一页之能</text>
<text class="title">这份页面，本身就是验收单</text>

看到的每一处版式、每一次点击与输入，都由同一份 Markdown 和 CSS 驱动。没有为演示单独写的模板。

<button class="primary" type="primary" bindtap="onStart">开始逐项验收</button>
</view>

## 一 · 文字与层级

### 三级标题

正文可以包含 **粗体**、*斜体*、~~删除线~~、`行内代码`，以及[链接](#一--文字与层级)。

> 引用块用来强调一段独立的判断。

- 无序列表第一项
- 无序列表第二项
  - 嵌套一层
1. 有序列表
2. 第二项

---

## 二 · 表格与代码

| 能力 | 状态 | 说明 |
| --- | --- | --- |
| 原生按钮 | 已接入 | 禁用、加载、主次样式 |
| 原生输入 | 已接入 | 值与事件回传 |
| 原生开关 | 已接入 | 布尔值变更 |
| 分块提交 | 已接入 | 顶层按块下发 |

```css
.card { border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,.08); }
```

## 三 · 原生控件

<view class="card">
<text class="card-title">按钮状态</text>

<button class="primary" type="primary" bindtap="onPrimaryTap">主要按钮 · 点击回显</button>

<button class="ghost" plain bindtap="onPlainTap">朴素按钮</button>

<button class="primary" type="primary" disabled>禁用状态不可点击</button>

<button class="primary" type="primary" loading>加载中状态</button>
</view>

<view class="card">
<text class="card-title">输入与开关</text>

<input class="field" placeholder="输入内容，下方会回显事件" maxlength="24" bindinput="onNameInput" bindblur="onNameBlur" />

<switch checked color="#2f6b5e" bindchange="onToggle" />

<view class="hint">输入与开关使用原生控件，事件先经代次与节点校验，再交给宿主。</view>
</view>

## 四 · 布局与视觉

<view class="grid">
<view class="tile tile-a">
<text class="tile-text">Flex 布局</text>
</view>

<view class="tile tile-b">
<text class="tile-text">圆角与阴影</text>
</view>

<view class="tile tile-c">
<text class="tile-text">渐变底色</text>
</view>
</view>

<view class="stack">
<view class="bar bar-1"></view>
<view class="bar bar-2"></view>
<view class="bar bar-3"></view>
</view>

## 五 · 动作与宿主

按钮点击不执行业务逻辑，只把动作名与参数交给接入应用：

<view class="actions">
<button class="ghost" action="open-service" service-id="cleaning">查看服务（动作）</button>
<button class="ghost" action="copy" text="复制这段说明" />
</view>

## 六 · 加载与恢复

页面加载失败时，容器不会清空已经显示的内容。下面这个按钮会让宿主主动请求一个不存在的地址：

<view class="actions">
<button class="ghost" action="load-broken">加载损坏页面</button>
</view>

<view class="hint">预期结果：底部出现错误码提示，当前这一页保持不变。这就是「失败保留旧页」的可观察证据。</view>

<view class="footnote">
未实现的能力不会在这里出现：媒体播放、表单作用域、catch/capture 传播、任意结构局部更新。
</view>
