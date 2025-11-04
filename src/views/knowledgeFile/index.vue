<template>
  <div class="kf-container">
    <CustomLoading :loading="loading" />
      <div
    class="dataset-empty-content"
    v-if="!isSearch && !fileTableList.data.length && totalCount === 0">
    <EmptyStatus
      :button-text="$t('btnText.importFile')"
      :description="$t('dataset.emptyDoc')"
      @click="handleImportKnowledge"
      />
  </div>
    <div v-else class="kf-container-action">
      <div
        class="kf-container-right"
        v-if="menuType === MenuType.KL_FILE">
        <div class="kf-container-table-ops">
        <div class="kf-container-table-ops-left" >
          <el-button
            type="primary"
            @click="handleImportKnowledge"
            class="importFileBtn">
            {{ $t('btnText.importFile') }}
          </el-button>
          <el-button
            type="primary"
            @click="handleGenerateDataSet(true)"
            :disabled="!isGenerateDataSet"
            class="dataSetBtn">
            {{ $t('assetFile.generateDataset') }}
          </el-button>
          <el-dropdown
            trigger="click"
            placement="bottom"
            popper-class="dropdown-container kf-ops-dowlon"
            @visible-change="handleBatchDownBth"
            :disabled="!(selectionFileData.length > 0)">
            <el-button
              :class="batchDownBth ? 'upBtn' : 'downBtn'"
              :disabled="!(selectionFileData.length > 0)">
              {{ $t('btnText.batchOps') }}
              <el-icon
                class="el-icon--right"
                v-if="!batchDownBth">
                <IconCaretDown />
              </el-icon>
              <el-icon
                class="el-icon--right el-icon--caretup"
                v-if="batchDownBth">
                <IconCaretUp />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleDownloadFile(fileTableList.data)">
                  {{ $t('btnText.downloadAll') }}
                </el-dropdown-item>
                <el-dropdown-item
                  :disabled="!(selectionFileData.length > 0)"
                  @click="handleDownloadFile(selectionFileData)">
                  {{ $t('btnText.downloadChoose') }}
                </el-dropdown-item>
                <el-dropdown-item
                  :disabled="!(selectionFileData.length > 0)"
                  @click="handleSelectRunKl">
                  {{ $t('btnText.batchAnalytic') }}
                </el-dropdown-item>
                <el-dropdown-item
                  :disabled="!(selectionFileData.length > 0)"
                  @click="handleSelectDeleteKl">
                  {{ $t('btnText.batchDelete') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <span v-if="selectionFileData.length>0 " class="multipleSelectNum">
            {{ $t('btnText.selected') }} 
            <span class="selectedNum">{{ selectionFileData.length }}</span>
            {{ $t('btnText.selectedCount') }}
          </span>
        </div>
        <el-input :placeholder="$t('assetFile.placeholderFile')" v-model="searchPayload.docName" class="kf-container-table-ops-right" 
          maxlength="150"  @input="hanldeSearhNameFilter"  :suffix-icon="IconSearch" />
        </div>
        <div class="kf-container-table-box">
          <el-table
            :data="fileTableList.data"
            class="fileTableContainer"
            cell-calss-name="tableCell"
            :row-key="(row) => row.docId"
            @selection-change="handleSelectionChange"
            @sort-change="handleSortChange"
            ref="multipleTable"
            :border="true">
            <template #empty>
              <div class="table-empty-box">
                <div class="table-empty-img"></div>
                <div>暂无数据</div>
              </div>
            </template>
            <el-table-column
              type="selection"
              :fixed="true"
              class-name="kl-selection"
              width="32"
              :reserve-selection="true"
              :selectable="checkSelecTable" />
            <el-table-column
              prop="docName"
              :label="$t('assetFile.docName')"
              :fixed="true"
              class-name="kl-name"
              min-width="150">
              <template #default="scope">
                <el-tooltip :content="scope.row.docName" placement="top" >
                  <span
                    class="kf-name-row table-row-content"
                    @click="handleJumpFileSection(scope.row)">
                    {{ scope.row.docName }}
                  </span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column
              prop="docType"
              :label="$t('assetFile.category')"
              width="150"
            >
              <template #header>
                <div class="custom-header">
                  <span>{{ $t('assetFile.category') }}</span>
                  <el-icon
                    ref="buttonRef"
                    :class="
                      searchPayload?.docTypeId?.length > 0 || categoryFilterVisible
                        ? 'searchIconIsActive'
                        : ''
                    ">
                    <IconFilter />
                  </el-icon>
                  <el-popover
                    ref="popoverRef"
                    v-model:visible="categoryFilterVisible"
                    popper-class="filterPopper"
                    placement="bottom-start"
                    :virtual-ref="buttonRef"
                    :show-arrow="false"
                    trigger="click"
                    virtual-triggering>
                    <FilterContainr
                      filterType="checkBox"
                      :handelSubFilterProper="handelCategoryFilterProper"
                      :filterList="filterCategoryList"
                      :checkedFilterList="checkedFilterList" />
                  </el-popover>
                </div>
              </template>
              <template #default="scope">
                <span>{{ scope.row.docType?.docTypeName }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="chunkSize"
              :label="$t('assetFile.chunkSize')"
              sortable
              width="120" />
            <el-table-column
              prop="createdTime"
              class-name="upload-time-cell"
              sortable
              :label="$t('assetFile.uploadTime')"
              width="200"
              @click.stop>
              <template #header>
                <div class="upload-time-header custom-header">
                  <span>{{ $t('assetFile.uploadTime') }}</span>
                  <el-date-picker
                    popper-class="datetimerangeClass"
                    placement="bottom"
                    class="timer-picker"
                    v-model="created_time"
                    type="datetimerange"
                    :teleported="true"
                    :shortcuts="shortcuts"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    time-format="HH:mm"
                    :unlink-panels="true"
                    @change="handleTimeChange"
                    ref="tiemPick"
                    @visible-change="handleVisibleChange" />
                  <el-popover
                    :visible="timeFilterVisible"
                    popper-class="filterPopper timeFilterPo"
                    placement="bottom-start"
                    :show-arrow="false">
                    <template #reference>
                      <el-icon
                        @click="handeDatePickerShow"
                        @click.stop
                        :class="
                          searchPayload?.createdTimeStart?.length > 0 || timeFilterVisible
                            ? 'searchIconIsActive'
                            : ''
                        ">
                        <IconFilter />
                      </el-icon>
                    </template>
                  </el-popover>
                </div>
              </template>
              <template #default="scope">
                <span>{{ convertUTCToLocalTime(scope.row.createdTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column
              prop="taskStatus"
              :label="$t('assetFile.analyticStatus')"
              width="250">
              <template #header>
                <div class="custom-header">
                  <span>{{ $t('assetFile.analyticStatus') }}</span>
                  <el-icon
                    ref="statusRef"
                    @click.stop
                    :class="
                      searchPayload?.parseStatus?.length > 0 || statusFilterVisible
                        ? 'searchIconIsActive'
                        : ''
                    ">
                    <IconFilter />
                  </el-icon>
                  <el-popover
                    ref="popoverRef"
                    v-model:visible="statusFilterVisible"
                    popper-class="filterPopper"
                    placement="bottom-start"
                    :virtual-ref="statusRef"
                    :show-arrow="false"
                    trigger="click"
                    virtual-triggering>
                    <FilterContainr
                      filterType="checkBox"
                      :filterList="filterStatusList"
                      :handelSubFilterProper="handelStatusFilterProper"
                      :checkedFilterList="checkedFilterList" />
                  </el-popover>
                </div>
              </template>
              <template #default="scope">
                <div
                  v-if="scope.row.docTask?.taskStatus === StatusEnum.FAIL"
                  class="statusFail">
                  {{ $t('assetFile.status.analyticFail') }}
                </div>
                <div
                  v-if="scope.row.docTask?.taskStatus === StatusEnum.SUCCESS"
                  class="statusSuccess">
                  {{ $t('assetFile.status.analyticSucces') }}
                </div>
                <div
                  v-if="scope.row.docTask?.taskStatus === StatusEnum.CANCEL"
                  class="statusCancel">
                  {{ $t('assetFile.status.cancelAnalytic') }}
                </div>
                <div
                  v-if="scope.row.docTask?.taskStatus === StatusEnum.ANALYSIS_ING"
                  class="statusWaitIng">
                  {{ $t('assetFile.status.analyticWaitIng') }}
                </div>
                <div
                  class="statusAnalysis"
                  v-if="scope.row.docTask?.taskStatus === StatusEnum.RUNNING">
                  <div class="percent-box">
                    <el-progress
                      :percentage=" scope.row.docTask?.taskCompleted ?? 0 "
                      :color="customColor"
                      striped
                      striped-flow />
                  </div>
                  <div class="statusAnalysisText">
                    {{ $t('assetFile.status.analyticIng') }}
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              prop="parseMethod"
              :label="$t('assetFile.parsingMethod')"
              width="150"
              >
              <template #header>
                <div class="custom-header">
                  <span>{{ $t('assetFile.parsingMethod') }}</span>
                  <el-icon
                    ref="parserMethodRef"
                    :class="
                      searchPayload?.parseMethods?.length > 0 || parserMethodVisible
                        ? 'searchIconIsActive'
                        : ''
                    ">
                    <IconFilter />
                  </el-icon>
                  <el-popover
                    ref="popoverRef"
                    v-model:visible="parserMethodVisible"
                    popper-class="filterPopper"
                    placement="bottom-start"
                    :virtual-ref="parserMethodRef"
                    :show-arrow="false"
                    trigger="click"
                    virtual-triggering>
                    <FilterContainr
                      filterType="checkBox"
                      :handelSubFilterProper="handelParserMethodFilterProper"
                      :filterList="parserMethodOptions"
                      :checkedFilterList="checkedFilterList" />
                  </el-popover>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              prop="finishedTime"
              :label="$t('assetFile.parsingComTime')"
              width="200">
              <template #default="scope">
                <div>
                  {{convertUTCToLocalTime(scope.row.docTask?.finishedTime)}}
                </div>
              </template>
            </el-table-column>
            <el-table-column
              prop="enabled"
              :label="$t('btnText.enable')"
              width="120">
              <template #header>
                <div class="custom-header">
                  <span>{{ $t('btnText.enable') }}</span>
                  <el-icon
                    ref="enableRef"
                    @click.stop
                    :class="
                      searchPayload?.enabled?.length > 0 || enableFilterVisible
                        ? 'searchIconIsActive'
                        : ''
                    ">
                    <IconFilter />
                  </el-icon>
                  <el-popover
                    ref="popoverRef"
                    v-model:visible="enableFilterVisible"
                    popper-class="filterPopper"
                    placement="bottom-start"
                    :virtual-ref="enableRef"
                    :show-arrow="false"
                    trigger="click"
                    virtual-triggering>
                    <FilterContainr
                      :filterList="filterEnableList"
                      filterType="checkBox"
                      :handelSubFilterProper="handelEnableFilterProper"
                      :checkedFilterList="checkedFilterList" />
                  </el-popover>
                </div>
              </template>
              <template #default="scope">
                <el-switch
                  v-model:model-value="scope.row.enabled"
                  @change="handleSwitch(scope.row)"
                  style="--el-switch-on-color: #24ab36; --el-switch-off-color: #c3cedf" />
              </template>
            </el-table-column>
            <el-table-column
              prop="action"
              :label="$t('btnText.operation')"
              width="220"
              fixed="right">
              <template #default="scope">
                <el-button
                  v-if="[StatusEnum.RUNNING,StatusEnum.ANALYSIS_ING].includes(scope.row.status) "
                  text
                  @click="handleRunKl(scope.row, 'cancel')">
                  {{ $t('btnText.cancel') }}
                </el-button>
                <el-button
                  v-if="scope.row.status==='idle'"
                  text
                  @click="handleRunKl(scope.row, 'run')">
                  {{ $t('btnText.analytic') }}
                </el-button>
                <el-button
                  text
                  :disabled="scope.row.status === StatusEnum.RUNNING"
                  @click="handleEditKl(scope.row)">
                  {{ $t('btnText.edit') }}
                </el-button>
                <el-button
                  text
                  @click="handleDownloadFile([scope.row])">
                  {{ $t('btnText.download') }}
                </el-button>
                <el-button
                  :disabled="scope.row.status === StatusEnum.RUNNING"
                  text
                  @click="handleDeleteKl(scope.row)">
                  {{ $t('btnText.delete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-if="fileTableList.data?.length > 0"
            v-model:current-page="currentPage"
            v-model:page-size="currentPageSize"
            :page-sizes="pagination.pageSizes"
            :layout="pagination.layout"
            :total="totalCount"
            :default-page-size="20"
            popper-class="fileLibraryPage"
            @change="handleChangePage" />
        </div>
      </div>
    </div>
  </div>
  <el-dialog
    v-model="dialogImportVisible"
    class="upload-dialog"
    align-center
    :title="$t('btnText.importFile')">
    <Upload
      :singleFileLimit="true"
      :singleFileSize="uploadLimits.singleFileSize"
      :tipText="dynamicTipText"
      accept=".xlsx,.pdf,.doc,.docx,.txt,.pptx,.html,.md,.json,.yaml,.md,.zip,.jpeg,.png"
      :maxFileNum="uploadLimits.maxFileNum"
      :maxSize="uploadLimits.maxSize"
      :handleUploadMyFile="handleUploadMyFile"
      :handleQueryTaskList="handleQueryTaskList"
      :handleCancelVisible="handleCancelVisible"
      :taskList="taskList"
      :taskListImportDate="taskListImportDate"
      :toggleUploadNotify="toggleUploadNotify"
      :handleImportLoading="handleImportLoading"
      uploadType="file" />
  </el-dialog>
  <el-dialog
    align-center
    v-model="cancelTipVisible"
    class="tip-dialog cancel-analytic-dialog"
    width="432"
    :title="$t('dialogTipText.tipsText')">
    <div class="delTip">
      <span class="iconAlarmOrange">
        <IconAlarm />
      </span>
      <span>
      {{ $t('dialogTipText.confirmCancelAnalytic') }}
      </span>
    </div>
    <div class="tip-ops-btn">
      <el-button
        class="resetBtn"
        @click="handleConfirmFileAnalytic">
        {{ $t('btnText.confirm') }}
      </el-button>
      <el-button
        type="primary"
        class="resetBtn cancelBtn"
        @click="handleCancelVisible">
        {{ $t('btnText.cancel') }}
      </el-button>
    </div>
  </el-dialog>
  <el-dialog
    v-if="dialogEditVisible"
    v-model="dialogEditVisible"
    class="edit-dialog"
    align-center
    width="560"
    :close-on-click-modal="false"
    :title="$t('dialogTipText.eidtFile')">
    <el-form
      ref="ruleFormRef"
      style="max-width: 600px"
      :model="ruleForm"
      :rules="rules"
      label-width="116"
      class="kl-ruleForm kf-ruleForm"
      label-position="left">
      <el-form-item
        :label="$t('assetFile.docName')"
        prop="docName"
        >
        <el-input
          class="o-validate-input"
          v-model="ruleForm.docName"
          :placeholder="$t('assetLibrary.message.pleasePlace')" >
          <template #suffix>
            <el-icon class="error-icon" >
              <img :src="getSvgUrl('fail.svg')" />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item
        :label="$t('assetLibrary.analyticMethod')"
        prop="parseMethod">
        <el-select
          v-model="ruleForm.parseMethod"
          :placeholder="$t('assetLibrary.message.pleaseChoose')"
          :teleported="false"
          :suffix-icon="IconCaretDown">
          <el-option
            v-for="item in parserMethodOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item
        :label="$t('assetFile.category')"
        prop="docTypeId">
        <el-select
          v-model="ruleForm.docTypeName"
          popper-class="docTypeClass"
          :placeholder="$t('assetLibrary.message.pleaseChoose')"
          :suffix-icon="IconCaretDown"
          :teleported="false">
          <el-option
            v-for="item in filterCategoryList"
            :key="item.value"
            :label="item.label"
            :value="item.label" >
            {{ item.label }}
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item
        :label="$t('assetLibrary.fileChunkSize')"
        prop="szie"
        class="fileChunkSize">
        <el-input-number
          class="config-size"
          v-model="ruleForm.chunkSize"
          controls-position="right"
          size="small"
          :min="512"
          :max="1024"
        >
          <template #suffix>
            <span>{{ $t('assetLibrary.character') }}</span>
          </template>
        </el-input-number>
        <span class="form-right-tip">（512~1024）</span>
        <div class="editTip">
          <span class="iconAlarmOrange">
            <IconAlarmOrange />
          </span>
          <span class="editTipText">{{ $t('assetFile.analyticTip') }}</span>
        </div>
      </el-form-item>
      <el-form-item class="kl-ops-btn">
        <el-button
          class="resetBtn"
          type="primary"
          :disabled="isSubmitDisabled"
          @click="submitForm(ruleFormRef)">
          {{ $t('btnText.confirm') }}
        </el-button>
        <el-button
          class="resetBtn cancelBtn"
          @click="handleCancelVisible()">
          {{ $t('btnText.cancel') }}
        </el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
  <DataSetDialog 
    :selectionFileData="selectionFileData" 
    :generateDialogVisible="generateDialogVisible" 
    :handleGenerateDataSet="handleGenerateDataSet"
    :handleClearSelected="handleClearSelected"s
    />
  <UploadProgress
    :isKnowledgeFileUpload="true"
    :showUploadNotify="uploadTaskListData.showUploadNotify"
    :uploadingList="uploadTaskListData.uploadingList"
    :showTaskList="uploadTaskListData.showTaskList"
    :handleShowTaskList="uploadTaskListData.handleShowTaskList"
    :handleUploadRestart="uploadTaskListData.handleUploadRestart"
    :taskListImportDate="taskListImportDate"
    :importTaskTotal="importTaskTotal"
    :handleCloseSingleUpload="handleStopUploadFile"
    :isShowAllClear="true" />
</template>
<script setup lang="ts">
import UploadProgress from '@/components/Upload/uploadProgress.vue';
import '@/styles/knowledgeFile.scss';
import {
  IconAlarm,
  IconAlarmOrange,
  IconCaretDown,
  IconCaretUp,
  IconFilter,
  IconSearch,
  IconSuccess,
} from '@computing/opendesign-icons';
import { StatusEnum, MenuType } from '@/enums/KnowledgeEnum';
import FilterContainr from '@/components/TableFilter/index.vue';
import { useAssets } from '@/composables/useAssets';
const { t } = useI18n();
const { getSvgUrl } = useAssets();
import { type FormInstance } from 'element-plus';
import KfAppAPI from '@/api/kfApp';
import { DocListRequest } from '@/api/apiType';
import KbAppAPI from '@/api/kbApp';
import CustomLoading from '@/components/CustomLoading/index.vue';
import { convertUTCToLocalTime, uTCToLocalTime } from '@/utils/convertUTCToLocalTime';

import { FileForm, DocumentType } from './fileConfig';
import router from '@/router';
import { useGroupStore } from '@/store/modules/group';
import DataSetDialog from './dataSetDialog.vue';
import { downloadFun } from '@/utils/downloadFun';

const route = useRoute();
const dialogImportVisible = ref(false);
const customColor = ref('rgb(99, 149, 253)');
const menuType = ref('klFile');
const buttonRef = ref();
const created_time = ref();
const statusRef = ref();
const popoverRef = ref();
const enableRef = ref();
const parserMethodRef = ref();
const tiemPick = ref();
const inputSearchRef = ref();
const categoryFilterVisible = ref(false);
const timeFilterVisible = ref(false);
const statusFilterVisible = ref(false);
const fileFilterVisible = ref(false);
const enableFilterVisible = ref(false);
const parserMethodVisible = ref(false);
const cancelTipVisible = ref(false);
const batchDownBth = ref(false);
const opsItem = ref();
const multipleTable = ref();
const selectionFileData = ref<any[]>([]);
const importTaskTotal = ref(0);
const checkTableSelecData = ref<any[]>([]);
const generateDialogVisible = ref(false);
const searchPayload = ref<any>({
  docName: '',
  docTypeId: [],
  chunkSizeOrder: '',
  createdTimeOrder: '',
  parseStatus: [],
  createdTimeStart: '',
  createdTimeEnd: '',
  enabled: '',
  parseMethods: [],
});
const kbInfo = ref<any>({});
const checkedFilterList = ref([]);
const filterCategoryList = ref<DocumentType[]>([]);

// 动态计算Upload组件的限制参数
const uploadLimits = computed(() => {
  const countLimit = kbInfo.value?.uploadCountLimit || 100;
  const sizeLimitMB = kbInfo.value?.uploadSizeLimit || 512; // MB
  return {
    maxFileNum: countLimit,
    maxSize: sizeLimitMB / 1024, // 转换为GB：MB ÷ 1024
    singleFileSize: 256 / 1024, // 256MB转换为GB（保持单个文件限制为256MB）
  };
});

// 动态生成提示文本
const dynamicTipText = computed(() => {
  const countLimit = kbInfo.value?.uploadCountLimit || 100;
  const sizeLimitMB = kbInfo.value?.uploadSizeLimit || 512;
  const sizeText = sizeLimitMB >= 1024 ? `${(sizeLimitMB / 1024).toFixed(1)}GB` : `${sizeLimitMB}MB`;
  return t('dialogTipText.fileAllFormat', {
    maxFileNum: countLimit,
    maxSize: sizeText
  });
});
const pollingKfTimer = ref();
const filterStatusList = ref();
const filterEnableList = ref();
const ruleFormRef = ref<FormInstance>();
const pagination = ref({
  pageSizes: [10, 20, 30, 40, 50],
  layout: 'total,sizes,prev,pager,next,jumper',
});
const currentPage = ref(1);
const totalCount = ref(0);
const currentPageSize = ref(20);
const dialogEditVisible = ref(false);
const loading = ref(false);
const taskListImportDate = ref();
const taskList = ref<any>([]);
const uploadTaskListData = ref<{
  showUploadNotify?: boolean;
  uploadingList?: Array<any>;
  showTaskList?: boolean;
  handleShowTaskList?: Function;
  handleUploadRestart?: Function;
}>({});
const parserMethodOptions = ref<any>([]);
const userLanguage = ref();
const isSubmitDisabled = ref(true);
// 记录正在上传的文件（用于防止重复上传）
const uploadingFiles = new Map<string, boolean>();
const isGenerateDataSet = computed(()=>{
  const arr = selectionFileData.value.filter((item:any) => {
    return item.docTask?.taskStatus === 'success';
  })
  return arr.length > 0;
})
const ruleForm = ref<FileForm>({
  docId: '',
  docName: '',
  docTypeId: '',
  parseMethod: '',
  chunkSize: 1024,
});
const store = useGroupStore();
const { knowledgeTabActive,curTeamInfo } = storeToRefs(store);
const rules = reactive({
  docName: [
    {
      required: true,
      message: t('assetFile.message.name'),
      trigger: ['blur', 'change'],
    },
    {
      min: 1,
      message: t('assetFile.message.docNameLen'),
      trigger: ['blur', 'change'],
    },
  ],
});
const shortcuts = ref();

const fileTableList = reactive<{
  data: Array<any>;
}>({
  data: [],
});

const isSearch = computed(()=>{
  return Object.values(searchPayload.value).some(value => {
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return true;
    return value !== null && value !== undefined; // 其他类型需非空
  });
})

watch(
  () => t(''),
  () => {
    filterStatusList.value = [
      {
        label: t('assetFile.status.analyticFail'),
        value: StatusEnum.FAIL,
      },
      {
        label: t('assetFile.status.analyticSucces'),
        value: StatusEnum.SUCCESS,
      },
      {
        label: t('assetFile.status.cancelAnalytic'),
        value: StatusEnum.CANCEL,
      },
      {
        label: t('assetFile.status.analyticWaitIng'),
        value: StatusEnum.ANALYSIS_ING,
      },
      {
        label: t('assetFile.status.analyticIng'),
        value: StatusEnum.RUNNING,
      },
    ];
    filterEnableList.value = [
      { label: t('assetFile.open'), value: 'true' },
      { label: t('assetFile.close'), value: 'false' },
    ];
    shortcuts.value = [
      {
        text: t('timerSearch.lastHour', {
          timer: 12,
        }),
        value: () => {
          const end = new Date();
          const start = new Date();
          start.setHours(start.getHours() - 12);

          return [start, end];
        },
      },
      {
        text: t('timerSearch.lastHour', {
          timer: 1,
        }),
        value: () => {
          const end = new Date();
          const start = new Date();
          start.setHours(start.getHours() - 1);
          return [start, end];
        },
      },
      {
        text: t('timerSearch.lastHour', {
          timer: 3,
        }),
        value: () => {
          const end = new Date();
          const start = new Date();
          start.setHours(start.getHours() - 3);
          return [start, end];
        },
      },
      {
        text: t('timerSearch.lastHour', {
          timer: 7,
        }),
        value: () => {
          const end = new Date();
          const start = new Date();
          start.setHours(start.getHours() - 7);
          return [start, end];
        },
      },
    ];
    userLanguage.value = JSON.parse(localStorage.getItem('userInfo') || '{}')?.language;
  },
  {
    deep: true,
    immediate: true,
  }
);

watch(
  () => ruleForm.value.docName,
  () => {
    isSubmitDisabled.value = !ruleForm.value.docName?.length;
  },
  {
    deep: true,
    immediate: true,
  }
);

const handleBatchDownBth = (e: boolean) => {
  batchDownBth.value = e;
};

const handleSearchPayload = () => {
  const searchParams = Object.keys(searchPayload.value || {}).reduce((pre: any, item) => {
    if (searchPayload.value?.[item]?.length > 0 && searchPayload.value?.[item] !== 'all') {
      pre[item] = searchPayload.value[item];
      if (item === 'enabled') {
        pre[item] = JSON.parse(searchPayload.value[item]);
      }
    }

    return pre;
  }, {});
  return searchParams || {};
};

const handelCategoryFilterProper = (filterList: any) => {
  searchPayload.value.docTypeId = filterList;
  handleSearchData();
};

const handelStatusFilterProper = (filterList: any) => {
  searchPayload.value.parseStatus = filterList;
  handleSearchData();
};
const handelEnableFilterProper = (filterList: any) => {
  searchPayload.value.enabled = filterList.length === 2 ? 'all' : filterList[0];
  handleSearchData();
};

const handelParserMethodFilterProper = (filterList: any) => {
  searchPayload.value.parseMethods = filterList;
  handleSearchData();
};

const handleRunKl = (row: any, type: string) => {
  if (type === 'cancel') {
    cancelTipVisible.value = true;
    opsItem.value = row;
  } else {
    loading.value = true;
    KfAppAPI.runLibraryFile({
      parse: true,
    },[row.docId]).then(() => {
      ElMessage({
        showClose: true,
        message: t('opsMessage.opsAnalyticIng'),
        icon: IconSuccess,
        customClass: 'o-message--success',
        duration: 3000,
      });
      handleSearchOpsData(true, true);
    }).finally(() => {
      loading.value = false;
    });
  }
};

const handleConfirmFileAnalytic = () => {
    loading.value = true;
    KfAppAPI.runLibraryFile({
    parse: false,
  },[opsItem.value.docId]).then(() => {
    ElMessage({
      showClose: true,
      message: t('opsMessage.opsCancel'),
      icon: IconSuccess,
      customClass: 'o-message--success',
      duration: 3000,
    });
    handleSearchOpsData(true, true);
    handleCancelVisible();
  }).finally(() => {
    loading.value = false;
  });
};

const handCheckTableData = (tableList:any) => {
  checkTableSelecData.value = tableList.filter((checkItem:any) => {
    const selecData = tableList.find((notCheckItem:any) => notCheckItem?.docId === checkItem?.docId);
    return selecData && ['pending', 'running'].includes(selecData.task?.taskStatus);
  });
};

const handleCleartTimer = () => {
  clearInterval(pollingKfTimer.value);
  pollingKfTimer.value = null;
};

const handeAssetLibraryData = (
  payload: DocListRequest,
  loadingStatus: boolean,
  pollTimer: boolean
) => {
  if (pollTimer) {
    handleCleartTimer();
  }
  loading.value = loadingStatus;
  if (!payload?.kbId) {
    console.warn('kbId is null or undefined');
    return;
  }
  KfAppAPI.getKbLibraryFile(payload)
    .then((res: any) => {
      if (res.documents?.length) {
        handCheckTableData(res.documents);
      }
      if (!res?.documents?.length && currentPage.value && currentPage.value !== 1) {
        currentPage.value = 1;
        handleSearchOpsData(true, true);
        return;
      }
      fileTableList.data = res?.documents || [];
      totalCount.value = res.total;
      if (pollTimer) {
        handleStartPollTimer();
      }
    })
    .finally(() => {
      loading.value = false;
    });
};

const handlePollAssetFileData = () => {
  let payload = {
    page: currentPage.value,
    pageSize: currentPageSize.value,
    kbId: route.query.kb_id as string,
    ...handleSearchPayload(),
    ...sortFilter.value,
  };
  if (!payload?.kbId || pollingKfTimer.value === null) {
    handleCleartTimer();
    return;
  }
  KfAppAPI.getKbLibraryFile(payload)
    .then((res: any) => {
      fileTableList.data = res?.documents;
      totalCount.value = res.total;
    })
    .finally(() => {
      loading.value = false;
    });
};

const hanldeSearhNameFilter = (filterName: string) => {
  searchPayload.value.docName = filterName;
  handleSearchData();
};

const handleJumpFileSection = async (row: any) => {
  // 传递完整的面包屑信息到 URL
  const targetQuery = {
    team_id: route.query.team_id,
    team_name: route.query.team_name,
    kb_id: route.query.kb_id,
    kb_name: route.query.kb_name,
    file_id: row.docId,
    file_name: row.docName
  };
  await router.push({
    path: '/documentInfo',
    query: targetQuery,
  });
};

const handleSearchData = () => {
  handeAssetLibraryData(
    {
      page: 1,
      pageSize: currentPageSize.value ?? 20,
      kbId: route.query.kb_id as string,
      ...handleSearchPayload(),
      ...sortFilter.value,
    },
    true,
    true
  );
  currentPage.value = 1;
  fileFilterVisible.value = false;
  categoryFilterVisible.value = false;
  enableFilterVisible.value = false;
  statusFilterVisible.value = false;
  parserMethodVisible.value = false;
};

const handleQueryKbData = () => {
  const kbId = route.query.kb_id;
  curTeamInfo
  const teamId = localStorage.getItem('teamId') ?? '';
  KbAppAPI.getKbLibrary({
    teamId,
    kbId: kbId,
    page: 1,
    pageSize: 20,
  }).then((res: any) => {
    kbInfo.value = res.kbList?.[0] || {};
    let categoryList = JSON.parse(
      JSON.stringify(Array.from(new Set(res.kbList?.[0]?.docTypes)) || '[]')
    );
    filterCategoryList.value = [
      ...categoryList.map((item: { type: string; docId: string }) => {
        return {
          label: item.type,
          value: item.docId,
        };
      }),
      {
        label: 'default',
        value: '00000000-0000-0000-0000-000000000000',
      },
    ].filter((item) => item?.label?.length > 0);
  });
};

const handleStartPollTimer = () => {
  try {
    if (pollingKfTimer.value) {
      handleCleartTimer();
    }
    // 检查所有必要条件
    if (!route.path.includes('/libraryInfo') || knowledgeTabActive.value !== 'document' || !route.query.kb_id) {
      return;
    }
    pollingKfTimer.value = setInterval(() => {handlePollAssetFileData()}, 15000);
  } catch (error) {
    console.error('启动轮询失败:', error);
    handleCleartTimer(); // 确保清除任何可能部分创建的定时器
  }
};
// 添加postMessage监听器
const handleMessage = (event: MessageEvent) => {
  if(event.data?.type!=='changeActive'){
    return;
  }
  if (event.data && typeof event.data.StopActive !== 'undefined') {
    if (event.data.StopActive) {
      handleCleartTimer();
    } else {
      handleStartPollTimer();
    }
  }
};

// 监听标签页变化
watch(
  () => knowledgeTabActive.value,
  (newValue) => {
    if (newValue === 'document') {
      const kbId = route.query.kb_id;
      if (kbId) {
        handeAssetLibraryData(
          {
            kbId: kbId as string,
            page: 1,
            pageSize: 20,
          },
          true,
          true
        );
        currentPage.value = 1;
        currentPageSize.value = 20;
      }
    } else {
      handleCleartTimer();
    }
  },
  { immediate: true }
);

onMounted(() => {
  const kbId = route.query.kb_id;
  if (kbId?.length && knowledgeTabActive.value === 'document' ) {
    handleQueryKbData();
    handeAssetLibraryData(
      {
        kbId: kbId as string,
        page: 1,
        pageSize: 20,
      },
      true,
      true
    );
    currentPage.value = 1;
    currentPageSize.value = 20;
    KbAppAPI.queryParseMethodList().then((res: any) => {
      parserMethodOptions.value = res?.map((item: any) => {
        return { label: item, value: item };
      });
    });
  }
  document.addEventListener('click', () => handleDateTimerange);
  
  // 添加postMessage事件监听
  window.addEventListener('message', handleMessage);
});


onUnmounted(() => {
  handleCleartTimer();
  // 移除postMessage事件监听
  window.removeEventListener('message', handleMessage);
});

const handleVisibleChange = (e: boolean) => {
  timeFilterVisible.value = e;
};

const handeDatePickerShow = (e: { pageX: string; pageY: string }) => {
  timeFilterVisible.value = true;
  tiemPick.value.handleOpen();
  let dateTimerContainer = document.querySelector('.datetimerangeClass') as HTMLElement;
  if (dateTimerContainer) {
    dateTimerContainer.style.position = 'absolute';
    dateTimerContainer.style.left = e.pageX + 'px';
    dateTimerContainer.style.top = e.pageY + 'px';
  }
};

const handleDateTimerange = (e: { target: Node | null }) => {
  const dateTimeContainer = document.querySelector('.datetimerangeClass');
  const timeFilterPo = document.querySelector('.timeFilterPo');
  if (dateTimeContainer) {
    if (!dateTimeContainer.contains(e.target) && !timeFilterPo?.contains(e.target)) {
      timeFilterVisible.value = false;
    }
  }
};

const handleTimeChange = (e: (string | undefined)[]) => {
  searchPayload.value.createdTimeStart = e?.[0] ? uTCToLocalTime(e?.[0]) : '';
  searchPayload.value.createdTimeEnd = e?.[1] ? uTCToLocalTime(e?.[1]) : '';
  handleSearchOpsData(true, true);
  handleCancelVisible();
};

const handleSearchOpsData = (loadingStatus: boolean, startPollTimer: boolean) => {
  handeAssetLibraryData(
    {
      page: currentPage.value,
      pageSize: currentPageSize.value,
      kbId: route.query.kb_id as string,
      ...handleSearchPayload(),
      ...sortFilter.value,
    },
    loadingStatus,
    startPollTimer
  );
};

const handleSwitch = (row: any) => {
  KfAppAPI.updateLibraryFile({docId: row.docId},{
    docName: row.docName,
    docTypeId: row.docTypeId,
    chunkSize: row.chunkSize,
    parseMethod: row.parseMethod,
    enabled: row.enabled,
  }).then(() => {
    ElMessage({
      showClose: true,
      message: t('opsMessage.opsSuccess'),
      icon: IconSuccess,
      customClass: 'o-message--success',
      duration: 3000,
    });
    handleSearchOpsData(true, true);
  });
};

const handleImportKnowledge = () => {
  dialogImportVisible.value = true;
};

const handleCancelVisible = () => {
  dialogImportVisible.value = false;
  dialogEditVisible.value = false;
  cancelTipVisible.value = false;
  timeFilterVisible.value = false;
};

const handleSelectionChange = (newSelection: any[]) => {
  selectionFileData.value = newSelection || [];
};

const handleDeleteKl = (row: any) => {
  ElMessageBox.confirm(
    `${t('dialogTipText.confirmDelFile')}【${row.docName}】 ？`,
    t('dialogTipText.tipsText'),
    {
      confirmButtonText: t('btnText.confirm'),
      cancelButtonText: t('btnText.cancel'),
      cancelButtonClass: 'el-button--primary',
      confirmButtonClass: 'el-button-confirm',
      type: 'warning',
      icon:markRaw(IconAlarm)
    }
  ).then(()=>{
    KfAppAPI.delLibraryFile([row.docId]).then(() => {
    ElMessage({
      showClose: true,
      message: t('opsMessage.delSuccess'),
      icon: IconSuccess,
      customClass: 'o-message--success',
      duration: 3000,
    });
    let selectData = JSON.parse(JSON.stringify(selectionFileData.value));
    selectData = selectData
      .filter((item: any) => item.docId !== row.docId)
      .filter((item: { docId: any }) => item?.docId);
    if (selectData?.length > 0) {
      selectData.forEach((item: { docId: any }) => {
        multipleTable.value.toggleRowSelection(item.docId);
      });
      selectionFileData.value = selectData;
    } else {
      multipleTable.value.clearSelection();
    }
    handleSearchOpsData(true, true);
  });
  })
};

const handleSelectDeleteKl = () => {
  ElMessageBox.confirm(
    `${t('dialogTipText.confirmDelSelected')} ？`,
    t('dialogTipText.tipsText'),
    {
      confirmButtonText: t('btnText.confirm'),
      cancelButtonText: t('btnText.cancel'),
      cancelButtonClass: 'el-button--primary',
      confirmButtonClass: 'el-button-confirm',
      type: 'warning',
      icon:markRaw(IconAlarm)
    }
  ).then(()=>{
    loading.value = true;
  handleCleartTimer();
  let ids=selectionFileData.value.map((item) => {
      return item.docId;
    })
  KfAppAPI.delLibraryFile(ids)
    .then(() => {
      ElMessage({
        showClose: true,
        message: t('opsMessage.delSuccess'),
        icon: IconSuccess,
        customClass: 'o-message--success',
        duration: 3000,
      });
      currentPage.value = 1;
      handleSearchOpsData(true, true);
      handleCancelVisible();
      selectionFileData.value = [];
      multipleTable.value.clearSelection();
    })
    .catch(() => {
      handleStartPollTimer();
    }).finally(()=>{
      loading.value = false;
    })
  })

};

const handleSelectRunKl = () => {
  loading.value = true;
  checkTableSelecData.value = selectionFileData.value;
  const ids = selectionFileData.value.map((item) => item.docId);
  KfAppAPI.runLibraryFile({parse:true},ids).then(() => {
    ElMessage({
      showClose: true,
      message: t('opsMessage.opsAnalyticIng'),
      icon: IconSuccess,
      customClass: 'o-message--success',
      duration: 3000,
    });
    selectionFileData.value = [];
    multipleTable.value.clearSelection();
    handleSearchOpsData(true, true);
  }).finally(() => {
    loading.value = false;
  });
};

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate((valid) => {
    if (valid) {
      KfAppAPI.updateLibraryFile({
        docId: ruleForm.value.docId
      },{
        ...ruleForm.value,
        docTypeId: ruleForm.value.docTypeId,
        docTypeName: ruleForm.value.docTypeName,
      }).then(() => {
        ElMessage({
          showClose: true,
          message: t('opsMessage.modifSuccess'),
          icon: IconSuccess,
          customClass: 'o-message--success',
          duration: 3000,
        });
        handleSearchOpsData(true, true);
        dialogEditVisible.value = false;
      });
    }
  });
};

const handleEditKl = (row: any) => {
  ruleForm.value.docId = row.docId;
  ruleForm.value.docName = row.docName;
  ruleForm.value.chunkSize = row.chunkSize || 1024;
  ruleForm.value.parseMethod = row.parseMethod;
  ruleForm.value.docTypeId = JSON.parse(JSON.stringify(row.docType.docTypeId));
  ruleForm.value.docTypeName = JSON.parse(JSON.stringify(row.docType.docTypeName));
  dialogEditVisible.value = true;
};

const handleChangePage = (pageNum: number, pageSize: number) => {
  currentPage.value = pageNum;
  currentPageSize.value = pageSize;
  handleSearchOpsData(true, true);
};

const sortFilter = ref({});
const handleSortChange = (data: { column: any; prop: string; order: any }) => {
  let sortKey = data.prop === 'chunkSize' ? 'chunkSizeOrder' : 'createdTimeOrder';
  let sortValue = data.order ? (data.order === 'ascending' ? 'asc' : 'desc') : null;
  sortFilter.value = sortValue
    ? {
        [sortKey]: sortValue,
      }
    : {};
  handleSearchOpsData(true, true);
};

const handleQueryTaskList = () => {
  handleSearchOpsData(true, false);
};

const handleImportLoading = (loadingStatus: boolean) => {
  loading.value = loadingStatus;
};

const toggleUploadNotify = (uploadTaskPayload: any) => {
  importTaskTotal.value = uploadTaskPayload.uploadingList.length;
  uploadTaskListData.value = uploadTaskPayload;
};

const handleUploadMyFile = (options: any) => {
  // 优化文件唯一标识生成逻辑
  // 1. 优先使用 fileInfo.id（来自 Upload 组件的唯一 uid）
  // 2. 如果没有 id，使用文件名+大小组合（不使用 lastModified，避免时间戳不一致）
  const fileId = options.fileInfo?.id;
  const fileName = options.file.raw?.name || options.file?.name;
  const fileSize = options.file.raw?.size || options.file?.size;
  const fileKey = fileId ? `id_${fileId}` : `${fileName}_${fileSize}`;
  
  // 检查是否正在上传
  if (uploadingFiles.has(fileKey)) {
    console.warn(`文件 ${fileName} 正在上传中，跳过重复请求`);
    options.onError({ ...options.fileInfo, error: '文件正在上传中，请勿重复提交' });
    return;
  }
  
  // 标记为正在上传
  uploadingFiles.set(fileKey, true);
  console.log(`开始上传文件: ${fileName}, fileKey: ${fileKey}`);
  
  KfAppAPI.importKbLibraryFile(
    {
      data: {
        docs: options.file.raw || options.file,
      },
      params: {
        kbId: route.query.kb_id,
      },
    },
    options
  )
    .then(() => {
      console.log(`文件上传成功: ${fileName}, fileKey: ${fileKey}`);
      options.onSuccess({ ...options.fileInfo, success: 'success' });
    })
    .catch((err) => {
      console.error(`文件上传失败: ${fileName}, fileKey: ${fileKey}`, err);
      options.onError({ ...options.fileInfo, error: err });
    })
    .finally(() => {
      // 上传完成后移除标记
      console.log(`清理上传标记: ${fileName}, fileKey: ${fileKey}`);
      uploadingFiles.delete(fileKey);
    });
};

const handleDownloadFile = async (downloadData: any) => {
  for (const item of downloadData) {
    const url = `${window.origin}/witchaind/api/doc/download?docId=${item.docId}`;
    downloadFun(url);
    await new Promise((resolve) => setTimeout(resolve, 333)); // 添加延迟
  }
};

const checkSelecTable = (row: { docId: any; }) => {
  return checkTableSelecData.value.every((item) => item?.docId !== row?.docId);
};

const handleGenerateDataSet = (visible: boolean) => {
  let flag = true;
  selectionFileData.value.forEach((item) => {
    if (item.docTask?.taskStatus !== 'success') {
      flag = false;
    }
  });
  if (!flag) {
    ElMessage.error(t('assetFile.generateTip'));
    return;
  }
  generateDialogVisible.value = visible;
};

const handleClearSelected = ()=>{
  checkTableSelecData.value = [];
  multipleTable.value.clearSelection();
}
const handleStopUploadFile = (taskId: string) => {
  if(taskId==='all'){
    uploadTaskListData.value = {
      uploadingList: [],
    };
  }else{}
};
</script>