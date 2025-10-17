# MoreIcon 组件

一个可复用的"更多操作"图标组件，使用 `useAssets` 组合式函数动态加载 SVG 图标资源。

## 特性

- ✅ 使用 `useAssets` 动态加载图标，解决静态资源路径问题
- ✅ 支持鼠标悬停和点击状态的视觉反馈
- ✅ 支持禁用状态
- ✅ 可自定义样式类名
- ✅ TypeScript 支持

## 使用方法

### 基本用法

```vue
<template>
  <MoreIcon />
</template>

<script setup>
import MoreIcon from '@/components/MoreIcon/index.vue';
</script>
```

### 自定义属性

```vue
<template>
  <MoreIcon 
    :size="32"
    alt="操作菜单"
    container-class="custom-container"
    icon-class="custom-icon"
    :disabled="false"
  />
</template>
```

## 属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| size | string \| number | 24 | 图标尺寸 |
| alt | string | 'More options' | 图片的 alt 属性 |
| containerClass | string | '' | 容器的自定义 CSS 类名 |
| iconClass | string | '' | 图标的自定义 CSS 类名 |
| disabled | boolean | false | 是否禁用 |

## 图标状态

组件会根据用户交互自动切换以下图标：

- **默认状态**: `more.svg`
- **悬停状态**: `more_hover.svg`  
- **激活状态**: `more_active.svg`

## 迁移指南

### 从 CSS 背景图片迁移

**之前的方式：**
```html
<span class="icon-more"></span>
```

```scss
.icon-more {
  background-image: var(--more-icon, url(@/assets/svg/more.svg));
  &:hover {
    background-image: var(--more-hover-icon, url(@/assets/svg/more_hover.svg));
  }
  &:active {
    background-image: var(--more-active-icon, url(@/assets/svg/more_active.svg));
  }
}
```

**现在的方式：**
```html
<MoreIcon />
```

### 优势

1. **更好的资源管理**: 使用 `useAssets` 统一处理静态资源路径
2. **更好的类型安全**: TypeScript 支持
3. **更灵活的状态管理**: 通过 Vue 响应式系统管理图标状态
4. **更好的可维护性**: 组件化的方式更易于维护和复用
5. **解决跨域问题**: 在 iframe 环境中能正确加载资源

## 注意事项

- 确保 `src/assets/svg/` 目录下存在对应的 SVG 文件
- 组件依赖 `@/composables/useAssets`，确保该组合式函数可用
- 如果 SVG 文件加载失败，组件会在控制台输出警告信息
