---
id: solar-terms
title: 节气行 · 山里的朱砂先红了
revision: "2026-10-08"
styleProtocol: 1
stylesheet: ./style.css
---

```html mado
<view class="hero">
  <view class="hero-badge">
    <text class="hero-badge-text">寒露</text>
  </view>
  <text class="hero-kicker">十月八日　寒露　·　二十四节气第十七</text>
  <view class="hero-line">
    <text class="hero-word">山里的</text>
    <text class="hero-word hero-accent">朱砂</text>
  </view>
  <view class="hero-line">
    <text class="hero-word">先红了</text>
  </view>
  <text class="hero-lead">每个节气走一条山路，记下那一周山里的颜色。寒露的红，在三百米海拔以上最先到。</text>
  <button class="hero-button" text="看这周的路线" action="open-route" trail="fengxiang" />
</view>
```

```html mado
<view class="card">
  <view class="card-head">
    <text class="card-label">本周推荐</text>
    <text class="card-label">难度 ★★☆</text>
  </view>
  <text class="card-title">枫香谷　环线</text>
  <view class="card-strip">
    <view class="strip-cell c-17"></view>
    <view class="strip-cell c-16"></view>
    <view class="strip-cell c-18"></view>
    <view class="strip-cell c-14"></view>
  </view>
  <view class="card-figures">
    <view class="figure">
      <text class="figure-value">11.4</text>
      <text class="figure-label">公里</text>
    </view>
    <view class="figure">
      <text class="figure-value">5h</text>
      <text class="figure-label">含午休</text>
    </view>
    <view class="figure">
      <text class="figure-value">620</text>
      <text class="figure-label">爬升米</text>
    </view>
  </view>
</view>
```

## 这一周，山里在变色

寒露前后，山脊线上的灌木先红。**不是枫香，是那些叫不出名字的**——盐肤木、乌桕、还有几种连护林员也说不清的小乔木。

走到三百米以上，颜色开始分层：

- 三百米以下：还是绿的，只在叶尖有一点黄
- 三百到六百米：红得最杂，朱砂、赭石、琥珀混在一起
- 六百米以上：只剩黛色和鸦青，红已经过去了

## 二十四节气色谱

一年二十四种颜色，每周只有一种是对的。这一周是第十七格。

```html mado
<view class="swatches">
  <view class="swatch c-01">
    <text class="swatch-term">立春</text>
    <text class="swatch-color">缥碧</text>
  </view>
  <view class="swatch c-02">
    <text class="swatch-term">雨水</text>
    <text class="swatch-color">柳染</text>
  </view>
  <view class="swatch c-03">
    <text class="swatch-term">惊蛰</text>
    <text class="swatch-color">豆青</text>
  </view>
  <view class="swatch c-04">
    <text class="swatch-term">春分</text>
    <text class="swatch-color">桃夭</text>
  </view>
  <view class="swatch c-05">
    <text class="swatch-term">清明</text>
    <text class="swatch-color">竹青</text>
  </view>
  <view class="swatch c-06">
    <text class="swatch-term">谷雨</text>
    <text class="swatch-color">天水碧</text>
  </view>
  <view class="swatch c-07">
    <text class="swatch-term">立夏</text>
    <text class="swatch-color">松石绿</text>
  </view>
  <view class="swatch c-08">
    <text class="swatch-term">小满</text>
    <text class="swatch-color">缃叶</text>
  </view>
  <view class="swatch c-09">
    <text class="swatch-term">芒种</text>
    <text class="swatch-color">藤黄</text>
  </view>
  <view class="swatch c-10">
    <text class="swatch-term">夏至</text>
    <text class="swatch-color">石青</text>
  </view>
  <view class="swatch c-11">
    <text class="swatch-term">小暑</text>
    <text class="swatch-color">月白</text>
  </view>
  <view class="swatch c-12">
    <text class="swatch-term">大暑</text>
    <text class="swatch-color">荷花红</text>
  </view>
  <view class="swatch c-13">
    <text class="swatch-term">立秋</text>
    <text class="swatch-color">秋香</text>
  </view>
  <view class="swatch c-14">
    <text class="swatch-term">处暑</text>
    <text class="swatch-color">杏黄</text>
  </view>
  <view class="swatch c-15">
    <text class="swatch-term">白露</text>
    <text class="swatch-color">缟</text>
  </view>
  <view class="swatch c-16">
    <text class="swatch-term">秋分</text>
    <text class="swatch-color">琥珀</text>
  </view>
  <view class="swatch c-17 swatch-current">
    <text class="swatch-term">寒露</text>
    <text class="swatch-color">朱砂</text>
  </view>
  <view class="swatch c-18">
    <text class="swatch-term">霜降</text>
    <text class="swatch-color">赭石</text>
  </view>
  <view class="swatch c-19">
    <text class="swatch-term">立冬</text>
    <text class="swatch-color">黛</text>
  </view>
  <view class="swatch c-20">
    <text class="swatch-term">小雪</text>
    <text class="swatch-color">鸦青</text>
  </view>
  <view class="swatch c-21">
    <text class="swatch-term">大雪</text>
    <text class="swatch-color">素</text>
  </view>
  <view class="swatch c-22">
    <text class="swatch-term">冬至</text>
    <text class="swatch-color">墨</text>
  </view>
  <view class="swatch c-23">
    <text class="swatch-term">小寒</text>
    <text class="swatch-color">靛青</text>
  </view>
  <view class="swatch c-24">
    <text class="swatch-term">大寒</text>
    <text class="swatch-color">苍</text>
  </view>
</view>
```

## 路线明细

| 路段 | 距离 | 用时 |
| --- | --- | --- |
| 谷口 → 石门坳 | 4.2 km | 1h40 |
| 石门坳 → 枫香坪 | 3.1 km | 2h10 |
| 枫香坪 → 谷口 | 4.1 km | 1h10 |

## 要带的东西

- 一双抓地好的鞋，最后一段是碎石坡
- 1.5 升水，全程没有补给点
- 一件防风外套，垭口的风比山下低五度
- 充电宝，山上没有信号也没有插座

## 出发之前

1. 七点前从谷口出发，晚了会在石门坳晒到正午的太阳。
2. 全程没有信号，提前把路线图存到本地。
3. 枫香坪可以休息，但不建议生火，落叶太厚。
4. 雨后两天不要走，碎石坡会滑。

> 山里红得最早的不是枫香，是那些叫不出名字的灌木。等枫香红透了，最好的时候其实已经过去了。 —— 老周，护林员，在枫香谷走了二十九年

## 导航坐标

```
起点　枫香谷口　　30.2412 N, 118.5731 E
高点　石门坳　　　842 m
补给　无
下撤　枫香坪　　　有土路通谷口
```

```html mado
<view class="cta">
  <text class="cta-title">下一条路线：霜降 · 石门坳</text>
  <text class="cta-note">十月二十三日出发，限十二人。走完这一周，山就换了颜色。</text>
  <view class="cta-actions">
    <button class="cta-button" text="报名这一期" action="signup" trail="shimen" season="frost" />
    <button class="cta-ghost" text="看全部路线" action="all-routes" />
  </view>
</view>
```

```html mado
<view class="footer">
  <text class="footer-line">节气行　·　每周一条山路，记一周的颜色</text>
  <text class="footer-line">设计语言取自 huashu-design「中国传统色 · 节气色谱」样张（MIT），配色沿用其色谱，内容与数据为演示虚构。</text>
</view>
```
