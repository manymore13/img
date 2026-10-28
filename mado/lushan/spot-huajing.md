---
version: 2
styleProtocol: 1
stylesheet: ./style.css
id: lushan-huajing
title: 花径 · 庐山
label: 庐山 · 山行手册
---

```html mado
<view class="ls-guide ls-guide-remote">
  <view class="rm-masthead">
    <text class="rm-mast-name">庐山 · 山行手册</text>
  </view>
  <view class="rm-spot">
    <view class="rm-spot-head">
      <text class="ls-number">02</text>
      <text class="ls-tag">诗意园林</text>
    </view>
    <text class="ls-spot-name">花径</text>
    <text class="ls-summary">循着白居易的诗意，在花木与园路之间停一停。</text>
    <text class="ls-meta">建议停留 30—45 分钟 · 轻松 · 园路漫游</text>
    <view class="rm-story">
      <text class="ls-story-paragraph">走进花径，可以想起白居易写下的那句诗：人间四月芳菲尽，山寺桃花始盛开。山地的高低，让花期有了不同的节奏，也让一次寻常的行走，生出意外相逢的欢喜。眼前的园路与花木，适合用这样的心情慢慢观看。</text>
      <text class="ls-story-paragraph">这里承载着人们对诗意庐山的想象，但不宜据此把花径说成大林寺的原址。与其急着替每一处景物寻找唯一的答案，不如留意转弯后的一片树荫、一阵花香。花未开时也不必遗憾，山中的季节，总有自己的安排。</text>
    </view>
    <button class="ls-button ls-primary" text="听讲解 · 约 1 分钟" action="play-audio" url="./audio/huajing.mp3" title="花径 · 讲解" />
    <text class="rm-note">语音为系统合成音，用于验证播放链路；真人录音到位后替换同名文件即可。</text>
    <view class="rm-safety">
      <text class="ls-tag">安全提示</text>
      <text class="rm-tip">花期随季节与气候变化，不保证到访时有花。</text>
      <text class="rm-tip">爱护花木，沿开放园路行走。</text>
    </view>
  </view>
  <button class="ls-button ls-primary" text="下一站 · 芦林湖" action="navigate" page="spot-lulin.md" />
  <button class="back-here" text="返回上一层" action="back" />
  <text class="ls-foot">景点页属于当前栏目，用左上角返回或上面的按钮回去；底部 tab 始终可以切到另一栏。</text>
</view>
```
