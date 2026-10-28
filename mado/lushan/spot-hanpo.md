---
version: 2
styleProtocol: 1
stylesheet: ./style.css
id: lushan-hanpo
title: 含鄱口 · 庐山
label: 庐山 · 山行手册
---

```html mado
<view class="ls-guide ls-guide-remote">
  <view class="rm-masthead">
    <text class="rm-mast-name">庐山 · 山行手册</text>
  </view>
  <view class="rm-spot">
    <view class="rm-spot-head">
      <text class="ls-number">05</text>
      <text class="ls-tag">远望鄱阳</text>
    </view>
    <text class="ls-spot-name">含鄱口</text>
    <text class="ls-summary">在开阔处望向鄱阳湖，等山与湖显出轮廓。</text>
    <text class="ls-meta">建议停留 30—60 分钟 · 中等 · 观景步行与台阶</text>
    <view class="rm-story">
      <text class="ls-story-paragraph">含鄱口的名字，把目光引向远处的鄱阳湖。站在开放的观景位置，山岭像一道道展开的屏风，天气通透时，可以朝湖的方向遥望。山与湖之间的距离，让眼前的空间显得格外辽阔，也提醒我们，庐山并不是一座孤立的山。</text>
      <text class="ls-story-paragraph">能看多远，要交给当时的云雾与能见度，不必把一次到访押在某个必然出现的画面上。即使远景暂时藏住，近处山脊的起伏也自有意味。带一件适合挡风的外层，在安全的位置站稳，给眼睛一点适应远方的时间，也给自己一点等待的耐心。</text>
    </view>
    <button class="ls-button ls-primary" text="听讲解 · 约 1 分钟" action="play-audio" url="./audio/hanpo.mp3" title="含鄱口 · 讲解" />
    <text class="rm-note">语音为系统合成音，用于验证播放链路；真人录音到位后替换同名文件即可。</text>
    <view class="rm-safety">
      <text class="ls-tag">安全提示</text>
      <text class="rm-tip">远眺鄱阳湖取决于能见度，不保证湖景或日出。</text>
      <text class="rm-tip">观景处注意风与保暖，不在未开放路段摸黑行走。</text>
    </view>
  </view>
  <button class="ls-button ls-primary" text="下一站 · 五老峰" action="navigate" page="spot-wulao.md" />
  <button class="back-here" text="返回上一层" action="back" />
  <text class="ls-foot">景点页属于当前栏目，用左上角返回或上面的按钮回去；底部 tab 始终可以切到另一栏。</text>
</view>
```
