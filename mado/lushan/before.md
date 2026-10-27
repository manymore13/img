---
version: 2
styleProtocol: 1
stylesheet: ./style.css
id: lushan-before
title: 庐山 · 准备好了吗
label: 庐山 · 山行手册
---

<view class="ls-guide ls-guide-remote">

<view class="rm-masthead">

<text class="rm-mast-name">庐山 · 山行手册</text>

</view>

<view class="ls-section-heading">

<text class="ls-kicker">BEFORE YOU GO</text>

<text class="ls-heading">准备好，再去山里</text>

<text class="ls-muted">上山前十分钟，把这些过一遍。</text>

</view>

<view class="ls-checklist">

<text class="ls-kicker">出发前逐项确认</text>

<text class="ls-body">勾选会记在这台手机上，换页面回来还在。</text>

<view class="rm-item">

<switch class="rm-switch" id="shoes" bindchange="persistCheck" />

<text class="rm-item-text">穿防滑鞋，确认鞋底与脚感</text>

</view>

<view class="rm-item">

<switch class="rm-switch" id="layers" bindchange="persistCheck" />

<text class="rm-item-text">备好外层衣物与雨具</text>

</view>

<view class="rm-item">

<switch class="rm-switch" id="water" bindchange="persistCheck" />

<text class="rm-item-text">带饮水与适量补给</text>

</view>

<view class="rm-item">

<switch class="rm-switch" id="power" bindchange="persistCheck" />

<text class="rm-item-text">手机充电，备好充电宝与离线资料</text>

</view>

<view class="rm-item">

<switch class="rm-switch" id="booking" bindchange="persistCheck" />

<text class="rm-item-text">核对预约、票务与开放公告</text>

</view>

<view class="rm-item">

<switch class="rm-switch" id="return" bindchange="persistCheck" />

<text class="rm-item-text">确认接驳、返程与同行集合安排</text>

</view>

</view>

<view class="rm-download">

<text class="ls-kicker">OFFLINE COPY</text>

<text class="ls-heading">把这一本带走</text>

<text class="ls-body">下载完整读本，包含三条路线、八处讲解和安全提示，可以转发给同行的人。</text>

<button class="ls-button ls-primary" text="下载离线读本" action="download-guide" file="lushan-guide.md" name="庐山-山行手册.md" />

<text class="rm-note">页面打开时已经在后台取回，点击后只等写文件；不支持转发时会复制全文。</text>

</view>

<view class="ls-sources">

<text class="ls-kicker">SOURCES</text>

<text class="ls-heading">资料来源</text>

[UNESCO 世界遗产名录：庐山国家公园](https://whc.unesco.org/en/list/778/)

[庐山旅游信息参考（出行前请核对更新）](https://www.lushan.gov.cn/bmxzxxgk/bumeng/whgdxwcbj/fdzdgknr_195359/lvyou/202512/t20251231_7134056.html)

[游览参考文章（非官方，信息需交叉核对）](https://m.toutiao.com/article/7473790593479475723/)

<text class="rm-note">点击链接会复制地址。票价、开放范围、接驳与天气以出行当天公告为准。</text>

</view>

</view>