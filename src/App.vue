<template>
  <el-config-provider :locale="locale">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import { useAppStore } from '@/store';
const appStore = useAppStore();
import '@/styles/app.scss';
import router from './router';

const locale = computed(() => appStore.locale);

onMounted(() => {
  window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('beforeunload', '1');
  });
  // 监听页面刷新
  const beforeUnload = sessionStorage.getItem('beforeunload');
  if (beforeUnload === '1') {
    const name = sessionStorage.getItem('routerName');
    if (name) {
      router.push(name); // 如果sessionStorage存在路由，去缓存的路由
    } else {
      router.push('/'); // 不存在存储，去主页
    }
    sessionStorage.removeItem('beforeunload'); // 清除标记
  }
});
</script>

<style lang="scss"></style>
