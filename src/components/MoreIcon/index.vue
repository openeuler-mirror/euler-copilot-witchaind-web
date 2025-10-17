<template>
  <div class="more-icon-container" :class="containerClass">
    <img 
      :src="currentIconSrc" 
      :alt="alt"
      :class="iconClass"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
      @blur="handleBlur"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAssets } from '@/composables/useAssets';

interface Props {
  size?: string | number;
  alt?: string;
  containerClass?: string;
  iconClass?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  alt: 'More options',
  containerClass: '',
  iconClass: '',
  disabled: false
});

const { getSvgUrl } = useAssets();

// 状态管理
const isHovered = ref(false);
const isPressed = ref(false);

// 图标路径
const normalIconSrc = ref('');
const hoverIconSrc = ref('');
const activeIconSrc = ref('');

// 当前显示的图标
const currentIconSrc = computed(() => {
  if (props.disabled) return normalIconSrc.value;
  if (isPressed.value) return activeIconSrc.value;
  if (isHovered.value) return hoverIconSrc.value;
  return normalIconSrc.value;
});

// 事件处理
const handleMouseEnter = () => {
  if (!props.disabled) {
    isHovered.value = true;
  }
};

const handleMouseLeave = () => {
  isHovered.value = false;
  isPressed.value = false;
};

const handleMouseDown = () => {
  if (!props.disabled) {
    isPressed.value = true;
  }
};

const handleMouseUp = () => {
  isPressed.value = false;
};

const handleBlur = () => {
  isPressed.value = false;
};

// 初始化图标路径
onMounted(() => {
  try {
    normalIconSrc.value = getSvgUrl('more.svg');
    hoverIconSrc.value = getSvgUrl('more_hover.svg');
    activeIconSrc.value = getSvgUrl('more_active.svg');
  } catch (error) {
    console.warn('Failed to load more icon assets:', error);
    // 回退到默认图标或者空白
    normalIconSrc.value = '';
    hoverIconSrc.value = '';
    activeIconSrc.value = '';
  }
});
</script>

<style scoped>
.more-icon-container {
  display: inline-block;
  cursor: pointer;
  height: 24px;
}

.more-icon-container img {
  display: block;
  width: 24px;
  height: 24px;
  object-fit: contain;
  transition: opacity 0.2s ease;
}

.more-icon-container.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.more-icon-container.disabled img {
  pointer-events: none;
}
</style>
