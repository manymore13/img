---
version: 2
styleProtocol: 1
stylesheet: ./style.css
id: lushan-jinxiu
title: 锦绣谷 · 庐山
label: 庐山 · 山行手册
---

```html mado
<view class="ls-guide ls-guide-remote">
  <view class="rm-masthead">
    <text class="rm-mast-name">庐山 · 山行手册</text>
  </view>
  <view class="rm-spot">
    <view class="rm-spot-head">
      <text class="ls-number">03</text>
      <text class="ls-tag">谷中观景</text>
    </view>
    <text class="ls-spot-name">锦绣谷</text>
    <text class="ls-summary">沿山谷步道看层叠山色，转角处留一点时间给云。</text>
    <text class="ls-meta">建议停留 60—90 分钟 · 中等 · 台阶与临崖路段</text>
    <view class="rm-story">
      <text class="ls-story-paragraph">锦绣谷的好看，常常发生在转弯之后。沿着山间步道往前，岩壁、树冠和远处的山脊轮流进入视野，像一幅不断舒展的长卷。晴时可以看山势的层次，云起时，远近又被轻轻遮住，只留下若隐若现的轮廓。</text>
      <text class="ls-story-paragraph">不妨在宽敞的观景位置停下来，等一阵风把云推开。山谷的名字让人想到锦绣，而它真正动人的地方，是光线和天气从不照着同一个样子重复。脚下的台阶也值得认真对待，慢一点走，才能把眼前的风景和自己的呼吸放在同一个节奏里。</text>
    </view>
    <button class="ls-button ls-primary" text="听讲解 · 约 1 分钟" action="play-audio" url="./audio/jinxiu.mp3" title="锦绣谷 · 讲解" />
    <text class="rm-note">语音为系统合成音，用于验证播放链路；真人录音到位后替换同名文件即可。</text>
    <view class="rm-safety">
      <text class="ls-tag">安全提示</text>
      <text class="rm-tip">临崖处不跨护栏，不为拍照靠近边缘。</text>
      <text class="rm-tip">台阶遇雨易滑；遇封闭或恶劣天气按现场指引折返。</text>
    </view>
  </view>
  <button class="ls-button ls-primary" text="下一站 · 仙人洞" action="navigate" page="spot-xianren.md" />
  <button class="back-here" text="返回上一层" action="back" />
  <text class="ls-foot">景点页属于当前栏目，用左上角返回或上面的按钮回去；底部 tab 始终可以切到另一栏。</text>
</view>
```
