import { reactive } from 'vue';

// 加载进度从 15% 开始，每次增加 3%
// 当加载结束，直接到 100%
export const state = reactive({
  start: false, // 显示、隐藏进度条
  amount: 0, // 当前进度百分比
})

const run = () => {
  // 进度达到 90% 即停止
  if (state.amount >= 90) return;
  setTimeout(() => {
    // 每次增加 3%
    state.amount = state.amount + 3;
    run();
  }, 500)
}

export const start = () => {
  // 初始进度设为 15%
  state.amount = 15;
  // 显示进度条
  state.start = true;
  run();
}

export const stop = () => {
  // 加载结束直接到 100% ，顺便结束调用 run 方法
  state.amount = 100;
  // 隐藏进度条
  state.start = false;
}
