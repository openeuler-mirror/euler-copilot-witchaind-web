<template>
  <el-affix
    target=".main-container"
    :offset="0">
    <!-- 因嵌入copilot页面暂时注释 -->
    <!-- <el-header class="platform-header">
      <span class="platform-title">
        <img src="/src/assets/svg/euler_copilot_logo.svg" />
        <h4>witChainD</h4>
      </span>
      <div class="top-bar">
        <lang-select class="ml-2 cursor-pointer" />
        <el-icon class="helpCicle">
          <IconHelpCircle />
        </el-icon>
      </div>
    </el-header> -->
  </el-affix>
</template>

<script setup lang="ts">
// 内部依赖
import '@/styles/headerBar.scss';
</script>

<style lang="scss">
.top-bar {
  .helpCicle {
    font-size: 24px;
    color: rgb(141 152 170);
    margin-left: 16px;
  }
}
</style>
