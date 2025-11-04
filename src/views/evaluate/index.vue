<template>
  <CustomLoading :loading="loading" />
  <div class="evaluate-empty-content" v-if="!isSearch && testList.length === 0 && totalCount === 0">
    <EmptyStatus :description="$t('testing.testEmptyDesc')" :buttonText="$t('testing.testEmptyText')" buttonClass="group-btn" @click="handleCreate" />
  </div>
  <div class="group-table-box" v-else>
    <div class="test-manage-header">
      <div>
        <el-dropdown placement="bottom" popper-class="kf-ops-dowlon dropdown-container"
        trigger="click" @visible-change="handleBatchDownBth" :disabled="!selectedRow.length">
        <el-button :class="{
          'upBtn': batchDownBth,
          'downBtn': !batchDownBth,
          'dropdown-disabled': !selectedRow.length
        }">
          {{ $t('btnText.batchOps') }}
          <el-icon class="el-icon--right" v-if="!batchDownBth">
            <IconCaretDown />
          </el-icon>
          <el-icon class="el-icon--right el-icon--caretup" v-if="batchDownBth">
            <IconCaretUp />
          </el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleBatchDownload" >
              {{ $t('btnText.batchDownload') }}
            </el-dropdown-item>
            <el-dropdown-item @click="handleBatchDelete" >
              {{ $t('btnText.batchDelete') }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <span v-if="selectedRow.length>0 " class="multipleSelectNum">
          {{ $t('btnText.selected') }} 
          <span class="selectedNum">{{ selectedRow.length }}</span>
          {{ $t('btnText.selectedCount') }}
        </span>
      </div>
      <el-input
          v-model="searchPayload[searchType]"
          :suffix-icon="IconSearch"
          :placeholder="$t('assetLibrary.message.pleasePlace')"
          @input="handleInput"
          clearable
          class="search-input select-input-search"
        >
          <template #prepend>
            <el-select v-model="searchType" style="width: 120px" :suffix-icon="IconCaretDown" @change="handleSelectType" >
              <el-option :label="$t('testing.testingName')" value="testingName" />
              <el-option :label="$t('group.creator')" value="authorName" />
            </el-select>
          </template>
        </el-input>
    </div>
    <div class="test-manage-table">
      <el-table class="test-table" ref="testingTableRef" :data="testList" style="margin-bottom: 20px" 
      :row-key="row => row.datasetId ? `dataset-${row.datasetId}` : `testing-${row.testingId}`"
      bordered default-expand-all @selection-change="handleSelectionChange">
      <template #empty>
        <div class="table-empty-box">
          <div class="table-empty-img"></div>
          <div>暂无数据</div>
        </div>
      </template>
      <el-table-column type="selection" width="54" fixed="left" />
      <el-table-column prop="datasetName" width="120" :label="$t('testing.datasetUsed')" fixed="left" >
        <template #default="scope">
          <el-tooltip :content="scope.row.datasetName" placement="top" >
            <span class="table-row-content" >
              {{ scope.row.datasetName }}
            </span>
          </el-tooltip> 
        </template>
      </el-table-column>
      <el-table-column prop="testingName" width="120" :label="$t('testing.testingName')" fixed="left">
        <template #default="scope">
          <el-tooltip :content="scope.row.testingName" placement="top" >
            <span class="test-name table-row-content" @click="handleTestData(scope.row)"> {{ scope.row.testingName }} </span>
          </el-tooltip> 
        </template>
      </el-table-column>
      <el-table-column prop="description" min-width="400" :label="$t('testing.testingDesc')" >
        <template #default="scope">
          <el-tooltip :content="scope.row.description" placement="top" >
            <span class="table-row-content"> {{ scope.row.description }} </span>
          </el-tooltip> 
        </template>
      </el-table-column>
      <el-table-column prop="modelType" width="150" label="评测模型">
        <template #header>
          <div class="custom-header">
            <span>评测模型</span>
            <el-icon ref="modelRef" @click.stop :class="modelFilterVisible || searchPayload?.llmId?.length! > 0
              ? 'searchIconIsActive'
              : ''
              ">
              <IconFilter />
            </el-icon>
            <el-popover ref="popoverRef" v-model:visible="modelFilterVisible" popper-class="filterPopper"
              placement="bottom-start" :virtual-ref="modelRef" :show-arrow="false" trigger="click" virtual-triggering>
              <FilterContainr :filterList="llmOptions" filterType="checkBox"
                :handelSubFilterProper="handelModelFilterProper" :checkedFilterList="checkedFilterList" />
            </el-popover>
          </div>
        </template>
        <template #default="scope">
          <el-tooltip :content="scope.row.llm?.llmName" placement="top" >
            <span v-if="scope.row.llm" class="testing-model-type table-row-content">
              <img :src="scope.row.llm?.llmIcon"/>
              {{ scope.row.llm?.llmName}}
            </span>
          </el-tooltip> 
        </template>
      </el-table-column>
      <el-table-column prop="searchMethod" width="150" :label="$t('testing.method')" >
        <template #header>
          <div class="custom-header">
            <span>{{ $t('testing.method') }}</span>
            <el-icon ref="searchRef" @click.stop :class="searchPayload?.searchMethod?.length || searchFilterVisible
              ? 'searchIconIsActive'
              : ''
              ">
              <IconFilter />
            </el-icon>
            <el-popover ref="popoverRef" v-model:visible="searchFilterVisible" popper-class="filterPopper"
              placement="bottom-start" :virtual-ref="searchRef" :show-arrow="false" trigger="click" virtual-triggering>
              <FilterContainr :filterList="searchList" filterType="checkBox"
                :handelSubFilterProper="handelSearchFilterProper" :checkedFilterList="checkedFilterList" />
            </el-popover>
          </div>
        </template>
        <template #default="scope">
          <span v-if="scope.row.llm">
            {{ scope.row.searchMethod}}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="searchLlm" width="150" label="检索模型">
        <template #default="scope">
          <el-tooltip v-if="scope.row.searchLlm && ['enhanced_by_llm', 'query_extend'].includes(scope.row.searchMethod)" :content="scope.row.searchLlm?.llmName" placement="top" >
            <span class="testing-model-type table-row-content">
              <img v-if="scope.row.searchLlm?.llmIcon" :src="scope.row.searchLlm?.llmIcon"/>
              {{ scope.row.searchLlm?.llmName}}
            </span>
          </el-tooltip>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column prop="topk" width="80" label="Top_k"></el-table-column>
      <el-table-column prop="status" width="200" label="状态">
        <template #header>
          <div class="custom-header">
            <span>{{ $t('dataset.status') }}</span>
            <el-icon ref="statusRef" @click.stop :class="searchPayload?.runStatus?.length || statusFilterVisible
              ? 'searchIconIsActive'
              : ''
              ">
              <IconFilter />
            </el-icon>
            <el-popover ref="popoverRef" v-model:visible="statusFilterVisible" popper-class="filterPopper"
              placement="bottom-start" :virtual-ref="statusRef" :show-arrow="false" trigger="click" virtual-triggering>
              <FilterContainr :filterList="statusList" filterType="checkBox"
                :handelSubFilterProper="handelStatusFilterProper" :checkedFilterList="checkedFilterList" />
            </el-popover>
          </div>
        </template>
        <template #default="scope">
          <div v-if="scope.row.testingTask?.taskStatus === StatusEnum.FAIL" class="statusFail">
            {{ $t('testing.testingStatus.failed') }}
          </div>
          <div v-if="scope.row.testingTask?.taskStatus === StatusEnum.SUCCESS" class="statusSuccess">
            {{ $t('testing.testingStatus.success') }}
          </div>
          <div v-if="scope.row.testingTask?.taskStatus === StatusEnum.CANCEL" class="statusCancel">
            {{ $t('testing.testingStatus.canceled') }}
          </div>
          <div v-if="scope.row.testingTask?.taskStatus === StatusEnum.ANALYSIS_ING" class="statusWaitIng">
            <div class="icon-box icon-loading"></div>
            {{ $t('testing.testingStatus.pending') }}
          </div>
          <div class="statusAnalysis" v-if="scope.row.testingTask?.taskStatus === StatusEnum.RUNNING">
            <div class="percent-box">
              <el-progress :percentage="scope.row?.testingTask?.taskCompleted ?? 0" color="rgb(99, 149, 253)" striped striped-flow />
            </div>
            <div class="statusAnalysisText">
              {{ $t('testing.testingStatus.running') }}
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="aveScore" width="200" :label= "`${$t('testing.testingScore')}(0-100)`">
        <template #default="scope">
          {{ scope.row.aveScore<0 ?'--':scope.row.aveScore}}
        </template>
      </el-table-column>
      <el-table-column prop="authorName" width="100" :label="$t('group.creator')">
      </el-table-column>
      <el-table-column prop="finishedTime" width="150" :label="$t('dataset.finishedTime')">
        <template #default="scope">
          {{ convertUTCToLocalTime(scope.row.testingTask?.finishedTime)}}
        </template>
      </el-table-column>
      <el-table-column :label="$t('btnText.operation')" width="150" fixed="right">
        <template #default="scope">
          <div v-if="!scope.row.datasetId" class="test-manage-btns">
            <el-button v-if="[StatusEnum.RUNNING,StatusEnum.ANALYSIS_ING].includes(scope.row.status) " type="text"
              @click="handleStopTesting(scope.row)">{{ $t('dataset.stop') }}</el-button>
            <el-button v-else :disabled="scope.row.testingTask?.taskStatus === StatusEnum.SUCCESS" type="text"
              @click="handleRunTesting(true, scope.row)">{{ $t('btnText.restart') }}</el-button>
            <el-button :disabled="scope.row.testingTask?.taskStatus !== StatusEnum.SUCCESS" type="text"
              @click="handleDownload(scope.row)">{{ $t('btnText.download') }}</el-button>
            <el-button :disabled="scope.row.testingTask?.taskStatus === StatusEnum.RUNNING" type="text"
              @click="handleSingleDelete(scope.row)">{{ $t('btnText.delete') }}</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    </div>
    <el-pagination v-if="totalCount" v-model:current-page="currentPage" v-model:page-size="currentPageSize"
      :page-sizes="pagination.pageSizes" :layout="pagination.layout" :total="totalCount" popper-class="fileLibraryPage"
      @current-change="handleCurrentChange" @size-change="handleSizeChange" />
  </div>
  <testCase :visible="testDataVisible" :rowData="testRowData" :close="closeFn" />
</template>

<script setup lang="ts">
import "@/styles/evaluate.scss"
import EmptyStatus from '@/components/EmptyStatus/index.vue'
import { useGroupStore } from "@/store/modules/group";
import { StatusEnum } from "@/enums/KnowledgeEnum";
import { IconAlarm, IconCaretDown, IconCaretUp, IconFilter, IconSearch } from "@computing/opendesign-icons";
import testCase from "./testCase.vue";
import { storeToRefs } from "pinia";
import FilterContainr from "@/components/TableFilter/index.vue";
import EvaluateAPI from "@/api/evaluate";
import CustomLoading from '@/components/CustomLoading/index.vue';
import { debounce } from "lodash";
import dataSetAPI from "@/api/dataSet";
import KbAppAPI from "@/api/kbApp";
import { convertUTCToLocalTime } from "@/utils/convertUTCToLocalTime";
import { downloadFun } from "@/utils/downloadFun";

const {t} = useI18n();
const route = useRoute();
const testList:any = ref([]);
const store = useGroupStore();
const { knowledgeTabActive } = storeToRefs(store);
const { handleKnowledgeTab } = store;
const batchDownBth = ref(false);
const testingTableRef = ref();
const selectedRow = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const totalCount = ref(testList.value.length);
const currentPageSize = ref(20);
const pagination = ref({
  pageSizes: [10, 20, 30, 40, 50],
  layout: 'total,sizes,prev,pager,next,jumper',
});
const testDataVisible = ref(false);
let testRowData: any = ref({});
const modelFilterVisible = ref(false);
const statusFilterVisible = ref(false);
const searchFilterVisible = ref(false);
const creatorVisible = ref(false);
const searchRef = ref();
const modelRef = ref();
const statusRef = ref();
const creatorRef = ref();
const searchList = ref([]);
const statusList = [
  {
    value: StatusEnum.SUCCESS,
    label: t('testing.testingStatus.success'),
  },
  {
    value: StatusEnum.FAIL,
    label: t('testing.testingStatus.failed'),
  },
  {
    value: StatusEnum.ANALYSIS_ING,
    label: t('testing.testingStatus.pending'),
  },
  {
    value: StatusEnum.RUNNING,
    label: t('testing.testingStatus.running'),
  },
  {
    value: StatusEnum.CANCEL,
    label: t('testing.testingStatus.canceled'),
  },
]
const checkedFilterList = ref([]);
const pollingKfTimer = ref();
const searchPayload = ref<{
  kbId?: string,
  testingId?: string,
  testingName?: string,
  llmId?: string[],
  runStatus?: string[],
  scoresOrder?: string | null,
  topK?:string,
  authorName?: string,
  searchMethod?: string,
  [key: string]: any,
}>({});
const llmOptions = ref<Array<{
    label: string,
    value: string,
    icon: string
}>>([]);

const searchType = ref<string>('testingName');

const isSearch = computed(()=>{
  return Object.values(searchPayload.value).some(value => {
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return true;
    return value !== null && value !== undefined; // 其他类型需非空
  });
})

const handleSearchData = () => {
  handeAssetLibraryData(
    {
      page: 1,
      pageSize: currentPageSize.value ?? 20,
      kbId: route.query.kb_id as string,
      ...handleSearchPayload(),
    },
    true,
    true
  );
  currentPage.value = 1;
  statusFilterVisible.value = false;
  modelFilterVisible.value = false;
  searchFilterVisible.value = false;
  creatorVisible.value = false
};
const handleBatchDownBth = (e: boolean) => {
  batchDownBth.value = e;
};
const handleSelectType=()=>{
  searchPayload.value.testingName = '';
  searchPayload.value.authorName = '';
  handleSearchData()
}
const handleInput = debounce((value: string) => {
  searchPayload.value[searchType.value] = value;
  currentPage.value = 1;
  let param = {
    ...searchPayload.value,
    page: currentPage.value,
    pageSize: currentPageSize.value
  };
  loading.value = true;
  EvaluateAPI.testingList({kbId:route.query.kb_id,...param}).then((res: any) => {
    testList.value = res.datasetTestings?.map((item: any) => {
      const newItem={
        datasetId: item.datasetId,
        datasetName: item.datasetName,
        children:item.testings,
      }
      return newItem;
    });
    totalCount.value = res.totalCount;
  }).finally(() => {
    loading.value = false;
  })
}, 200);

const handleCreate = () => {
  handleKnowledgeTab('dataset');
}

const handleSelectionChange = (val: any) => {

  let selectArr: any = [];
  val.forEach((item: any) => {
    if (!item.datasetId) {
      selectArr.push(item)
    }
  })
  selectedRow.value = selectArr;
};
const handleSizeChange = (pageSize: number) => {
  console.log(pageSize);
  currentPageSize.value = pageSize;
  let param = {
    ...searchPayload.value,
    page: currentPage.value,
    pageSize: pageSize,
  };
  queryTestList(param);
};
const handleCurrentChange = (pageNum: number) => {
  console.log(pageNum);
  currentPage.value = pageNum;
  let param = {
    ...searchPayload.value,
    page: pageNum,
    pageSize: currentPageSize.value,
  };
  queryTestList(param);
};

const handleTestData = (row: any) => {
  testDataVisible.value = true;
  testRowData.value = row;
}
const handleRunTesting = (isRun: boolean, row: any) => {
  let param = {
    testingId: row.testingId,
    run: isRun,
  }
  EvaluateAPI.runTesting(param).then((res) => {
    handeAssetLibraryData(
      {
        kbId: route.query.kb_id as string,
        page: currentPage.value,
        pageSize: currentPageSize.value,
      },
      true,
      true
    );
  })
}
const handleStopTesting = (row: any) => {
  ElMessageBox.confirm(t('dialogTipText.stopTesting'), 
    t('dialogTipText.tipsText'), 
    {
      confirmButtonText: t('btnText.confirm'),
      cancelButtonText: t('btnText.cancel'),
      cancelButtonClass: 'el-button--primary',
      confirmButtonClass: 'el-button-confirm',
      type: 'warning',
      icon:markRaw(IconAlarm)
      }).then(() => {
        handleRunTesting(false, row);
      })
}
const handleDownload = (row: any) => {
  const url = `${window.origin}/witchaind/api/testing/download?testingId=${row.testingId}`;
  downloadFun(url);
}
const handleBatchDownload = () => {
  let flag = true;
  selectedRow.value.forEach((item: any) => {
    if (item?.testingTask?.taskStatus !== 'success') {
      flag = false;
    }
  })
  if(!flag){
    ElMessage.error(t('dialogTipText.testDownloadTips'));
    return;
  }
  selectedRow.value.forEach((item: any) => {
    setTimeout(()=>{
      handleDownload(item)
    },300)
  })
}

const handleDelete = (arr: any) => {
  let idList = arr.map((item: any) => {
    return item.testingId
  })
  EvaluateAPI.deleteTesting(idList).then((res) => {
    handeAssetLibraryData(
      {
        kbId: route.query.kb_id as string,
        page: currentPage.value,
        pageSize: currentPageSize.value,
      },
      true,
      true
    );
  })
}

const handleSingleDelete = (row: any) => {
  ElMessageBox.confirm(
    `${t('dialogTipText.confirmDelSingleTesting')}【${row.testingName}】？`,
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
    handleDelete([row]);
  })
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(
    t('dialogTipText.consfirmDelTesting'),
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
    handleDelete(selectedRow.value);
  })
}
const handelStatusFilterProper = (filterList: any) => {
  searchPayload.value.runStatus = filterList;
  handleSearchData();
};
const handelModelFilterProper = (filterList: any) => {
  searchPayload.value.llmId = filterList;
  handleSearchData();
};
const handelSearchFilterProper = (filterList: any) => {
  searchPayload.value.searchMethod = filterList;
  handleSearchData();
}
const closeFn = () => {
  testDataVisible.value = false;
}

const queryTestList = (params: any) => {
  loading.value = true;
  EvaluateAPI.testingList({kbId:route.query.kb_id,...params}).then((res: any) => {
    testList.value = res.datasetTestings?.map((item: any) => {
      const newItem={
        datasetId: item.datasetId,
        datasetName: item.datasetName,
        children:item.testings,
      }
      return newItem;
    });
    totalCount.value = res?.total || 0;
  }).finally(() => {
    loading.value = false;
  })
}
const handlePollAssetFileData = () => {
  if (!route.query.kb_id || pollingKfTimer.value === null) {
    clearInterval(pollingKfTimer.value);
    return;
  }
  EvaluateAPI.testingList({
    page: currentPage.value,
    pageSize: currentPageSize.value,
    kbId: route.query.kb_id as string,
    ...handleSearchPayload(),
  })
    .then((res: any) => {
      testList.value = (res?.datasetTestings || []).map((item: any) => {
        const newItem={
          datasetId: item.datasetId,
          datasetName: item.datasetName,
          children:item.testings,
        }
        return newItem;
      });
      totalCount.value = res?.total || 0;
    })
    .finally(() => {
      loading.value = false;
    });
};
const handleStartPollTimer = () => {
  pollingKfTimer.value = setInterval(() => handlePollAssetFileData(), 15000);
};
const handleSearchPayload = () => {
  return Object.entries(searchPayload.value).reduce((acc, [key, value]) => {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      return acc; // 移除空值或空数组的字段
    }
    // 处理特殊字段类型转换
    acc[key] = typeof value === 'string' 
        ? value.trim() 
        : value;
    return acc;
  }, {} as Record<string, unknown>);
};
const handleSearchOpsData = (loadingStatus: boolean, startPollTimer: boolean) => {
  handeAssetLibraryData(
    {
      page: currentPage.value,
      pageSize: currentPageSize.value,
      kbId: route.query.kb_id as string,
      ...handleSearchPayload(),
    },
    loadingStatus,
    startPollTimer
  );
};
const handeAssetLibraryData = (
  payload: any,
  loadingStatus: boolean,
  pollTimer: boolean
) => {
  if (pollTimer) {
    handleCleartTimer();
  }
  loading.value = loadingStatus;
  EvaluateAPI.testingList(payload)
    .then((res: any) => {
      if (!res?.datasetTestings?.length && currentPage.value && currentPage.value !== 1) {
        currentPage.value = 1;
        handleSearchOpsData(true, true);
        return;
      }
      testList.value = (res?.datasetTestings || []).map((item: any) => {
        const newItem={
          datasetId: item.datasetId,
          datasetName: item.datasetName,
          children:item.testings,
        }
        return newItem;
      });
      totalCount.value = res.total;
      if (pollTimer) {
        handleStartPollTimer();
      }
    })
    .finally(() => {
      loading.value = false;
    });
};

watch(()=>knowledgeTabActive.value, () => {
  if (knowledgeTabActive.value === 'evaluation') {
    handeAssetLibraryData(
      {
        kbId: route.query.kb_id as string,
        page: 1,
        pageSize: 20,
      },
      true,
      true
    );
    currentPage.value = 1;
    currentPageSize.value = 20;
    dataSetAPI.queryLlmData().then((res:any)=>{
        llmOptions.value = res.llms?.map((item: any) => {
            return { label: item.llmName, value: item.llmId,icon:item.llmIcon };
        });
    })
    KbAppAPI.querySearchMethodList().then((res: any) => {
        searchList.value = res?.map((item: any) => {
            return { label: item, value: item };
        });
    });
  }else{
    handleCleartTimer();
  }
})
onMounted(() => {
  const kbId = route.query.kb_id;
  if (kbId?.length && knowledgeTabActive.value === 'evaluation' ) {
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
});

const handleCleartTimer = () => {
  clearInterval(pollingKfTimer.value);
  pollingKfTimer.value = null;
};

onUnmounted(() => {
  handleCleartTimer();
});
</script>
