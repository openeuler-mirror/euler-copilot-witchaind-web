<template>
  <div
    class="upload-to-list"
    :class="{ 'has-files': hasFiles }">
    <div v-if="hasFiles">
      <!-- 超时管理提醒 -->
      <UploadTimeoutManager
        :file-size="allFileSizes"
        :file-count="fileTableList.data.length"
        :show-info="true" />
      
      <el-alert
        :title="tipText"
        type="info"
        show-icon
        :closable="false" />
      <div class="list-action">
        <div>
          <el-button
            type="primary"
            @click.stop="selectFiles"
            class="file-ops"
            :disabled="fileTableList.data.length >= props.maxFileNum">
            {{ $t('btnText.chooseFile') }}
          </el-button>
          <el-button
            @click="batchDelete"
            :disabled="multipleSelection.length === 0"
            class="delFileBtn cancelBtn"
            >
            {{ $t('btnText.batchDelete') }}
          </el-button>
        </div>
        <div class="list-action-tip">
          <div>
            {{ $t('dialogTipText.fileNums') }}:{{ fileTableList.data.length }}/{{
              props.maxFileNum
            }}
          </div>
          <div v-if="uploadType !== 'dataset'" >
            {{ $t('dialogTipText.fileSizes') }}:{{ allFileSizesInfo }}/{{ maxFileSizesInfo }}
          </div>
        </div>
      </div>
      <div class="list-tip">
        <el-icon>
          <IconAlertCircle/>
        </el-icon>
        {{ $t('dialogTipText.continueAdd') }}</div>
    </div>
    <el-upload
      ref="uploadRef"
      action=""
      drag
      multiple
      :limit="props.maxFileNum"
      :accept="accept"
      :show-file-list="false"
      :on-exceed="handleExceed"
      :on-success="handlsSuccess"
      :on-change="handleChange"
      :on-progress="handleProgress"
      :auto-upload="false">
      <div
        ref="uploadEl"
        class="upload-block">
        <div
          v-if="hasFiles"
          class="upload-preview"
          @click.stop>
          <el-table
            :data="fileTableList.data"
            max-height="184"
            @selection-change="handleSelectionChange"
            ref="fileTableRef">
            <el-table-column
              type="selection"
              class-name="upload-file-selection"
              width="48" />
            <el-table-column
              prop="name"
              :label="$t('dialogTipText.fileName')"
              class-name="upload-file-name"
            >
            <template #default="scope">
              <el-tooltip :content="scope.row.name" placement="top" >
                <span class="table-row-content" >
                  {{ scope.row.name }}
                </span>
              </el-tooltip> 
            </template>
            </el-table-column>
            <el-table-column
              prop="size"
              :label="$t('dialogTipText.fileSize')"
              width="120" />
            <el-table-column
              prop="action"
              :label="$t('btnText.operation')"
              width="100">
              <template #default="scope">
                <el-button
                  text
                  @click="deleteFile(scope.row)">
                  {{ $t('btnText.delete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="upload-drag-mask">
            <div>
              <el-icon class="upload-btn-icon">
                <IconUpload />
              </el-icon>
              <div class="upload-tip">
                {{ $t('dialogTipText.dragDropAdd') }}
              </div>
            </div>
          </div>
        </div>
        <div
          v-else
          class="upload-add">
          <div class="upload-add-inner" >
            <el-icon class="upload-btn-icon">
              <IconUpload />
            </el-icon>
            <div class="upload-tip">
              <div class="upload-drag">{{ $t('dialogTipText.dragFile') }}</div>
              <div class="upload-tip-text">({{ tipText }})</div>
              <div style="margin-top: 24px">
                <el-button
                  type="primary"
                  class="chooseFileBtn">
                  {{ $t('btnText.chooseFile') }}
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-upload>
    <div
      v-if="hasFiles"
      class="upload-ops-btn">
      <el-button
        class="resetBtn"
        type="primary"
        :disabled="btnDisabled"
        @click="handleFileType(uploadType)">
        {{ $t('btnText.confirm') }}
      </el-button>
      <el-button
        class="resetBtn cancelBtn"
        @click="handleCancelUpload()">
        {{ $t('btnText.cancel') }}
      </el-button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue';
import '@/styles/upload.scss';
import { IconUpload, IconError, IconAlertCircle, IconSuccess } from '@computing/opendesign-icons';
import UploadTimeoutManager from './UploadTimeoutManager.vue';
import type { UploadFile, UploadProgressEvent } from 'element-plus/es/components/upload/src/upload';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import { bytesToSize, isMaxMemoryOut } from '@/utils/bytesToSize';
interface TableRow {
  id: string | number;
  name: string;
  size?: string;
  file: UploadFile;
}
const handleFileType = (type: string)=>{
  switch(type){
    case 'file':
      uploadKnowledgeFile();
      break;
    case 'dataset':
      uploadDatasetFile();
      break;
    case 'kbfile':
      uploadFiles();
      break;
    default:
      break;
  }
}
const doUpload = (options: any) => {
  props.handleUploadMyFile(options);
};
const progressVal = ref(0);
const uploadEl = ref(null);
const btnDisabled = ref(true);
const props = defineProps({
  tipText: {
    type: String,
  },
  accept: {
    type: String,
  },
  maxFileNum: {
    type: Number,
    default: 0,
  },
  handleCancelVisible: {
    type: Function,
    default: () => {},
  },
  handleQueryTaskList: {
    type: Function,
    default: () => {},
  },
  maxSize: {
    type: Number,
    default: 0,
  },
  handleUploadMyFile: {
    type: Function,
    default: () => {},
  },
  handInitTaskList: {
    type: Function,
    default: () => {},
  },
  handleStopUploadFile: {
    type: Function,
    default: () => {},
  },
  taskListImportDate: {
    type: Number,
  },
  taskList: {
    type: Array,
    default: [],
  },
  toggleUploadNotify: {
    type: Function,
    default: () => {},
  },
  handleImportLoading: {
    type: Function,
    default: () => {},
  },
  singleFileLimit: {
    type: Boolean,
    default: false,
  },
  singleFileSize: {
    type: Number,
    default: 0,
  },
  uploadType: {
    type: String,
    default:'kbfile'
  },
});
const fileTableList = reactive<{
  data: Array<TableRow>;
}>({
  data: [],
});
let selectedFiles: any[] = [];
const multipleSelection = ref<TableRow[]>([]);
const uploadingList = ref<Array<any>>([]);
const showTaskList = ref(true);
let allFileSizes = ref(0); // 所有文件大小
const uploadRef = ref();

let allFileSizesInfo = computed(() => {
  // 字节转MB：1 MB = 1024 * 1024 bytes
  if (allFileSizes.value <= 0) return 0;
  if (allFileSizes.value < 1024) {
    return allFileSizes.value + 'B';
  } else if (allFileSizes.value / 1024 < 1024) {
    return (allFileSizes.value / 1024).toFixed(0) + 'KB';
  } else if (allFileSizes.value / 1024 / 1024 < 1024) {
    return (allFileSizes.value / 1024 / 1024).toFixed(0) + 'MB';
  } else {
    return (allFileSizes.value / 1024 / 1024 / 1024).toFixed(0) + 'GB';
  }
});

let maxFileSizesInfo = computed(() => {
  if (props.maxSize <= 0) return 0;
  if (props.maxSize < 1) {
    return (props.maxSize * 1024).toFixed(0) + 'MB';
  } else {
    return props.maxSize + 'GB';
  }
});

let singleFileSizeInfo = computed(() => {
  if (props.singleFileSize <= 0) return '0MB';
  if (props.singleFileSize < 1) {
    return (props.singleFileSize * 1024).toFixed(0) + 'MB';
  } else {
    return props.singleFileSize + 'GB';
  }
});

// 专门用于错误提示的MB数值（不带单位）
let singleFileSizeMB = computed(() => {
  if (props.singleFileSize <= 0) return 0;
  if (props.singleFileSize < 1) {
    return (props.singleFileSize * 1024).toFixed(0);
  } else {
    return (props.singleFileSize * 1024).toFixed(0);
  }
});

// 表格实例引用
const fileTableRef = ref();
const handleSelectionChange = (val: TableRow[]) => {
  multipleSelection.value = val;
  selectedFiles = val.map((item) => {
    return {
      id: item.id,
      name: item.name,
      file: item.file,
      percent: 0,
    };
  });
};

const hasFiles = computed(() => fileTableList.data.length > 0);

const changeAllSizes = (file: any, type?: string) => {
  if (type === 'add') {
    allFileSizes.value += file.size as number;
  } else {
    allFileSizes.value -= file.size as number;
  }
  btnDisabled.value = isMaxMemoryOut(allFileSizes.value, props.maxSize);
};

const handleChange = (file: UploadFile) => {
  const item: TableRow = {
    id: file.uid,
    name: file.name,
    size: bytesToSize(file.size as number),
    file: file,
  };
  changeAllSizes(file, 'add');
  fileTableList.data.push(item);
};

// 超出文件数量限制时的处理
const handleExceed = () => {
  ElMessage.warning(`超出文件数量限制,最多只能上传 ${props.maxFileNum} 个文件!`);
};

const handleProgress = (e: UploadProgressEvent) => {
  progressVal.value = e.percent;
};

const handlsSuccess = () => {
  progressVal.value = 0;
};

const handleUploadRestart = (item: any) => {
  uploadingList.value = uploadingList.value.map((up) => {
    if (up.id === item.id) {
      return { ...item, error: false, uploadStatus: 'error' };
    }
    return up;
  });
  doUpload({
    file: item.file,
    onProgress: (evt: any) => {
      item.percent = evt;
    },
    onError: (e: any) => {
      uploadingList.value = uploadingList.value.map((up) => {
        if (up.id === e.id) {
          return e;
        }
        return up;
      });
    },
    onSuccess: () => {
      props.handInitTaskList();
    },
    fileInfo: item,
  });
};

watch(
  () => fileTableList.data,
  () => {
    handleSelectionChange(multipleSelection.value);
  },
  {
    deep: true,
    immediate: true,
  }
);
const batchDelete = () => {
  if (!selectedFiles.length) {
    ElMessage.warning(`请先选择文件再进行批量删除操作！`);
    return;
  }
  const filesToDelete = [...selectedFiles];
  filesToDelete.forEach((item) => item && deleteFile(item));
  multipleSelection.value = [];
};
const deleteFile = (row?: any) => {
  if (row) {
    const idx = fileTableList.data.findIndex((item: any) => item.id === row.id);
    fileTableList.data.splice(idx, 1);
    changeAllSizes(row.file, 'del');
    // 同步移除el-upload内部缓存
    if (uploadRef.value && uploadRef.value.uploadFiles) {
      const fileIdx = uploadRef.value.uploadFiles.findIndex((f: any) => f.uid === row.file.uid);
      if (fileIdx > -1) {
        uploadRef.value.uploadFiles.splice(fileIdx, 1);
      }
    }
    console.log(uploadRef.value)
  }
};

const selectFiles = () => {
  uploadEl.value && (uploadEl.value as HTMLElement).click();
};

watch(
  () => props.taskListImportDate,
  () => {
    uploadingList.value = props.taskList?.map((item: any) => {
      return {
        id: item.opId,
        newUploadTask: false,
        taskId: item.taskId,
        name: item.opName,
        percent: item?.taskStatus && item?.taskStatus === 'success' ? 100 : (item?.taskStatus === 'failed'? 0 : 99),
        uploadStatus: item?.taskStatus,
      };
    });
    handleToggleUploadNotify();
  }
);

const handleLimitSize = (selectedFileData: Array<TableRow>) => {
  let flag = false;
  selectedFileData.forEach((item) => {
    if (isMaxMemoryOut(item.file.size ?? 0, props.singleFileSize)) {
      flag = true;
    }
  });

  return flag;
};
// 提交资产库 .zip
const uploadFiles = () => {
  if (props.singleFileLimit) {
    if (handleLimitSize(fileTableList.data)) {
      ElMessage({
        showClose: true,
        message: t('dialogTipText.singleFileSize', { size: singleFileSizeMB.value }),
        icon: IconError,
        customClass: 'o-message--error',
        duration: 3000,
      });
      return;
    }
  }
  props?.handleImportLoading(true);
  let uploadFileNumber = 0;
  props.handInitTaskList(fileTableList.data).then((res: any) => {
    uploadingList.value = fileTableList.data.map((item) => {
      return {
        id: item.id,
        name: item.name,
        file: item.file,
        percent: 0,
        newUploadTask: true,
      };
    });
    uploadingList.value.forEach((item) => {
      return doUpload({
        file: item.file,
        onProgress: (evt: any) => {
          if (evt < 100) {
            item.percent = evt;
          }
        },
        onError: (e: any) => {
          uploadFileNumber += 1;
          uploadingList.value = uploadingList.value.map((up) => {
            if (up.id === e.id) {
              return { ...e, uploadStatus: 'error'};
            }
            return up;
          });
          props?.handleImportLoading(false);
          handleToggleUploadNotify();
        },
        onSuccess: () => {
          uploadFileNumber += 1;
          if (uploadFileNumber === fileTableList.data.length) {
            props.handleQueryTaskList();
            fileTableList.data = [];
          }
        },
        fileInfo: item
      });
    });
    uploadingList.value = [
      ...uploadingList.value,
      ...res?.map((item: any) => {
        return {
          id: item.opId,
          taskId: item.taskId,
          name: item.opName,
          percent:
            item?.taskStatus === 'success'
              ? 100
              : item.taskCompleted,
          uploadStatus: item?.taskStatus,
        };
      }),
    ];
    props.handleCancelVisible();
    uploadRef.value?.clearFiles();
    allFileSizes.value = 0;
    uploadingList.value.length && handleToggleUploadNotify();
  });
};

// 并发控制的批量上传函数
const uploadWithConcurrencyControl = async (items: any[], concurrency = 3, maxRetries = 2) => {
  const results: any[] = [];
  let index = 0;
  
  // 创建并发任务池
  const runTask = async () => {
    while (index < items.length) {
      const currentIndex = index++;
      const item = items[currentIndex];
      
      let retries = 0;
      let success = false;
      let lastError = null;
      
      while (retries <= maxRetries && !success) {
        try {
          await new Promise((resolve, reject) => {
            doUpload({
              file: item.file,
              onProgress: (evt: any) => {
                if (evt < 100) {
                  item.percent = evt;
                }
              },
              onError: (e: any) => {
                item.uploadStatus = 'error';
                reject(e);
              },
              onSuccess: () => {
                item.uploadStatus = 'success';
                item.percent = 100;
                resolve(true);
              },
              fileInfo: item,
            });
          });
          
          success = true;
          results.push({ success: true, item, index: currentIndex });
          
        } catch (error) {
          lastError = error;
          retries++;
          
          if (retries <= maxRetries) {
            // 重试前等待递增的时间
            await new Promise(resolve => setTimeout(resolve, retries * 1000));
            item.percent = 0; // 重置进度
          } else {
            console.error(`文件上传失败: ${item.name}`, lastError);
            item.uploadStatus = 'error';
            results.push({ success: false, item, error: lastError, index: currentIndex });
          }
        }
      }
    }
  };
  
  // 创建并发任务
  const tasks = [];
  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    tasks.push(runTask());
  }
  
  // 等待所有任务完成
  await Promise.all(tasks);
  
  // 按原始顺序排序结果
  results.sort((a, b) => a.index - b.index);
  
  return results;
};

// 资产库内提交文件 .pdf .ms .docx......
const uploadKnowledgeFile = async () => {
  if (props.singleFileLimit) {
    if (handleLimitSize(fileTableList.data)) {
      ElMessage({
        showClose: true,
        message: t('dialogTipText.singleFileSize', { size: singleFileSizeMB.value }),
        icon: IconError,
        customClass: 'o-message--error',
        duration: 3000,
      });
      return;
    }
  }
  
  props?.handleImportLoading(true);
  
  uploadingList.value = fileTableList.data.map((item) => {
    return {
      id: item.id,
      name: item.name,
      file: item.file,
      percent: 0,
      newUploadTask: true,
      uploadStatus: 'pending',
    };
  });

  handleToggleUploadNotify();

  try {
    // 使用并发控制上传，最多3个并发，最多重试2次
    const results = await uploadWithConcurrencyControl(uploadingList.value, 3, 2);
    
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.length - successCount;
    const totalFiles = fileTableList.data.length;

    // 验证结果数量是否正确
    if (results.length !== totalFiles) {
      console.warn(`结果数量不匹配: 预期 ${totalFiles} 个，实际 ${results.length} 个`);
    }

    if (errorCount > 0) {
      ElMessage({
        showClose: true,
        message: `批量上传完成：成功 ${successCount} 个，失败 ${errorCount} 个（共 ${totalFiles} 个文件）`,
        icon: errorCount === results.length ? IconError : IconSuccess,
        customClass: errorCount === results.length ? 'o-message--error' : 'o-message--warning',
        duration: 5000,
      });
    } else {
      ElMessage({
        showClose: true,
        message: `批量上传成功：共 ${successCount} 个文件全部上传完成！`,
        icon: IconSuccess,
        customClass: 'o-message--success',
        duration: 3000,
      });
    }

    // 所有上传完成后的回调
    props.handleQueryTaskList(fileTableList.data);
  } catch (error) {
    console.error('批量上传过程中出现错误:', error);
    ElMessage({
      showClose: true,
      message: '批量上传过程中出现错误',
      icon: IconError,
      customClass: 'o-message--error',
      duration: 3000,
    });
  } finally {
    props?.handleImportLoading(false);
    props.handleCancelVisible();
    fileTableList.data = [];
    uploadRef.value?.clearFiles();
    allFileSizes.value = 0;
  }
};

// 提交数据集
const uploadDatasetFile = () => {
  let uploadFileNumber = 0;
  props.handInitTaskList(fileTableList.data).then((res: any) => {
    uploadingList.value = fileTableList.data.map((item) => {
      return {
        id: item.id,
        name: item.name,
        file: item.file,
        percent: 0,
        newUploadTask: true,
      };
    });
    uploadingList.value.forEach((item) => {
      return doUpload({
        file: item.file,
        onProgress: (evt: any) => {
          if (evt < 100) {
            item.percent = evt;
          }
        },
        onError: (e: any) => {
          uploadFileNumber += 1;
          uploadingList.value = uploadingList.value.map((up) => {
            if (up.id === e.id) {
              return { ...e, uploadStatus: 'error'};
            }
            return up;
          });
          handleToggleUploadNotify();
        },
        onSuccess: () => {
          uploadFileNumber += 1;
          if (uploadFileNumber === fileTableList.data.length) {
            props.handleQueryTaskList();
            fileTableList.data = [];
          }
        },
        fileInfo: item
      });
    });
    uploadingList.value = [
      ...uploadingList.value,
      ...res?.map((item: any) => {
        return {
          id: item.opId,
          taskId: item.taskId,
          name: item.opName,
          percent:
            item?.taskStatus === 'success'
              ? 100
              : item.taskCompleted,
          uploadStatus: item?.taskStatus,
        };
      }),
    ];
    props.handleCancelVisible();
    uploadRef.value?.clearFiles();
    allFileSizes.value = 0;
    uploadingList.value.length && handleToggleUploadNotify();
  });
};
const handleToggleUploadNotify = () => {
  props.toggleUploadNotify({
    showUploadNotify: true,
    uploadingList: uploadingList.value,
    showTaskList: showTaskList.value,
    handleShowTaskList: handleShowTaskList,
    handleUploadRestart: handleUploadRestart,
  });
};

const handleShowTaskList = () => {
  showTaskList.value = !showTaskList.value;
  handleToggleUploadNotify();
};

const handleCancelUpload = () => {
  props.handleCancelVisible();
};
</script>
