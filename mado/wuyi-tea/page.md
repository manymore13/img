---
version: 1
id: wuyi-tea
title: 武夷山金骏眉 · 商品详情
label: 武夷山金骏眉
description: 商品详情长页复刻：固定底图、参数表、视频卡、三段图文横幅、三图网格、客服卡与固定底栏。
revision: "2026-10-28"
styleProtocol: 1
stylesheet: ./style.css
---

```html mado
<view class="page">
  <image class="bg" src="./images/bg.jpg" alt="" />

  <view class="body">

    <view class="hero">
      <text class="hero-title">武夷山金骏眉</text>
      <text class="hero-sub">悠长东方味 武夷金骏眉</text>
      <text class="hero-sub">每一叶，都是武夷山的天赐馈赠</text>
      <view class="hero-price">
        <text class="price-label">建议零售价：</text>
        <text class="price-num">1198</text>
        <text class="price-unit">元</text>
      </view>
    </view>

    <view class="spec">
      <view class="spec-row">
        <text class="spec-key">品名</text>
        <text class="spec-val">金骏眉</text>
      </view>
      <view class="spec-row">
        <text class="spec-key">配料</text>
        <text class="spec-val">茶鲜叶</text>
      </view>
      <view class="spec-row">
        <text class="spec-key">产地</text>
        <text class="spec-val">武夷山</text>
      </view>
      <view class="spec-row">
        <text class="spec-key">净含量</text>
        <text class="spec-val">500g</text>
      </view>
      <view class="spec-row">
        <text class="spec-key">生产日期</text>
        <text class="spec-val">2023/03/01</text>
      </view>
      <view class="spec-row">
        <text class="spec-key">保质期</text>
        <text class="spec-val">36个月</text>
      </view>
      <view class="spec-row">
        <text class="spec-key">执行标准</text>
        <text class="spec-val">DB35/T1228-2015</text>
      </view>
      <view class="spec-row">
        <text class="spec-key">生产许可</text>
        <text class="spec-val">SC11435078208413</text>
      </view>
      <view class="spec-row">
        <text class="spec-key">委托生产</text>
        <text class="spec-val">福建省武夷山市常青茶叶有限公司</text>
      </view>
      <view class="spec-row spec-row-link">
        <text class="spec-key">生产地址</text>
        <text class="spec-val">武夷山市仙店工业园区</text>
        <button class="spec-hit" text=" " action="open-location" name="武夷山市仙店工业园区" address="福建省南平市武夷山市仙店工业园区" lat="27.7565" lng="118.0353" />
      </view>
      <view class="spec-row spec-row-end">
        <text class="spec-key">贮存方式</text>
        <text class="spec-val">常温、避光、干燥、密封保存</text>
      </view>
    </view>

    <view class="video">
      <image class="video-poster" src="./images/poster.jpg" alt="武夷山原产金骏眉 花果馥郁 香浓耐泡" />
      <button class="video-hit" text=" " action="play-video" title="武夷山原产金骏眉" url="https://manymore13.github.io/img/mado/wuyi-tea/images/tea.mp4" />
    </view>

    <view class="band band-a">
      <image class="band-img" src="./images/band1.jpg" alt="" />
      <text class="band-title">高山生态茶园</text>
      <text class="band-sub">核心原产地 绝对纯正</text>
    </view>
    <view class="photo-wrap">
      <image class="photo photo-garden" src="./images/garden.jpg" alt="武夷山高山生态茶园" />
      <button class="photo-hit" text=" " action="preview-image" src="./images/garden.jpg" />
    </view>

    <view class="band band-b">
      <image class="band-img" src="./images/band2.jpg" alt="" />
      <text class="band-title">甄选原叶</text>
      <text class="band-title">出好茶</text>
      <text class="band-sub">细心甄选 给您最好的体验</text>
    </view>
    <view class="photo-wrap">
      <image class="photo photo-leaves" src="./images/leaves.jpg" alt="甄选的茶鲜叶" />
      <button class="photo-hit" text=" " action="preview-image" src="./images/leaves.jpg" />
    </view>

    <view class="band band-c">
      <image class="band-img" src="./images/band3.jpg" alt="" />
      <text class="band-title">三大标准</text>
      <text class="band-title">只为做好茶</text>
      <text class="band-sub">优质原料 手工技艺 纯正滋味</text>
      <text class="band-sub">只为带给你这一杯好茶</text>
    </view>

    <view class="craft">
      <view class="craft-item">
        <view class="craft-shot">
          <image class="craft-img" src="./images/pick.jpg" alt="人工采摘" />
          <button class="craft-hit" text=" " action="preview-image" src="./images/pick.jpg" />
        </view>
        <text class="craft-cap">人工采摘</text>
      </view>
      <view class="craft-item">
        <view class="craft-shot">
          <image class="craft-img" src="./images/roast.jpg" alt="匠心炒制" />
          <button class="craft-hit" text=" " action="preview-image" src="./images/roast.jpg" />
        </view>
        <text class="craft-cap">匠心炒制</text>
      </view>
      <view class="craft-item">
        <view class="craft-shot">
          <image class="craft-img" src="./images/store.jpg" alt="保鲜封存" />
          <button class="craft-hit" text=" " action="preview-image" src="./images/store.jpg" />
        </view>
        <text class="craft-cap">保鲜封存</text>
      </view>
    </view>

    <view class="contact">
      <text class="contact-title">客户服务</text>
      <text class="contact-desc">购茶、品茶、售后服务</text>

      <view class="contact-row">
        <view class="contact-left">
          <text class="phone-mark">☎</text>
          <text class="contact-text">18800008888</text>
        </view>
        <view class="act">
          <text class="act-text">打电话</text>
          <button class="act-hit" text=" " action="call" number="18800008888" />
        </view>
      </view>

      <view class="contact-row">
        <view class="contact-left">
          <view class="pin"></view>
          <text class="contact-text">世纪茶城</text>
        </view>
        <view class="act">
          <text class="act-text">去导航</text>
          <button class="act-hit" text=" " action="open-location" name="世纪茶城" />
        </view>
      </view>
    </view>
  </view>

  <view class="bar">
    <view class="bar-item">
      <text class="bar-icon">☆</text>
      <text class="bar-label">收藏</text>
      <button class="bar-hit" text=" " action="collect" />
    </view>
    <view class="bar-item">
      <text class="bar-icon">↗</text>
      <text class="bar-label">分享</text>
      <button class="bar-hit" text=" " action="share" />
    </view>
    <view class="bar-item">
      <text class="bar-icon">≡</text>
      <text class="bar-label">更多</text>
      <button class="bar-hit" text=" " action="more" />
    </view>
  </view>
</view>
```
