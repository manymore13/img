---
version: 2
styleProtocol: 1
stylesheet: ./style.css
id: lushan-ruqin
title: 如琴湖 · 庐山
label: 庐山 · 山行手册
---

```html mado
<view class="ls-guide ls-guide-remote">
  <view class="rm-masthead">
    <text class="rm-mast-name">庐山 · 山行手册</text>
  </view>
  <view class="rm-spot">
    <view class="rm-spot-head">
      <text class="ls-number">01</text>
      <text class="ls-tag">湖光慢行</text>
    </view>
    <text class="ls-spot-name">如琴湖</text>
    <text class="ls-summary">沿着湖岸放慢脚步，把水色与山影收入眼底。</text>
    <text class="ls-meta">建议停留 30—60 分钟 · 轻松 · 依体力选择湖岸路段</text>
    <view class="rm-story">
      <text class="ls-story-paragraph">来到如琴湖，先别急着寻找最好的拍照位置。湖岸曲折，水面像一张安静展开的琴，山影和树影便是落在琴上的音符。风过时，细小的波纹把倒影轻轻拨散，云停下来，湖面又慢慢恢复平静。</text>
      <text class="ls-story-paragraph">你可以挑一段湖岸缓缓走，听脚步、鸟声和树叶彼此应答。这里适合作为山行的开场，也适合在行程中途坐一坐。庐山的美不只在高处远望，有时也藏在一片离自己很近的水光里。把相机放低一会儿，让眼睛先记住此刻的颜色。</text>
    </view>
    <button class="ls-button ls-primary" text="听讲解 · 约 1 分钟" action="play-audio" url="./audio/ruqin.mp3" title="如琴湖 · 讲解" />
    <text class="rm-note">语音为系统合成音，用于验证播放链路；真人录音到位后替换同名文件即可。</text>
    <view class="rm-safety">
      <text class="ls-tag">安全提示</text>
      <text class="rm-tip">沿开放湖岸游览，不翻越护栏或下水。</text>
      <text class="rm-tip">湖边遇雨可能湿滑，停留拍照时留意来往行人。</text>
    </view>
  </view>
  <button class="ls-button ls-primary" text="下一站 · 花径" action="navigate" page="spot-huajing.md" />
  <button class="back-here" text="返回上一层" action="back" />
  <text class="ls-foot">景点页属于当前栏目，用左上角返回或上面的按钮回去；底部 tab 始终可以切到另一栏。</text>
</view>
```
