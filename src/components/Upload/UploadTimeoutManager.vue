<template>
  <div v-if="showTimeoutInfo" class="upload-timeout-info">
    <el-alert
      :title="timeoutInfoTitle"
      :description="timeoutInfoDesc"
      :type="speedTestFailed ? 'warning' : 'info'"
      :closable="false"
      show-icon>
      <template #default>
        <div class="timeout-details">
          <div class="timeout-item">
            <span class="label">{{ $t('uploadTimeout.estimatedUploadTime') }}</span>
            <span class="value">{{ estimatedTime }}</span>
          </div>
          <div class="timeout-item">
            <span class="label">{{ $t('uploadTimeout.timeoutLimit') }}</span>
            <span class="value">{{ timeoutLimit }}</span>
          </div>
          <div class="timeout-item">
            <span class="label">{{ $t('uploadTimeout.networkSuggestion') }}</span>
            <span class="value">{{ networkSuggestion }}</span>
          </div>
          <div v-if="networkSpeed > 0" class="timeout-item">
            <span class="label">{{ $t('uploadTimeout.currentNetworkSpeed') }}</span>
            <span class="value">{{ formatNetworkSpeed(networkSpeed) }}</span>
          </div>
        </div>
      </template>
    </el-alert>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { calculateTimeout } from '@/utils/uploadRequest';

const { t } = useI18n();

interface Props {
  fileSize: number;
  fileCount: number;
  showInfo?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showInfo: false,
});

// 网络速度测量相关
const networkSpeed = ref(0); // KB/s
const isSpeedTesting = ref(false);
const speedTestFailed = ref(false); // 记录测量是否失败

// 创建测试文件
const createTestFile = (sizeInKB: number): File => {
  // 创建指定大小的测试数据
  const testData = new Uint8Array(sizeInKB * 1024);
  // 填充一些随机数据以模拟真实文件
  for (let i = 0; i < testData.length; i++) {
    testData[i] = Math.floor(Math.random() * 256);
  }
  return new File([testData], 'speed-test.bin', { type: 'application/octet-stream' });
};

// 测量网络上传速度
const measureNetworkSpeed = async (): Promise<number> => {
  if (isSpeedTesting.value) return networkSpeed.value;
  
  isSpeedTesting.value = true;
  
  try {
    // 创建一个30KB的测试文件
    const testFile = createTestFile(30); // 30KB
    const formData = new FormData();
    formData.append('file', testFile);
    
    const startTime = performance.now();
    
    // 调用后端速度测试接口
    const response = await fetch('/api/doc/speed-test', {
      method: 'POST',
      body: formData,
      // 不设置 Content-Type，让浏览器自动设置 multipart/form-data
    });
    
    const endTime = performance.now();
    
    if (!response.ok) {
      throw new Error(`Speed test failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    // 计算上传速度
    const duration = (endTime - startTime) / 1000; // 转换为秒
    const fileSize = result.file_size || testFile.size; // 使用服务器返回的文件大小
    const speed = fileSize / duration / 1024; // KB/s
    
    networkSpeed.value = Math.max(speed, 0);
    return networkSpeed.value;
  } catch (error) {
    console.warn('Network speed measurement failed:', error);
    // 如果测量失败，使用默认值并标记失败状态
    networkSpeed.value = 1024; // 默认 1MB/s
    speedTestFailed.value = true;
    return networkSpeed.value;
  } finally {
    isSpeedTesting.value = false;
  }
};

// 格式化网络速度显示
const formatNetworkSpeed = (speed: number): string => {
  if (speed < 1024) {
    return `${Math.round(speed)} KB/s`;
  } else {
    return `${(speed / 1024).toFixed(1)} MB/s`;
  }
};

// 组件挂载时测量网速
onMounted(() => {
  if (props.showInfo) {
    speedTestFailed.value = false; // 重置失败状态
    measureNetworkSpeed();
  }
});

// 监听showInfo变化，重新测量网速
watch(() => props.showInfo, (newVal) => {
  if (newVal && networkSpeed.value === 0) {
    speedTestFailed.value = false; // 重置失败状态
    measureNetworkSpeed();
  }
});

const showTimeoutInfo = computed(() => {
  return props.showInfo && (props.fileSize > 50 * 1024 * 1024 || props.fileCount > 10);
});

const timeoutInfoTitle = computed(() => {
  if (props.fileSize > 100 * 1024 * 1024) {
    return t('uploadTimeout.largeFileUploadReminder');
  } else if (props.fileCount > 20) {
    return t('uploadTimeout.batchUploadReminder');
  }
  return t('uploadTimeout.uploadReminder');
});

const timeoutInfoDesc = computed(() => {
  if (speedTestFailed.value) {
    return t('uploadTimeout.speedTestFailed');
  }
  return t('uploadTimeout.timeoutDescription');
});

const estimatedTime = computed(() => {
  // 使用实际测量的网速或默认值
  const speedInBytesPerSecond = networkSpeed.value > 0 
    ? networkSpeed.value * 1024 // 转换为 bytes/s
    : 1024 * 1024; // 默认 1MB/s
  
  const totalSize = props.fileSize * props.fileCount;
  const seconds = Math.ceil(totalSize / speedInBytesPerSecond);
  
  if (seconds < 60) {
    return t('uploadTimeout.aboutSeconds', { seconds });
  } else if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60);
    return t('uploadTimeout.aboutMinutes', { minutes });
  } else {
    const hours = Math.ceil(seconds / 3600);
    return t('uploadTimeout.aboutHours', { hours });
  }
});

const timeoutLimit = computed(() => {
  const timeout = calculateTimeout(props.fileSize, props.fileCount);
  const minutes = Math.ceil(timeout / (60 * 1000));
  return t('uploadTimeout.minutes', { minutes });
});

const networkSuggestion = computed(() => {
  if (props.fileSize > 200 * 1024 * 1024) {
    return t('uploadTimeout.useWiredNetwork');
  } else if (props.fileCount > 50) {
    return t('uploadTimeout.batchUploadSuggestion');
  }
  return t('uploadTimeout.keepStableConnection');
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
