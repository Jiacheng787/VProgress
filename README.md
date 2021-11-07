# VProgress

A light-weight, high-performance lazy-load indicator for Single-Page Application.

## 什么是路由懒加载

在单页应用（SPA）中，为了提升页面首屏性能，经常会使用路由懒加载。

雅虎军规中有一个优化策略，就是把所有能打包的静态资源都打包成一个文件，例如 JS 、CSS 等。但是自从进入 HTTP/1.1 、HTTP/2 之后，TCP 协议层已经做了很大程度的优化，对于前端来说，请求数量不再是一个迫在眉睫的问题了。另一方面，现代前端工程的复杂度今非昔比，复杂的交互逻辑、繁重的第三方依赖，如果再将所有资源文件都打包在一起，那打包结果的体积将变得非常大，虽然请求数量得到了减少，但是资源的下载速度反而变得很慢，降低页面首屏性能，得不偿失。

> 例如，用户只希望访问博客首页，但是服务器把所有资源打包后的 JS 文件返回给他（包含四个页面），不仅浪费带宽，还导致浏览器加载了很多没用的 JS ，没有必要

而且如果所有资源都打包成一份文件，会导致无法利用缓存。假设有两个文件 A 和 B ，其中 A 文件很大且不需要频繁修改，B 文件很小但是需要经常改动。如果将 A 和 B 都打包为一份，当 B 文件修改之后，整个 chunk 生成了一个新的 hash ，浏览器就不得不放弃缓存重新加载资源，而 A 文件实际上并没有改，但却被重新加载，浪费带宽。

如果我们将 A 和 B 在构建阶段进行分包，生成两个 chunk ，A 文件直接在客户端设置永久缓存，这样 B 文件被修改后，浏览器只需加载 B 文件即可，对于 A 文件直接调用缓存中的资源，提升页面加载速度。

最理想的情况是，当用户访问一个页面，服务器只返回这个页面对应的资源。这种情况下，就需要用懒加载（也被称为按需加载）。

## 路由懒加载如何实现

路由懒加载是利用 Webpack 的分包规则实现的：

- Webpack 默认会对异步模块进行分包；
- 如果配置了多入口打包，Webpack 会对每个入口都生成一个 chunk ；
- 在 Webpack5 中支持 Runtime 单独打包；

路由懒加载实际上就利用了第一点，在定义路由时使用动态引入（dynamic import）语法，就可以实现基于路由的组件按需加载：

```js
// Vue 路由懒加载
{
  name: "Home",
  path: "/home",
  component: () => import("@/component/Home.vue")
}
// React 路由懒加载
{
  path: "/Home",
  component: React.lazy(() => import("@/component/Home.tsx"))
}
```

通过动态引入语法，由 Webpack 在构建阶段对模块进行分包，然后在运行时环境中，监听路由变化，发送网络请求加载相应模块。

## 路由懒加载存在的问题

路由懒加载优点很多，可以减小页面首屏需要加载的资源体积，也能充分利用缓存。但是由于懒加载需要进行网络请求，导致路由跳转会有一定延迟，特别是弱网环境下加载很慢，导致用户体验比较差。这种情况下，就需要在页面顶部展示一个进度条，搭配路由钩子提示用户加载进度。

## 路由懒加载进度条实现方案

首先说明一下，这个实际上是傻瓜式进度条，给用户心理安慰，但并不指示实际加载进度，仅仅只是播放一段动画，然后在加载完成后结束播放而已。如果你观察过微信 H5 的加载，你会发现如果页面迟迟未打开，进度条最终会停留在大约 90% 的位置。

实现进度条现有几种方案：

- 使用 `setTimeout` 模拟 `setInterval` 定时刷新；
- 使用 `requestAnimationFrame` 定时刷新；
- 使用 CSS 动画自动播放；

其中 `nprogress` 采用的是第一种方案，其实就是一个利用事件循环控制的递归；第二种方案的好处是动态刷新率，在页面滚动的时候不会出现掉帧的问题；第三种方案则彻底解放了 JS 线程，在前端框架中不会频繁触发组件渲染，动画连贯性比较好，但是难以通过 JS 控制加载过程。

前两种方案，都会存在一个最小刷新间隔，会让用户觉得卡顿，可以使用 CSS 的 `transition` 属性实现动画效果，让动画变得流畅。

> 有些人还觉得可以开启硬件加速，我个人觉得可用可不用，只要不阻塞 JS 线程就没太大问题（不然会影响页面交互事件）

## 技术选型

`nprogress` 最让人诟病的就是拼接 HTML 字符串，然后动态注入到 DOM 节点中。而且这个库也不怎么维护了，最近一次发布是在两年前。现在既然前端框架和 MVVM 这么火，为啥还要用以前的思路去解决问题呢？

本人最近有一段时间没有用 Vue 了，这段时间 Vue 可以说发生了天翻地覆的变化。

在 Vue 3.2 发布之后，`script setup` 和 CSS 变量注入两个提案（现在被称为 State-Driven Dynamic CSS）得到正式支持。其中 CSS 变量注入的提案，可以说在前端圈闹得沸沸扬扬，因为之前想要动态绑定样式，只能通过定义行内样式来实现，但是现在有了这个特性，让样式也可以像数据一样变成响应式了，相当的好用！

> 这个特性也只有 Vue SFC 能做得到，写 React 的同事只能在一旁羡慕了

由于进度条刚好需要动态绑定样式，于是打算用 CSS 变量注入试一下。但是这里有个问题，如果进度条通过 Vue 组件形式提供，这就没办法直接在路由钩子中使用，需要配合全局状态管理。这样的话问题就复杂了，对用户来说很麻烦，甚至有些项目可能就没用到状态管理。因此这边直接在内部实现了全局状态，向外暴露两个 api ，让用户可以在路由钩子中使用。

顺带提一下，Vue 3 还提供了一个特性 `<teleport>` 传送门，可以将模板中的 DOM 移动到组件之外。例如有一个深度嵌套的弹框，想相对页面进行绝对定位非常麻烦。如果使用 `<teleport>` 就可以让 DOM 移动到任意想要的位置，同时保持组件数据和样式绑定。看起来这边进度条也可以用哦，但是为啥不用呢？原因很简单，`<teleport>` 不能和 CSS 变量注入一起使用！CSS 变量注入的原理就是利用 CSS 变量，相应的变量将作为内联样式被注入到组件的根元素中，例如：

```html
<style>
  .text {
    color: var (--6b53742-color);
    font-size: var (--6b53742-theme_font_size);
  }
</style>
<div style="--6b53742-color:red;--6b53742-theme_font_size:2em;" class="text">
  hello
</div>
```

> 注入是响应式的 ——所以如果组件的属性发生变化，注入的 CSS 变量将被相应地更新。这种更新是独立于组件的模板更新的，所以对一个纯 CSS 的响应式属性的改变不会触发模板的重新渲染。

但是这里就存在一个问题，如果同时用 `<teleport>` 和 CSS 变量注入，CSS 变量确实会注入到组件的根元素中，但是由于内部的子元素被移动到了其他位置，导致变量获取不到了：

```html
<body>
  <div id="app">
    <!-- 组件根元素 -->
    <div style="--c55e1cb4-progress:50%; --c55e1cb4-theme_color:#79b8ff;"></div>
  </div>
  <!-- 组件内被 <teleport> 移动的子元素 -->
  <div class="progress-bar__container">
    <div class="progress-bar"></div>
  </div>
</body>
```

> 这个问题在 Vue 文档中并没有提到，也许 Vue 团队也没有注意到吧

这个特性不用也没关系，只要将进度条组件放在根组件 `App.vue` 中，然后使用 CSS 固定定位，就没问题。

## 技术细节

进度条的样式、CSS 动画，直接借鉴 GitHub ，进度刷新使用 `setTimeout` ，样式绑定采用 CSS 变量注入。

向外暴露三个模块：

```ts
import { ProgressBar, start, stop } from "VProgress";
```

其中 `ProgressBar` 是 Vue 组件，可以直接放在 `App.vue` 中：

```vue
<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue';
import { ProgressBar } from "VProgress";
</script>

<template>
  <HelloWorld msg="Hello Vue 3 + TypeScript + Vite" />
  <ProgressBar :height="4" color="#79b8ff" />
</template>
```

然后 `start` 和 `stop` 是用于启动和停止进度条的两个方法，放在路由钩子里面：

```js
import Vue from 'vue';
import Router from 'vue-router';
import { start, stop } from "VProgress";

Vue.use(Router);

const router = new Router({
  routes: []
})

router.beforeEach((to, from, next) => {
  // ...
  start();
  next();
})

router.afterEach((to, from) => {
  // ...
  stop();
})

export default router;
```