<template>
  <div v-if="showTimeoutInfo" class="upload-timeout-info">
    <el-alert
      :title="timeoutInfoTitle"
      :description="timeoutInfoDesc"
      type="info"
      :closable="false"
      show-icon>
      <template #default>
        <div class="timeout-details">
          <div class="timeout-item">
            <span class="label">预计上传时间：</span>
            <span class="value">{{ estimatedTime }}</span>
          </div>
          <div class="timeout-item">
            <span class="label">超时限制：</span>
            <span class="value">{{ timeoutLimit }}</span>
          </div>
          <div class="timeout-item">
            <span class="label">网络建议：</span>
            <span class="value">{{ networkSuggestion }}</span>
          </div>
        </div>
      </template>
    </el-alert>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { calculateTimeout } from '@/utils/uploadRequest';

interface Props {
  fileSize: number;
  fileCount: number;
  showInfo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showInfo: false,
});

const showTimeoutInfo = computed(() => {
  return props.showInfo && (props.fileSize > 50 * 1024 * 1024 || props.fileCount > 10);
});

const timeoutInfoTitle = computed(() => {
  if (props.fileSize > 100 * 1024 * 1024) {
    return '大文件上传提醒';
  } else if (props.fileCount > 20) {
    return '批量上传提醒';
  }
  return '上传提醒';
});

const timeoutInfoDesc = computed(() => {
  return '系统已为您的上传任务设置了智能超时时间，请保持网络连接稳定。';
});

const estimatedTime = computed(() => {
  // 基于文件大小估算上传时间（假设平均网速 1MB/s）
  const avgSpeed = 1024 * 1024; // 1MB/s
  const totalSize = props.fileSize * props.fileCount;
  const seconds = Math.ceil(totalSize / avgSpeed);
  
  if (seconds < 60) {
    return `约 ${seconds} 秒`;
  } else if (seconds < 3600) {
    return `约 ${Math.ceil(seconds / 60)} 分钟`;
  } else {
    return `约 ${Math.ceil(seconds / 3600)} 小时`;
  }
});

const timeoutLimit = computed(() => {
  const timeout = calculateTimeout(props.fileSize, props.fileCount);
  const minutes = Math.ceil(timeout / (60 * 1000));
  return `${minutes} 分钟`;
});

const networkSuggestion = computed(() => {
  if (props.fileSize > 200 * 1024 * 1024) {
    return '建议使用有线网络或稳定的WiFi';
  } else if (props.fileCount > 50) {
    return '建议分批上传，每批不超过30个文件';
  }
  return '保持网络连接稳定';
});
</script>

<style lang="scss" scoped>
.upload-timeout-info {
  margin-bottom: 16px;
  
  .timeout-details {
    margin-top: 8px;
    
    .timeout-item {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
      font-size: 12px;
      
      .label {
        color: var(--o-text-color-secondary);
        min-width: 80px;
      }
      
      .value {
        color: var(--o-text-color-primary);
        font-weight: 500;
      }
    }
  }
}

:deep(.el-alert__content) {
  flex: 1;
}

:deep(.el-alert__description) {
  margin: 8px 0;
  font-size: 12px;
}
</style>
