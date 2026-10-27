---
version: 2
styleProtocol: 1
stylesheet: ./style.css
id: lushan-order
title: 庐山 · 游览顺序
label: 庐山 · 山行手册
---

<view class="ls-guide ls-guide-remote">

<view class="rm-masthead">

<text class="rm-mast-name">庐山 · 山行手册</text>

</view>

<view class="ls-section-heading">

<text class="ls-kicker">ORDER</text>

<text class="ls-heading">先到哪，后到哪</text>

<text class="ls-muted">这是游览顺序示意，不是地图，也不提供导航；山上的路以现场指示牌为准。</text>

</view>

<view class="rm-route-chain">

<text class="ls-kicker">湖畔慢游</text>

<text class="rm-chain">如琴湖  →  花径  →  芦林湖</text>

</view>

<view class="rm-route-chain">

<text class="ls-kicker">西线寻景</text>

<text class="rm-chain">如琴湖  →  花径  →  锦绣谷  →  仙人洞</text>

</view>

<view class="rm-route-chain">

<text class="ls-kicker">东线问山</text>

<text class="rm-chain">含鄱口  →  五老峰  →  三叠泉</text>

</view>

<text class="ls-body">西线靠湖边，坡度缓，适合把节奏放慢；东线绕到山巅，看云与湖；三叠泉在谷底，台阶多，留足返程体力。三条线不建议同一天硬走。</text>

<view class="rm-video">

<text class="ls-kicker">VIDEO · 播放器样例</text>

<text class="ls-heading">点一下，看看视频能不能放</text>

<text class="ls-body">这是公开的演示视频，用来验证小程序的视频播放链路；它不是庐山实景。真实景点视频等你提供素材后替换即可。</text>

<button class="ls-button ls-primary" text="播放示例视频" action="play-video" url="https://qiniu-web-assets.dcloud.net.cn/unidoc/zh/2minute-demo.mp4" title="演示视频（非庐山实景）" />

<text class="rm-note">视频需要在小程序后台把域名加入 downloadFile 合法域名；开发者工具勾选「不校验合法域名」可直接预览。</text>

</view>

<button class="back-here" text="看三条路线的细节" action="switch-tab" tab="routes" />

</view>