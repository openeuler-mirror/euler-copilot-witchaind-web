<template>
  <CustomLoading :loading="loading" />

  <div class="kf-section-container">
    <div class="kf-section-container-action">
      <div class="kf-section-container-left">
        <div class="kf-section-info-title">{{ $t('assetFile.baseInfo') }}</div>
        <div class="kf-section-info-desc">
          <div class="kf-section-info-label">{{ $t('assetFile.docName') }}</div>
          <div class="kf-section-info-content">
            <TextSingleTootip :content="fileInfo?.docName" />
          </div>
        </div>
        <div class="kf-section-info-desc">
          <div class="kf-section-info-label">
            {{ $t('assetFile.category') }}
          </div>
          <div class="kf-section-info-content">
            <TextSingleTootip :content="fileInfo?.docType?.docTypeName" />
          </div>
        </div>
        <div class="kf-section-info-desc">
          <div class="kf-section-info-label">
            {{ $t('assetLibrary.analyticMethod') }}
          </div>
          <div class="kf-section-info-content">
            {{ fileInfo?.parseMethod }}
          </div>
        </div>
        <div class="kf-section-info-desc">
          <div class="kf-section-info-label">
            {{ $t('assetFile.uploadTime') }}
          </div>
          <div class="kf-section-info-content">
            {{ fileInfo?.createdTime ? convertUTCToLocalTime(fileInfo?.createdTime) : '--' }}
          </div>
        </div>
        <div class="kf-section-info-desc">
          <div class="kf-section-info-label">
            {{ $t('assetFile.chunkSize') }}
          </div>
          <div class="kf-section-info-content">{{ fileInfo?.chunkSize }}</div>
        </div>
      </div>
      <div class="kf-section-divider" ></div>
      <div class="kf-section-container-right">
        <div class="kf-section-container-table-ops">
          <div class="kf-pre-title">{{ $t('assetFile.contentView') }}</div>
          <div v-if="fileInfo?.docTask?.taskStatus === 'success'"  class="kf-btn-search">
            <el-input
              ref="inputRef"
              v-model="textkeyWord"
              class="flie-serch-input"
              :placeholder="$t('assetLibrary.message.pleasePlace')"
              clearable
              @input="handleInputSearch">
              <template #prepend>
                <el-popover
                  placement="bottom"
                  popper-class="fileTypePoperClass"
                  class="fileTypeInputClass"
                  :show-arrow="false"
                  trigger="click"
                  @show="handleShowFileType(true)"
                  @hide="handleShowFileType(false)"
                  v-popover="popoverRef"
                  v-click-outside="onClickOutside">
                  <div>
                    <el-checkbox
                      v-model="checkAll"
                      :indeterminate="isIndeterminate"
                      @change="handleCheckAllChange"
                      :class="isHoverIndex === 'all' ? 'isFileTypeChcekHover' : ''"
                      @mouseover="onMouseOver('all')"
                      @mouseout="handleMouseOut">
                      {{ $t('btnText.all') }}
                    </el-checkbox>
                    <el-checkbox-group
                      v-model="fileType"
                      @change="handleCheckedCitiesChange">
                      <el-checkbox
                        v-for="(item, index) in Object.keys(textType)"
                        :key="item"
                        :label="item"
                        :value="item"
                        :class="isHoverIndex === index ? 'isFileTypeChcekHover' : ''"
                        @mouseover="onMouseOver(index)"
                        @mouseout="handleMouseOut">
                        {{ textType[item] }}
                      </el-checkbox>
                    </el-checkbox-group>
                  </div>
                  <template #reference>
                    <div
                      class="fileCheckTypeShow"
                      :class="filteTypeShow ? 'filteTypeShowClass is_selected' : null">
                      <div class="fileCheckTypeContent">
                        <span v-if="fileType.length">
                          <span v-if="fileType.length === 3">
                            {{ $t('btnText.all') }}
                          </span>
                          <span
                            v-else
                            v-for="(item, index) in fileType">
                            {{
                              `${textType[item]}${fileType.length > 1 && index === 0 ? ',' : ''}`
                            }}
                          </span>
                        </span>
                        <span
                          v-else
                          class="filterPleaseChoose">
                          {{ $t('assetLibrary.message.pleaseChoose') }}
                        </span>
                      </div>
                      <div class="fileTypeIcon">
                        <el-icon class="el-icon-fileType">
                          <IconCaretDown v-if="!filteTypeShow" />
                          <IconCaretUp
                            v-if="filteTypeShow"
                            class="icon-up el-icon--caretup" />
                        </el-icon>
                      </div>
                    </div>
                  </template>
                </el-popover>
              </template>
              <template #suffix>
                <el-icon class="el-input__icon">
                  <IconSearch />
                </el-icon>
              </template>
            </el-input>
          </div>
          <el-dropdown
            trigger="click"
            v-if="fileInfo?.docTask?.taskStatus === 'success'" 
            placement="bottom"
            popper-class="dropdown-container kf-section-ops-dowlon"
            :disabled="!(selectedData.length > 0)"
            @visible-change="handleBatchDownBth">
            <el-button
              class="kf-batch-ops"
              :class="batchDownBth ? 'upBtn' : 'downBtn'">
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
                <el-dropdown-item
                  @click="handleEnableData(true)">
                  {{ $t('btnText.enable') }}
                </el-dropdown-item>
                <el-dropdown-item
                  @click="handleEnableData(false)">
                  {{ $t('btnText.close') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div v-if="!['pending','running','failed'].includes(fileInfo?.docTask?.taskStatus)" class="kf-section-container-content">
          <div class="kf-section-container-table-box">
            <el-table
              :data="fileTableList.data"
              ref="fileSectionTable"
              @selection-change="handleSelectionChange">
              <template #empty>
                <div class="table-empty-box">
                  <div class="table-empty-img"></div>
                  <div>暂无数据</div>
                </div>
              </template>
              <el-table-column
                type="selection"
                class-name="kf-selection"
                width="40" />

              <el-table-column
                prop="name"
                :label="$t('btnText.selectAll')"
                class-name="kf-file-content">
                <template #default="scope">
                  <div class="kf-file-content-box">
                    <div class="kf-file-content-text">
                        <span style="white-space: pre-wrap;" v-for="(itemText,index) in scope.row?.text?.split('\n')">
                          <span v-if="index === 0" :class="`text-type-${scope.row.chunkType} text-type-tag`">
                            {{ textType[scope.row.chunkType] }}
                          </span>
                          <span v-html="itemText"></span>
                        </span>
                    </div>
                    <div class="kf-file-content-ops">
                      <el-button text @click="handleEditContent(scope.row)">
                          {{ $t('btnText.edit') }}
                      </el-button>
                      <el-switch
                        v-model:model-value="scope.row.enabled"
                        @change="handleSwitch(scope.row)"
                        style="--el-switch-on-color: #24ab36; --el-switch-off-color: #c3cedf" />
                    </div>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="kf-section-container-pagination" v-if="totalCount > currentPageSize">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="currentPageSize"
              :layout="pagination.layout"
              :total="totalCount"
              @change="handleChangePage"
              popper-class="fileSectionPage" />
          </div>
        </div>
        <div class="empty_box" v-if="fileInfo?.docTask?.taskStatus === 'pending'">
          <div class="empty_img empty_pending"></div>
          <div class="empty_text">{{ $t('assetFile.status.analyticWaitIng') }}</div>
        </div>
        <div class="empty_box" v-if="fileInfo?.docTask?.taskStatus === 'running'">
          <div class="empty_img empty_running"></div>
          <div class="empty_text">{{ $t('assetFile.status.analyticIng') }}</div>
        </div>
        <div class="empty_box" v-if="fileInfo?.docTask?.taskStatus === 'failed'">
          <div class="empty_img empty_failed"></div>
          <div class="empty_text">{{ $t('assetFile.status.analyticFail') }}</div>
        </div>
      </div>
    </div>
  </div>
  <el-dialog
    class="kf-section-edit-dialog"
    v-model="contentDialogVisible"
    :title="$t('btnText.edit')"
    width="544"
    align-center
  >
  <el-input
    v-model="sectionText"
    type="textarea"
    :autosize="{ minRows: 10}"
    :placeholder="$t('assetFile.contentPlaceholder')"
    maxlength="8096"
    :show-word-limit="true"
  />
    <template #footer>
      <div class="dialog-footer">
        <el-button 
          type="primary" 
          @click="handleSaveContent"
          :loading="saveContentLoading"
          :disabled="saveContentLoading">
          {{ $t('btnText.confirm') }}
        </el-button>
        <el-button 
          @click="contentDialogVisible = false"
          :disabled="saveContentLoading">
          {{ $t('btnText.cancel') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import KfAppAPI from '@/api/kfApp';
import TextSingleTootip from '@/components/TextSingleTootip/index.vue';
import CustomLoading from '@/components/CustomLoading/index.vue';
import { convertUTCToLocalTime } from '@/utils/convertUTCToLocalTime';
import '@/styles/knowledgeFileSection.scss';
import { IconCaretDown, IconSearch, IconCaretUp, IconSuccess } from '@computing/opendesign-icons';
import { ChunkRequest } from '@/api/apiType';
import { debounce } from 'lodash';
import { CheckboxValueType } from 'element-plus';
import { useGroupStore } from '@/store/modules/group';
const { t } = useI18n();

const route = useRoute();
const textkeyWord = ref();
const textType = ref<any>({
  text: t('fileChunk.parag'),
  table: t('fileChunk.table'),
  image: t('fileChunk.img'),
  code: t('fileChunk.code'),
  link: t('fileChunk.link'),
  qa: t('fileChunk.qa'),
});
const fileType = ref<any>(['text', 'table', 'image','code','link','qa']);
const pagination = ref({
  layout: 'total,sizes,prev,pager,next,jumper',
});
const currentPage = ref(1);
const currentPageSize = ref(20);
const fileTableList = reactive<{
  data: Array<any>;
}>({
  data: [],
});
const sectionText = ref('');
const fileInfo = ref<any>({});
const loading = ref(false);
const totalCount = ref(0);
const fileSectionTable = ref();
const ids = ref();
const selectedData = ref([]);

const checkAll = ref(true);
const isIndeterminate = ref(false);
const popoverRef = ref();
const filteTypeShow = ref(false);
const isHoverIndex = ref();
const batchDownBth = ref(false);
const contentDialogVisible = ref(false);
const saveContentLoading = ref(false);
const rowData = ref();
const store = useGroupStore();
const { curTeamInfo } = storeToRefs(store);


const highlightSearchTerm = (text: String, searchTerm: any) => {
  const highlightedTerm = `<span class="highlighted-term">${searchTerm}</span>`;
  const regex = new RegExp(searchTerm, 'gi');
  return text.replace(regex, highlightedTerm);
};

const handleFileSectionData = (payload: ChunkRequest) => {
  loading.value = true;

  KfAppAPI.chunkLibraryFile(payload)
    .then((res: any) => {
      fileTableList.data =
        res?.chunks?.map((item: { text: String }) => {
          return {
            ...item,
            text: payload.text?.length ? highlightSearchTerm(item.text, payload.text) : item.text,
          };
        }) || [];
      totalCount.value = res?.total || 0;
    })
    .finally(() => {
      loading.value = false;
    });
};

const handeSearchFileType = () => {
  currentPage.value = 1;
  let payload: any = {
    docId: ids.value.document_id,
    page: currentPage.value,
    pageSize: currentPageSize.value,
    text: textkeyWord.value,
  };
  if (fileType.value?.length) {
    payload.types = fileType.value;
  }
  handleFileSectionData(payload);
};

const onClickOutside = () => {
  unref(popoverRef).popperRef?.delayHide?.();
};

const handleShowFileType = (showStatus: boolean) => {
  filteTypeShow.value = showStatus;
};

const handleCheckAllChange = (val: CheckboxValueType) => {
  console.log(val)
  isIndeterminate.value = false;
  if (val) {
    fileType.value = ['text', 'table', 'image','code','link','qa'];
  } else {
    fileType.value = [];
  }
  handeSearchFileType();
};

const handleCheckedCitiesChange = (value: CheckboxValueType[]) => {
  console.log(value)
  fileType.value = value;
  const checkedCount = value.length;
  checkAll.value = checkedCount === Object.keys(textType.value).length;
  isIndeterminate.value = checkedCount > 0 && checkedCount < Object.keys(textType.value).length;
  handeSearchFileType();
};

const onMouseOver = (index: Number | string) => {
  isHoverIndex.value = index;
};

const handleMouseOut = () => {
  isHoverIndex.value = '';
};

const handleBatchDownBth = (e: boolean) => {
  batchDownBth.value = e;
};

onMounted(() => {
  fileTableList.data = [...fileTableList.data];
  const kb_Id = route.query.kb_id as string;
  const kf_Id = route.query.file_id as string;
  if (kb_Id && kf_Id) {
    ids.value = {
      id: kb_Id,
      document_id: kf_Id,
    };
    KfAppAPI.getKbLibraryFile({
      kbId: kb_Id,
      docId: kf_Id,
      page: 1,
      pageSize: 10,
    }).then((res: any) => {
      fileInfo.value = res.documents?.[0];
    });
    handleFileSectionData({
      docId: kf_Id,
      page: 1,
      pageSize: 20,
    });
  }
});

const handleSwitch = (row: any) => {
  KfAppAPI.updateFileSection({
    chunkId: row.chunkId,
  },{
    enabled: row.enabled,
  }).then(() => {
    ElMessage({
      showClose: true,
      message: t('opsMessage.opsSuccess'),
      icon: IconSuccess,
      customClass: 'o-message--success',
      duration: 3000,
    });
    let payload: any = {
      docId: ids.value.document_id,
      page: currentPage.value,
      pageSize: currentPageSize.value,
      text: textkeyWord.value,
    };
    if (fileType.value?.length) {
      payload.types = fileType.value;
    }
    handleFileSectionData(payload);
  });
};

const handleEnableData = (enabledType: any) => {
  let idArr = selectedData.value.map((item: any) => item.chunkId)
  KfAppAPI.switchFileSection({enabled: enabledType},idArr).then(() => {
    ElMessage({
      showClose: true,
      message: t('opsMessage.opsSuccess'),
      icon: IconSuccess,
      customClass: 'o-message--error',
      duration: 3000,
    });
    let payload: any = {
      docId: ids.value.document_id,
      page: currentPage.value,
      pageSize: currentPageSize.value,
      text: textkeyWord.value,
    };
    if (fileType.value?.length) {
      payload.types = fileType.value;
    }
    handleFileSectionData(payload);
  });
};

const handleSelectionChange = (newSelectonData: any) => {
  selectedData.value = newSelectonData;
};

watch(
  () => fileTableList.data,
  () => {
    setTimeout(() => {
      let tbodyContainer = document.querySelector('.el-table__body') as HTMLElement;
      let tableContainer = document.querySelector('.el-table') as HTMLElement;
      if (tableContainer) {
        if (
          tbodyContainer?.getBoundingClientRect().height >
          tableContainer?.getBoundingClientRect().height
        ) {
          tableContainer.style.height = 'calc(100% - 135px)';
        } else {
          tableContainer.style.height = 'unset';
        }
      }
    }, 100);
  }
);

watch(
  () => t(''),
  () => {
    textType.value = {
      text: t('fileChunk.parag'),
      table: t('fileChunk.table'),
      image: t('fileChunk.img'),
      code: t('fileChunk.code'),
      link: t('fileChunk.link'),
      qa: t('fileChunk.qa'),
    };
  },
  {
    deep: true,
    immediate: true,
  }
);

watch(()=>contentDialogVisible.value,()=>{
  sectionText.value = rowData.value?.text;
},{
  deep: true,
  immediate: true,
})

const handleChangePage = (pageNum: number, pageSize: number) => {
  currentPage.value = pageNum;
  currentPageSize.value = pageSize;
  const kf_Id = route.query.file_id as string;
  fileSectionTable.value.setScrollTop(0);
  let payload: any = {
    docId: kf_Id,
    page: currentPage.value,
    pageSize: currentPageSize.value,
    text: textkeyWord.value,
  };
  if (fileType.value?.length) {
    payload.types = fileType.value;
  }
  handleFileSectionData(payload);
};

const handleInputSearch = debounce((e) => {
  textkeyWord.value = e;
  currentPage.value = 1;
  let payload: any = {
    docId: ids.value.document_id,
    page: currentPage.value,
    pageSize: currentPageSize.value,
    text: textkeyWord.value,
  };
  if (fileType.value?.length) {
    payload.types = fileType.value;
  }
  handleFileSectionData(payload);
}, 200);

const handleEditContent= (row: any) => {
  contentDialogVisible.value = true;
  rowData.value = row;
}
const handleSaveContent = () => {
  saveContentLoading.value = true;
  
  KfAppAPI.updateFileSection({
    chunkId: rowData.value.chunkId
  },
    {
      text: sectionText.value,
    }
  ).then(() => {
    ElMessage({
      showClose: true,
      message: t('opsMessage.opsSuccess'),
      icon: IconSuccess,
      customClass: 'o-message--success',
      duration: 3000,
    });
    
    let payload: any = {
      docId: route.query.file_id,
      page: currentPage.value,
      pageSize: currentPageSize.value,
      text: textkeyWord.value,
    };
    if (fileType.value?.length) {
      payload.types = fileType.value;
    }
    handleFileSectionData(payload);
    contentDialogVisible.value = false;
  }).catch((error) => {
    console.error('保存内容失败:', error);
    ElMessage({
      showClose: true,
      message: t('opsMessage.opsFailed') || '保存失败，请重试',
      type: 'error',
      duration: 3000,
    });
  }).finally(() => {
    saveContentLoading.value = false;
  });
}
</script>
