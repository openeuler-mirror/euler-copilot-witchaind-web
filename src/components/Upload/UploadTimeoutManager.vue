<template>
  <div v-if="showUploadInfo" class="upload-info">
    <el-alert
      :title="uploadInfoTitle"
      :description="uploadInfoDesc"
      :type="speedTestFailed ? 'warning' : 'info'"
      :closable="false"
      show-icon>
      <template #default>
        <div class="upload-details">
          <div class="upload-item">
            <span class="label">{{ $t('uploadTimeout.estimatedUploadTime') }}</span>
            <span class="value">{{ estimatedTime }}</span>
          </div>
          <div v-if="networkSpeed > 0" class="upload-item">
            <span class="label">{{ $t('uploadTimeout.currentNetworkSpeed') }}</span>
            <span class="value">{{ formatNetworkSpeed(networkSpeed) }}</span>
          </div>
          <div class="upload-item">
            <span class="label">{{ $t('uploadTimeout.networkSuggestion') }}</span>
            <span class="value">{{ networkSuggestion }}</span>
          </div>
        </div>
      </template>
    </el-alert>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import KfAppAPI from '@/api/kfApp';

// 速度测试响应类型
interface SpeedTestResponse {
  success: boolean;
  file_size: number;
  processing_time_ms: number;
  message: string;
}

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
const measureNetworkSpeed = async () => {
  if (isSpeedTesting.value) return networkSpeed.value;
  
  isSpeedTesting.value = true;
  
  try {
    // 创建一个30KB的测试文件
    const testFile = createTestFile(30); // 30KB
    
    // 记录开始时间（包含网络传输时间）
    const startTime = performance.now();
    
    // 调用后端速度测试接口
    const result = await KfAppAPI.importSpeedTest({ file: testFile }) as unknown as SpeedTestResponse;
    // 记录结束时间
    const endTime = performance.now();
    
    if (result && (result as any).success === true) {
      // 使用后端返回的文件大小和前端测量的总时间计算速度
      const fileSize = result.file_size; // 字节
      const totalTimeSeconds = (endTime - startTime) / 1000; // 总时间（包含网络传输+后端处理）
      
      // 计算上传速度 (KB/s)
      const speed = fileSize / totalTimeSeconds / 1024; // KB/s 
      networkSpeed.value = Math.max(speed, 100); // 最小100KB/s
    } else {
      throw new Error();
    }
  } catch (_) {
    console.warn('Network speed measurement failed');
    // 如果测量失败，使用默认值并标记失败状态
    networkSpeed.value = 1024; // 默认 1MB/s
    speedTestFailed.value = true;
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
watch(() => (props.fileCount), () => {
  if (props.showInfo) {
    speedTestFailed.value = false; // 重置失败状态
    measureNetworkSpeed();
  }
});

// 组件销毁时重置数据
onUnmounted(() => {
  networkSpeed.value = 0;
});

const showUploadInfo = computed(() => {
  return props.showInfo && (props.fileSize > 50 * 1024 * 1024 || props.fileCount > 10);
});

const uploadInfoTitle = computed(() => {
  if (props.fileSize > 100 * 1024 * 1024) {
    return t('uploadTimeout.largeFileUploadReminder');
  } else if (props.fileCount > 20) {
    return t('uploadTimeout.batchUploadReminder');
  }
  return t('uploadTimeout.uploadReminder');
});

const uploadInfoDesc = computed(() => {
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
  
  // 计算总大小
  const totalSize = props.fileSize;
  
  // 简单计算：总大小 / 网速
  // 单通道测速得到的速度就是实际可用的网络速度，多并发会共享这个带宽
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
.upload-info {
  margin-bottom: 16px;
  
  .upload-details {
    margin-top: 8px;
    
    .upload-item {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
      font-size: 12px;
      
      .label {
        color: var(--o-text-color-secondary);
        min-width: 120px;
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

