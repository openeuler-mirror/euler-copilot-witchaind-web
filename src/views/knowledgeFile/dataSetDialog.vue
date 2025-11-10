<template>
  <el-dialog
    v-if="props.generateDialogVisible"
    v-model="props.generateDialogVisible"
    @close="handleCancelVisible"
    class="dataSet-edit-dialog"
    align-center
    width="550"
    :close-on-click-modal="false"
    :title="$t('assetFile.generateDataset')">
    <CustomLoading :loading="loading" />
    <el-form
      ref="ruleFormRef"
      style="max-width: 600px"
      :model="ruleForm"
      :rules="rules"
      label-width="135px"
      class="dataSet-ruleForm o-form-has-require"
      label-position="left">
      <el-form-item
        :label="$t('dataset.datasetName')"
        prop="datasetName"
        class="dataSetName">
        <el-input
          maxlength="30"
          minlength="1"
          class="o-validate-input"
          v-model="ruleForm.datasetName"
          :placeholder="$t('assetLibrary.message.pleasePlace')" >
          <template #suffix>
            <el-icon class="error-icon" >
              <img :src="getSvgUrl('fail.svg')" />
            </el-icon>
          </template>
          </el-input>
      </el-form-item>
      <el-form-item :label="$t('dataset.datasetDesc')" prop="description">
        <el-input :rows="4" show-word-limit type="textarea" v-model="ruleForm.description" maxlength="200"
          :placeholder="$t('assetLibrary.message.pleasePlace')" />
      </el-form-item>
      <el-form-item :label="$t('assetLibrary.fileNum')" prop="documentIds" class="dataSetFileNum">
        <span>{{ props.selectionFileData.length }}</span>
      </el-form-item>

      <el-form-item :label="$t('dataset.datasetNum')" prop="dataCnt" class="dataSetNumber">
        <el-input-number class="config-size" v-model="ruleForm.dataCnt" :min="1" :max="512" />
        <span class="dataSetNumberTip">1～512</span>
      </el-form-item>
      
      <el-form-item :label="$t('testing.type')" prop="llmId" class="datasetLlmType">
        <img
          v-if="currentLlmOption && currentLlmOption.llmIcon"
          :src="currentLlmOption.llmIcon"
          style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; z-index: 2;"
          @error="handleImageError"
        />
        <el-select v-model="ruleForm.llmId" 
          popper-class="custom-llm-select-popper"
          :placeholder="t('assetLibrary.message.pleaseChoose')" 
          :suffix-icon="IconCaretDown">
          <el-option
              v-for="item in llmList"
              :key="item.llmId"
              :label="item.llmName"
              :value="item.llmId" 
          >
              <img 
                v-if="item.llmIcon"
                :src="item.llmIcon" 
                style="width: 20px; height: 20px; margin-right: 8px;" 
                @error="handleImageError"
              />
              <span>{{ item.llmName }}</span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('dataset.isDataCleared')" prop="isDataCleared" class="isDataClean">
        <el-switch v-model="ruleForm.isDataCleared" style="--el-switch-on-color: #13ce66" />
      </el-form-item>
      <el-form-item :label="$t('dataset.isChunkRelated')" prop="isChunkRelated" class="isComContext">
        <el-switch v-model="ruleForm.isChunkRelated" style="--el-switch-on-color: #13ce66" />
      </el-form-item>
      <el-form-item class="kl-ops-btn">
        <el-button class="resetBtn" type="primary" :disabled="isSubmitDisabled" @click="submitForm(ruleFormRef)">
          {{ $t('btnText.confirm') }}
        </el-button>
        <el-button class="resetBtn cancelBtn" @click="handleCancelVisible()">
          {{ $t('btnText.cancel') }}
        </el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>
<script setup lang="ts">
import '@/styles/dataSetDialog.scss';
import dataSetAPI from '@/api/dataSet'
import { ref, reactive, watch, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useGroupStore } from '@/store/modules/group';
import CustomLoading from '@/components/CustomLoading/index.vue';
import { IconCaretDown, } from '@computing/opendesign-icons';
import { useAssets } from '@/composables/useAssets';
import { getUserPreferences, findPreferredOption } from '@/utils/userPreferences';

const store = useGroupStore();
const { handleKnowledgeTab } = store;

const { t } = useI18n();
const { getSvgUrl } = useAssets();

const loading = ref(false);
const route = useRoute();
const ruleForm = ref({
  datasetName: '',
  description: '',
  documentIds: [],
  dataCnt: 0,
  llmId: '',
  isDataCleared: false,
  isChunkRelated: false,
});
const ruleFormRef = ref();
const isSubmitDisabled = ref(true);
const llmList = ref<any[]>([]); // 存储完整的LLM列表数据
const rules = ref({
  datasetName: [
    {
      required: true,
      message: t('model.pleasePlace'),
      trigger: ['blur', 'change'],
    },
  ],
  description: [
    {
      required: true,
      message: t('model.pleasePlace'),
      trigger: ['blur', 'change'],
    },
  ],
  dataCnt: [
    {
      required: true,
      message: t('model.pleasePlace'),
      trigger: ['blur', 'change'],
    },
  ],
  llmId: [
    {
      required: true,
      message: t('assetLibrary.message.pleaseChoose'),
      trigger: ['blur', 'change'],
    },
  ],
});
const props = defineProps({
  generateDialogVisible: {
    type: Boolean,
    default: false,
  },
  handleGenerateDataSet: {
    type: Function,
    default: () => { },
  },
  selectionFileData: {
    type: Array,
    default: [],
  },
  handleClearSelected: {
    type: Function,
    default: () => { },
  },
});

watch(
  () => ruleForm.value,
  () => {
    isSubmitDisabled.value = !Object.keys(rules.value).every((item) => {
      return ruleForm.value[item].toString().length;
    });
  },
  {
    deep: true,
    immediate: true,
  }
);
const currentLlmOption = computed(() =>
  llmList.value.find(item => item.llmId === ruleForm.value.llmId)
);
const handleResetDataSet = () => {
  ruleForm.value = {
    datasetName: '',
    description: '',
    documentIds: [],
    dataCnt: 1,
    llmId: '',
    isDataCleared: false,
    isChunkRelated: false,
  };
  ruleFormRef.value.resetFields();
};

const submitForm = () => {
  loading.value = true;
  
  // 根据选中的llmId找到对应的原始数据以获取必要的信息
  const selectedLlm = llmList.value.find(item => item.llmId === ruleForm.value.llmId);
  const llmName = selectedLlm?.llmName || '';
  
  let param={
    kbId:route.query.kb_id,
    ...ruleForm.value,
    llmName: llmName // 添加LLM名称
  }
  dataSetAPI.createDataSet(param).then(res => {
    handleCancelVisible();
    props.handleClearSelected();
  }).finally(()=>{
    loading.value = false;
    handleKnowledgeTab('dataset')
  })
}

const handleCancelVisible = () => {
  props.handleGenerateDataSet(false);
  handleResetDataSet();
};

const handleImageError = (e) => {
  console.error('图标加载失败:', e.target.src);
  // 隐藏破损的图片
  e.target.style.display = 'none';
};

const initFormData = ()=>{
  ruleForm.value.datasetName = t('defaultText.datasetName');
  ruleForm.value.description = t('defaultText.datasetDesc');
  ruleForm.value.dataCnt = 64;
  ruleForm.value.isDataCleared = false;
  ruleForm.value.isChunkRelated = false;
  
  // 根据用户推理模型偏好设置默认模型
  const userPreferences = getUserPreferences();
  const preferredModel = findPreferredOption(
    llmList.value.map(item => ({ llmId: item.llmId, modelName: item.llmName })),
    userPreferences.reasoningModelPreference
  );
  
  // 如果找到匹配的偏好模型，使用它；否则使用第一个
  ruleForm.value.llmId = preferredModel?.llmId || llmList.value[0]?.llmId || '';

  ruleForm.value.documentIds = props.selectionFileData.map((item) => item.docId);
}

onMounted(() => {
  dataSetAPI.queryLlmData().then(res => {
    llmList.value = res.llms || [];
    // 检查每个LLM的图标数据
    llmList.value.forEach((llm, index) => {
      if (!llm.llmIcon) {
        console.warn(`LLM[${index}] ${llm.llmName} 缺少图标数据`);
      }
    });
  }).catch(err => {
    console.error('加载LLM数据失败:', err);
  })
})
watch(() => props.generateDialogVisible, (newVal) => {
  if (newVal) {
    initFormData();
  }
});

</script>
