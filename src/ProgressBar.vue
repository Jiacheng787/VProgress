<!--
  这个进度条是通过 Vue 组件的形式提供的
  但是如果组件形式，没办法直接在路由钩子中使用，需要配合全局状态管理
  这样对用户来说很麻烦，有些项目可能就没有用到状态管理
  因此这边在内部实现了一套事件机制，暴露出两个 api ，让用户可以在路由钩子中使用
-->

<template>
  <div class="progress-bar__container">
    <div class="progress-bar"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "@vue/reactivity";
import { state } from "./store";
// TODO: script setup 中的 defineProps 如何定义默认值
const props = defineProps<{
  height?: number;
  // color?: string;
}>();

const height = computed(() => props.height || 8);
// const color = computed(() => props.color || "#79b8ff");
</script>

<style scoped>
.progress-bar__container {
  position: fixed;
  top: 0;
  z-index: 99999;
  height: v-bind("height + 'px'");
  width: 100%;
  overflow: hidden;
  background: transparent;
  opacity: v-bind("state.start ? 1 : 0");
  transition: opacity 0.4s linear 0.4s;
}
.progress-bar {
  height: 100%;
  width: v-bind("state.amount + '%'");
  transition: width 0.4s ease 0s;
  background-image: linear-gradient(139deg, #fb8817, #ff4b01, #c12127, #e02aff);
  /* background-color: v-bind(color); */
}
</style>