<template>
  <div
    v-if="showUploadNotify"
    class="o-upload-progress-notify"
    :element-loading-text="`${$t('pageTipText.Loading')}...`"
    element-loading-background="rgba(122, 122, 122, 0.3)">
    <div class="o-upload-notify__head">
      <div class="task-list">
        <span>{{ $t('assetLibrary.importTaskList') }}</span>
        <span>{{ `(${taskStatusList.length})` }}</span>
      </div>
      <div class="nofity-show">
        <el-icon
          class="o-upload-notify__close"
          @click="handleShowTaskList()">
          <IconChevronDown v-if="showTaskList" />
          <IconChevronUp v-else />
        </el-icon>
      </div>
    </div>
    <div
      class="o-upload-notify__body"
      v-if="showTaskList">
      <div
        class="o-upload-notify__list"
        @scroll="handleScroll">
        <div
          v-for="(item, index) in taskStatusList"
          :key="item.taskId || item.id"
          class="item">
          <div class="item-box">
            <div class="item-info">
              <div
                :class="
                  ['success', 'canceled'].includes(item.uploadStatus)
                    ? 'item-success-name'
                    : 'item-name'
                ">
                <TextSingleTootip :content="item.name" />
              </div>
              <div
                v-if="!['success', 'canceled','error','failed'].includes(item.uploadStatus)"
                class="upload-status">
                {{ `，${$t('assetLibrary.uploadIng')}...` }}
              </div>
            </div>
            <div class="item-close">
              <IconX @click="handleCloseSingleUploadLocal(item)" />
            </div>
          </div>
          <el-progress
            :percentage="item.percent"
            v-if="item.uploadStatus !== 'canceled'"
            :stroke-width="8" />
          <div
            v-if="['success'].includes(item.uploadStatus)"
            class="upload-success">
            <span>
              <el-icon class="icon-tip">
                <CircleCheckFilled />
              </el-icon>
            </span>
            <span>{{ $t('uploadText.uploadSuccess') }}</span>
          </div>
          <div
            v-if="['error','failed'].includes(item.uploadStatus)"
            class="upload-error">
            <span>
              <el-icon class="icon-tip"><WarningFilled /></el-icon>
            </span>
            <span>{{ $t('uploadText.uploadFailed') }}</span>
            <el-button 
              v-if="item.newUploadTask"
              text 
              class="retry-button"
              @click="handleRetryUpload(item)">
              <el-icon><IconRefresh /></el-icon>
              <span>{{ $t('btnText.retry') }}</span>
            </el-button>
          </div>
          <div
            v-if="item.uploadStatus === 'canceled'"
            class="upload-error">
            <span>
              <el-icon class="icon-tip"><WarningFilled /></el-icon>
            </span>
            <span>{{ $t('exportTask.canceled') }}</span>
          </div>
        </div>
      </div>
      <div
        class="item-all-close"
        v-if="taskStatusList.length > 0 && isShowAllClear"
        @click="handleClearAll()">
        {{ $t('btnText.clearAll') }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import '@/styles/uploadProgress.scss';
import TextSingleTootip from '@/components/TextSingleTootip/index.vue';
import { IconChevronUp, IconChevronDown, IconX, IconRefresh } from '@computing/opendesign-icons';
const taskStatusList = ref<any>([]);
const props = defineProps({
  isKnowledgeFileUpload: {
    type: Boolean,
  },
  showUploadNotify: {
    type: Boolean,
  },
  uploadingList: {
    type: Array<any>,
    default: [],
  },
  handleShowTaskList: {
    type: Function,
    default: () => {},
  },
  showTaskList: {
    type: Boolean,
  },
  handleCloseSingleUpload: {
    type: Function,
    default: () => {},
  },
  handleUploadRestart: {
    type: Function,
    default: () => {},
  },
  taskListImportDate: {
    type: Number,
  },
  importTaskTotal: {
    type: Number,
  },
  handleImportScroll: {
    type: Function,
    default: () => {},
  },
  taskListLoading: {
    type: Boolean,
    default: false,
  },
  isShowAllClear: {
    type: Boolean,
    default: true,
  },
});

const handleScroll = (e: any) => {
  props.handleImportScroll(e);
};

// 处理关闭单个上传任务
const handleCloseSingleUploadLocal = (item: any) => {
  // 判断是否是前端新上传任务且已成功
  const isFrontendSuccessTask = item.newUploadTask && item.uploadStatus === 'success';
  
  if (isFrontendSuccessTask) {
    // 前端上传成功的任务，只删除前端缓存记录，不调用后端API
    taskStatusList.value = taskStatusList.value.filter((task: any) => 
      (task.taskId || task.id) !== (item.taskId || item.id)
    );
  } else if (item.newUploadTask && !item.taskId) {
    // 前端新上传任务但失败的，也只删除前端缓存
    taskStatusList.value = taskStatusList.value.filter((task: any) => 
      (task.taskId || task.id) !== (item.taskId || item.id)
    );
  } else if (item.taskId) {
    // 有taskId的后端任务，调用后端API删除
    props.handleCloseSingleUpload(item.taskId);
  } else {
    // 其他情况，从前端列表中移除
    taskStatusList.value = taskStatusList.value.filter((task: any) => 
      (task.taskId || task.id) !== (item.taskId || item.id)
    );
  }
};

// 处理清空所有任务
const handleClearAll = () => {
  // 分离前端上传任务和后端任务
  const frontendTasks = taskStatusList.value.filter((item: any) => item.newUploadTask);
  const backendTasks = taskStatusList.value.filter((item: any) => !item.newUploadTask && item.taskId);
  
  // 清除前端上传任务（无论成功还是失败）
  if (frontendTasks.length > 0) {
    taskStatusList.value = taskStatusList.value.filter((item: any) => !item.newUploadTask);
  }
  
  // 如果有后端任务，调用后端API清空
  if (backendTasks.length > 0) {
    props.handleCloseSingleUpload('all');
  }
  
  // 如果只有前端任务且全部清空了，直接清空列表
  if (frontendTasks.length > 0 && backendTasks.length === 0) {
    taskStatusList.value = [];
  }
};

// 处理重试上传
const handleRetryUpload = (item: any) => {
  if (props.handleUploadRestart) {
    props.handleUploadRestart(item);
  }
};

watch(
  () => props.uploadingList,
  () => {
    if (props.isKnowledgeFileUpload) {
      taskStatusList.value = props.uploadingList.filter((item) => item.uploadStatus !== 'success');
    } else {
      taskStatusList.value = props.uploadingList;
    }
  },
  {
    deep: true,
  }
);
watch(
  () => props.taskListImportDate,
  () => {
    taskStatusList.value = props.uploadingList;
  },
  {
    deep: true,
  }
);

onMounted(() => {
  if (props.isKnowledgeFileUpload) {
    taskStatusList.value = props.uploadingList.filter((item) => item?.uploadStatus !== 'success');
  } else {
    taskStatusList.value = props.uploadingList;
  }
});
</script>
<style lang="scss" scoped>
.icon-tip {
  margin-top: 4px;
  width: 16px;
  height: 16px;
}
</style>
