<template>
  <div class="knowledge-form-container">
    <!-- Section导航 -->
    <div class="section-navigation">
      <div 
        v-for="section in sections" 
        :key="section.key"
        class="section-tab"
        :class="{ active: activeSection === section.key, completed: completedSections.includes(section.key) }"
        @click="handleSectionClick(section.key)">
        <span class="section-title">{{ section.title }}</span>
        <el-icon v-if="completedSections.includes(section.key)" class="check-icon">
          <IconSuccess />
        </el-icon>
      </div>
    </div>

    <!-- 表单内容 -->
    <el-form
      ref="ruleFormRef"
      :model="ruleForm"
      :rules="rules"
      label-width="auto"
      class="kl-ruleForm o-form-has-require"
      :size="formSize"
      label-position="left">
      
      <!-- 基本设置 -->
      <div v-show="activeSection === 'basic'" class="form-section">
        <el-form-item
          :label="$t('assetLibrary.name')"
          prop="kbName">
          <el-input
            v-model="ruleForm.kbName"
            class="o-validate-input"
            minlength="1"
            maxlength="20"
            :placeholder="$t('assetLibrary.message.pleasePlace')" >
            <template #suffix>
              <el-icon class="error-icon" >
                <img :src="getSvgUrl('fail.svg')" />
              </el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item
          :label="$t('assetLibrary.desc')"
          prop="description"
          class="config-size-desc">
          <el-input
            v-model="ruleForm.description"
            maxlength="150"
            show-word-limit
            type="textarea"
            :placeholder="$t('assetLibrary.message.pleasePlace')" />
        </el-form-item>
      </div>

      <!-- 解析设置 -->
      <div v-show="activeSection === 'parse'" class="form-section">
        <el-form-item
          :label="$t('assetLibrary.analyticMethod')"
          prop="defaultParseMethod">
          <el-select
            v-model="ruleForm.defaultParseMethod"
            :placeholder="$t('assetLibrary.message.pleaseChoose')"
            :suffix-icon="IconCaretDown"
            popper-class="analyticMethodSelect">
            <el-option
              v-for="item in parserMethodOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value" />
          </el-select>
        </el-form-item>
        
        <!-- 分块设置 -->
        <div class="chunk-settings">
          <div class="chunk-header">{{ $t('chunkMethod.chunkSettings') }}</div>
          <el-form-item :label="$t('chunkMethod.chunkMethod')" prop="chunkMethod">
            <el-select
              v-model="ruleForm.chunkMethod"
              :placeholder="$t('chunkMethod.pleaseSelectChunkMethod')"
              :suffix-icon="IconCaretDown">
              <el-option :label="$t('chunkMethod.default')" value="semantic" />
              <el-option :label="$t('chunkMethod.customDelimiter')" value="mark" />
            </el-select>
          </el-form-item>
          
          <el-form-item 
            :label="$t('chunkMethod.chunkIdentifier')" 
            prop="chunkIdentifier"
            v-if="ruleForm.chunkMethod === 'mark'">
            <el-input
              v-model="ruleForm.chunkIdentifier"
              :placeholder="$t('chunkMethod.pleaseEnterChunkIdentifier')"
              maxlength="50" />
          </el-form-item>
          
          <el-form-item :label="$t('assetLibrary.fileChunkSize')" prop="defaultChunkSize">
            <template #label>
              {{ $t('assetLibrary.fileChunkSize') }}
              <el-tooltip
                :content="$t('formTipText.fileChunkSizeTip')"
                placement="top"
                popper-class="fileChunkSizeTip"
                effect="light">
                <el-icon class="icon-help">
                  <IconHelpCircle />
                </el-icon>
              </el-tooltip>
            </template>
            <el-input-number
              class="config-size"
              v-model="ruleForm.defaultChunkSize"
              controls-position="right"
              :min="128"
              :max="1024"
            />
            <span class="form-right-tip">{{ locale === 'zh' ? '（128~1024）' : '（128~1024 characters）' }}</span>
          </el-form-item>
          
          <el-form-item :label="$t('assetLibrary.uploadCountLimit')" prop="uploadCountLimit">
            <el-input-number
              class="config-size"
              v-model="ruleForm.uploadCountLimit"
              controls-position="right"
              :min="1"
              :max="100" />
            <span class="form-right-tip">（1~100）</span>
          </el-form-item>
          
          <el-form-item :label="$t('assetLibrary.uploadSizeLimit')" prop="uploadSizeLimit">
            <template #label>
              {{ $t('assetLibrary.uploadSizeLimit') }}
              <el-tooltip
                :content="$t('formTipText.uploadSizeLimitTip')"
                placement="top"
                popper-class="uploadSizeLimitTip"
                effect="light">
                <el-icon class="icon-help">
                  <IconHelpCircle />
                </el-icon>
              </el-tooltip>
            </template>
            <el-input-number
              class="config-size"
              v-model="ruleForm.uploadSizeLimit"
              controls-position="right"
              :min="128"
              :max="2048" />
            <span class="form-right-tip">{{ locale === 'zh' ? '（128~2048MB）' : '（128~2048MB）' }}</span>
          </el-form-item>
        </div>
        
        <!-- 向量化设置 -->
        <div class="vectorization-settings">
          <div class="vectorization-header">{{ $t('vectorization.vectorizationSettings') }}</div>
          <el-form-item
            :label="$t('assetLibrary.embeddedModel')"
            prop="embeddingModel">
            <template #label>
              {{ $t('assetLibrary.embeddedModel') }}
              <el-tooltip
                :content="$t('formTipText.analyticTip')"
                placement="top"
                popper-class="analyticTipBox"
                effect="light">
                <el-icon class="icon-help">
                  <IconHelpCircle />
                </el-icon>
              </el-tooltip>
            </template>

            <el-select
              v-model="ruleForm.embeddingModel"
              :placeholder="$t('assetLibrary.message.pleaseChoose')"
              :teleported="false"
              class="select-container"
              :disabled="props.formData?.id"
              :suffix-icon="IconCaretDown">
              <el-option
                v-for="item in emBeddingModelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value">
                <div class="model-option">
                  <div class="model-icon" v-if="item.icon">
                    <img :src="item.icon" :alt="item.label" class="model-icon-img" />
                  </div>
                  <span>{{ item.label }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </div>
      </div>

      <!-- 检索设置 -->
      <div v-show="activeSection === 'retrieval'" class="form-section">
        <el-form-item
          :label="$t('assetLibrary.language')"
          prop="tokenizer">
          <el-select
            v-model="ruleForm.tokenizer"
            :placeholder="$t('assetLibrary.message.pleaseChoose')"
            :suffix-icon="IconCaretDown"
            :teleported="false"
            class="select-container">
            <el-option
              v-for="item in languageOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value" />
          </el-select>
        </el-form-item>
        
        <el-form-item 
          label="Reranker" 
          prop="rerankerModel">
          <el-select
            v-model="ruleForm.rerankerModel"
            placeholder="请选择Reranker"
            :suffix-icon="IconCaretDown">
            <el-option
              v-for="item in rerankerOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value">
              <div class="model-option">
                <div class="model-icon" v-if="item.icon">
                  <img :src="item.icon" :alt="item.label" class="model-icon-img" />
                </div>
                <span>{{ item.label }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        
        
      </div>


      <!-- 操作按钮 -->
      <el-form-item
        class="kl-ops-btn"
        :class="!props.configInfo ? 'kl-create-ops-btn' : null">
        <el-button
          class="resetBtn"
          type="primary"
          :disabled="isSubmitDisabled"
          :loading="createLoading"
          @click="submitForm(ruleFormRef)">
          {{ props.configInfo ? $t('btnText.save') : $t('btnText.confirm') }}
        </el-button>
        <el-button
          class="resetBtn cancelBtn"
          @click="handleCancelForm()">
          {{ $t('btnText.cancel') }}
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref, watch, onMounted } from 'vue';
import { ElLoading, ElMessage, type ComponentSize, type FormInstance, type FormRules } from 'element-plus';
import {
  IconCaretDown,
  IconDelete,
  IconSuccess,
  IconHelpCircle,
} from '@computing/opendesign-icons';
import TextTooltip from '@/components/TextSingleTootip/index.vue';
import { useAssets } from '@/composables/useAssets';
import { v4 as uuidv4 } from 'uuid';
import KbAppAPI from '@/api/kbApp';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { matchEmbeddingModelOption, matchRerankerModelOption, getUserPreferences } from '@/utils/userPreferences';

const route = useRoute()
const { t, locale} = useI18n();
const { getSvgUrl } = useAssets();
const loading = ElLoading.service({
  visible: false,
  text: `${t('pageTipText.Loading')}...`,
  background: 'rgba(122, 122, 122, 0.5)',
});
interface RuleForm {
  // 基本设置
  kbName: string;
  description: string;
  // 解析设置
  defaultParseMethod: string;
  chunkMethod: string; // semantic | mark
  chunkIdentifier: string; // 分块标识符
  defaultChunkSize: number;
  uploadCountLimit: number;
  // 向量化设置
  embeddingModel: string;
  tokenizer: string;
  // 检索设置
  rerankerModel: string;
  // 其他
  docTypes: any[];
  uploadSizeLimit: number;
  [property: string]: any;
}

const formSize = ref<ComponentSize>('default');
const ruleFormRef = ref<FormInstance>();
const createLoading = ref(false);
const isSubmitDisabled = ref(true);

// Section导航相关状态
const activeSection = ref('basic');
const completedSections = ref<string[]>([]);
const sections = ref([
  { key: 'basic', title: t('tabs.basicSettings') },
  { key: 'parse', title: t('tabs.parseSettings') },
  { key: 'retrieval', title: t('tabs.retrievalSettings') }
]);

const ruleForm = ref<RuleForm>({
  // 基本设置
  kbName: '',
  description: '',
  // 解析设置
  defaultParseMethod: '',
  chunkMethod: 'semantic', // 默认语义分块
  chunkIdentifier: '\\n\\n', // 默认分块标识符
  defaultChunkSize: 512,
  uploadCountLimit: 128,
  // 向量化设置
  embeddingModel: '',
  tokenizer: '',
  // 检索设置
  rerankerModel: '',
  // 其他
  docTypes: [],
  uploadSizeLimit: 512,
});

const languageOptions = ref<Array<{label: string, value: string}>>([]);
const emBeddingModelOptions = ref<Array<{label: string, value: string, icon?: string, id?: string, rawData?: any}>>([]);
const parserMethodOptions = ref<Array<{label: string, value: string}>>([]);
const rerankerOptions = ref<Array<{label: string, value: string, method: string, name: string, icon?: string, id?: string, rawData?: any}>>([]);
const languageApiData = ref<any[]>([]); // 存储API返回的原始数据
const embeddingRawData = ref<any[]>([]); // 存储Embedding模型的原始完整数据
const rerankerRawData = ref<any[]>([]); // 存储Reranker模型的原始完整数据

// 生成分词器选项的函数
const generateLanguageOptions = () => {
  const isZhLocale = locale.value?.includes('zh') || locale.value === 'zh-cn' || locale.value === '中文';
  languageOptions.value = languageApiData.value?.map((item: any) => {
    let label = item;
    // 根据API返回的值和当前语言环境显示标签
    if (item === 'zh' || item === '中文') {
      label = isZhLocale ? '中文' : 'Chinese';
    } else if (item === 'en' || item === 'english') {
      label = isZhLocale ? '英语' : 'English';
    }
    return {
      label,
      value: item,
    };
  }) || [];
};

// 更新reranker选项的函数
const updateRerankerOptions = (rerankerRes: any) => {
  // 处理不同的API响应格式
  let rerankerData = [];
  if (rerankerRes?.result) {
    // 如果响应有result字段
    rerankerData = rerankerRes.result;
  } else if (Array.isArray(rerankerRes)) {
    // 如果响应直接是数组
    rerankerData = rerankerRes;
  } else if (rerankerRes?.data) {
    // 如果响应有data字段
    rerankerData = rerankerRes.data;
  }
  
  // 保存原始数据
  rerankerRawData.value = rerankerData;
  
  rerankerOptions.value = rerankerData?.map((item: any) => ({
    label: item.rerankName || item.rerankerName,
    value: item.rerankName || item.rerankerName,
    method: item.rerankProvider || item.rerankMethod,
    name: item.rerankName || item.rerankerName,
    icon: item.rerankIcon,
    id: item.rerankId,
    rawData: item // 存储完整的原始数据
  })) || [];
};

const props = defineProps({
  handelResetForm: {
    type: Function,
    default: () => {},
  },
  handleCloseCreateKb: {
    type: Function,
    default: () => {},
  },
  handleOpsKbForm: {
    type: Function,
    default: () => {},
  },
  formData: {
    type: <any>{},
  },
  configInfo: {
    type: Boolean,
  },
  handleQueryKbData: {
    type: Function,
    default: () => {},
  },
  isCreate: {
    type: Boolean,
    default: true,
  },
});

onMounted(async () => {
  loading.visible.value = false;
  
  ruleForm.value = props.formData
    ? JSON.parse(
        JSON.stringify({
          ...props.formData,
          docTypes: props.formData?.docTypes.filter(
            (item: any) => item?.docTypeName?.length
          ),
          defaultChunkSize: props.formData.defaultChunkSize || 512,
          uploadSizeLimit: props.formData?.uploadSizeLimit || 512,
          uploadCountLimit: props.formData?.uploadCountLimit || 128,
          chunkMethod: props.formData?.chunkMethod || 'semantic',
          chunkIdentifier: props.formData?.chunkIdentifier || '\\n\\n',
          // 保留父组件传递的tokenizer值
          tokenizer: props.formData?.tokenizer || '',
          // 处理reranker字段映射：优先使用rerankerModel，如果没有则从rerankName获取
          rerankerModel: props.formData?.rerankerModel || props.formData?.rerankName || '',
        } as RuleForm)
      )
    : ruleForm.value;

  // 并行请求
  const [languageRes, embeddingRes, parseMethodRes, rerankerRes] = await Promise.all([
    KbAppAPI.queryLanguageList(),
    KbAppAPI.queryEmbeddingModelList(),
    KbAppAPI.queryParseMethodList(),
    KbAppAPI.queryRerankerList(),
  ]);
  
  // 处理语言选项
  languageApiData.value = languageRes as unknown as [];
  generateLanguageOptions();
  
  // 处理嵌入模型选项
  const embeddingData = (embeddingRes as unknown as any)?.result || (embeddingRes as unknown as []);
  
  // 保存原始数据
  embeddingRawData.value = Array.isArray(embeddingData) ? embeddingData : [];
  
  emBeddingModelOptions.value = Array.isArray(embeddingData) ? embeddingData.map((item: any) => {
    // 如果item是对象（新格式），提取字段
    if (typeof item === 'object' && item.embeddingName) {
      return {
        label: item.embeddingName,
        value: item.embeddingName,
        icon: item.embeddingIcon,
        id: item.embeddingId,
        rawData: item // 存储完整的原始数据
      };
    }
    // 如果item是字符串（旧格式），直接使用
    return {
      label: item,
      value: item,
    };
  }) : [];

  // 处理解析方法选项
  parserMethodOptions.value = (parseMethodRes as unknown as [])?.map((item: any) => ({
    label: item,
    value: item,
  }));
  
  // 处理reranker选项 - 使用分组方式展示完整信息
  updateRerankerOptions(rerankerRes);
  
  // 如果是创建状态，设置默认值
  if (props.isCreate) {
    ruleForm.value.kbName = t('defaultText.kbName');
    
    // 根据当前i18n locale来决定默认分词器
    // API返回的tokenizer值为：["中文", "en"]
    const isChineseLanguage = locale.value?.includes('zh') || locale.value === 'zh-cn' || locale.value === '中文';
    
    // 根据用户语言选择对应的分词器：中文选"中文"，其他选"en"
    ruleForm.value.tokenizer = isChineseLanguage ? '中文' : 'en';
    
    // 根据用户偏好设置embedding模型默认值
    const userPreferences = getUserPreferences();
    const preferredEmbedding = matchEmbeddingModelOption(emBeddingModelOptions.value, userPreferences.embeddingModelPreference);
    ruleForm.value.embeddingModel = preferredEmbedding?.value || emBeddingModelOptions.value?.[0].value || '';
    
    ruleForm.value.defaultParseMethod = parserMethodOptions.value?.[0].value || '';
    
    // 根据用户偏好设置reranker模型默认值
    if (!ruleForm.value.rerankerModel) {
      const preferredReranker = matchRerankerModelOption(rerankerOptions.value, userPreferences.rerankerPreference);
      if (preferredReranker) {
        ruleForm.value.rerankerModel = preferredReranker.value;
      } else {
        // 如果没有偏好设置，默认选择jaccard dis reranker
        const defaultReranker = rerankerOptions.value?.find(item => item.name === 'jaccard dis reranker');
        ruleForm.value.rerankerModel = defaultReranker?.value || rerankerOptions.value?.[0]?.value || '';
      }
    }
  }
});

// 检查section完成状态
const checkSectionCompletion = () => {
  const sectionFields = {
    basic: ['kbName'],
    parse: ['defaultParseMethod', 'chunkMethod', 'defaultChunkSize', 'uploadCountLimit', 'uploadSizeLimit', 'embeddingModel'],
    retrieval: ['tokenizer']
  };
  
  const completed: string[] = [];
  
  Object.entries(sectionFields).forEach(([sectionKey, fields]) => {
    const isComplete = fields.every(field => {
      const value = ruleForm.value[field];
      if (field === 'chunkIdentifier' && ruleForm.value.chunkMethod !== 'mark') {
        return true; // 条件字段，不影响完成状态
      }
      return value !== undefined && value !== null && value !== '';
    });
    
    if (isComplete) {
      completed.push(sectionKey);
    }
  });
  
  completedSections.value = completed;
};

watch(
  ruleForm,
  () => {
    let flag = false;
    Object.keys(ruleForm.value).forEach((item) => {
      const ruleCopy = rules?.[item];
      if ((Array.isArray(ruleCopy) ? ruleCopy[0] : ruleCopy)?.required) {
        if (!ruleForm.value?.[item]?.toString().length) {
          flag = true;
        }
      }
    });

    isSubmitDisabled.value = flag;
    checkSectionCompletion(); // 检查section完成状态
  },
  { deep: true }
);

// 监听语言切换，重新生成分词器选项和更新tabs标题
watch(
  locale,
  () => {
    if (languageApiData.value.length > 0) {
      generateLanguageOptions();
    }
    // 更新tabs标题
    sections.value = [
      { key: 'basic', title: t('tabs.basicSettings') },
      { key: 'parse', title: t('tabs.parseSettings') },
      { key: 'retrieval', title: t('tabs.retrievalSettings') }
    ];
  }
);

// Section导航处理函数
const handleSectionClick = (sectionKey: string) => {
  activeSection.value = sectionKey;
};


const rules = reactive<FormRules<RuleForm>>({
  // 基本设置
  kbName: [
    {
      required: true,
      message: t('assetLibrary.message.name'),
      trigger: ['blur', 'change'],
    },
    {
      min: 1,
      message: t('assetLibrary.message.libraryNameLen'),
      trigger: ['blur', 'change'],
    },
  ],
  // 解析设置
  defaultParseMethod: [
    {
      required: true,
      message: t('assetLibrary.message.analyticMethodPlace'),
      trigger: ['blur', 'change'],
    },
  ],
  chunkMethod: [
    {
      required: true,
      message: t('chunkMethod.pleaseSelectChunkMethod'),
      trigger: ['blur', 'change'],
    },
  ],
  defaultChunkSize: [
    {
      message: t('assetLibrary.message.pleasePlace'),
      trigger: ['blur', 'change'],
      required: true,
    },
  ],
  uploadCountLimit: [{ required: true }],
  // 向量化设置
  tokenizer: [
    {
      required: true,
      message: t('assetLibrary.message.languagePlace'),
      trigger: ['blur', 'change'],
    },
  ],
  embeddingModel: [
    {
      required: true,
      message: t('assetLibrary.message.modelPlace'),
      trigger: ['blur', 'change'],
    },
  ],
  uploadSizeLimit: [
    {
      required: true,
      message: t('assetLibrary.message.uploadSizeLimitPlace'),
      trigger: ['blur', 'change'],
    },
  ],
});

const handleCopyTextToclipboard = (text: string) => {
  const input = document.createElement('input');
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  ElMessage({
    showClose: true,
    message: t('assetLibrary.copySuccessFul'),
    icon: IconSuccess,
    customClass: 'o-message--success',
    duration: 3000,
  });
  document.body.removeChild(input);
};

onMounted(() => {
  const isTransList = document.querySelectorAll('.is-transparent');
  isTransList?.forEach((el) => {
    const span = el.querySelector('span');
    if (span?.innerHTML === t('assetLibrary.message.pleaseChoose')) {
      el.classList.add('removeIsTrans');
    }
  });
});

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate((valid) => {
    // 根据选中的embeddingModel找到对应的原始数据以获取 embedding_id
    const selectedEmbedding = emBeddingModelOptions.value.find(item => item.value === ruleForm.value.embeddingModel);
    const embeddingId = selectedEmbedding?.rawData?.embeddingId || null;
    const embeddingName = selectedEmbedding?.rawData?.embeddingName || ruleForm.value.embeddingModel;
    console.log('[KnowledgeForm] Selected embeddingId:', embeddingId, 'embeddingName:', embeddingName);
    
    // 根据选中的rerankerModel找到对应的原始数据以获取 rerank_id
    const selectedReranker = rerankerOptions.value.find(item => item.value === ruleForm.value.rerankerModel);
    const rerankId = selectedReranker?.rawData?.rerankId || null;
    const rerankName = selectedReranker?.name || ruleForm.value.rerankerModel;
    const rerankMethod = selectedReranker?.method || 'algorithm';
    console.log('[KnowledgeForm] Selected rerankId:', rerankId, 'rerankName:', rerankName, 'rerankMethod:', rerankMethod);
    
    let payload = {
      // 基本设置
      kbName: ruleForm.value.kbName,
      description: ruleForm.value.description,
      // 解析设置
      defaultParseMethod: ruleForm.value.defaultParseMethod,
      chunkMethod: ruleForm.value.chunkMethod,
      chunkIdentifier: ruleForm.value.chunkIdentifier,
      defaultChunkSize: ruleForm.value.defaultChunkSize,
      uploadCountLimit: ruleForm.value.uploadCountLimit,
      // 向量化设置
      embeddingModel: ruleForm.value.embeddingModel, // 用于展示的embedding模型名称
      embedding_id: embeddingId, // 后端需要的embedding ID
      embeddingName: embeddingName, // embedding名称
      tokenizer: ruleForm.value?.tokenizer?.toLocaleLowerCase(),
      // 检索设置
      enableReranker: true, // 固定为true，始终启用reranker
      rerankerModel: ruleForm.value.rerankerModel, // 用于展示的reranker模型名称
      rerank_id: rerankId, // 后端需要的rerank ID
      rerankMethod: rerankMethod, // 用于展示的reranker方法字段
      rerankName: rerankName, // 用于展示的reranker名称字段
      enableCompression: false, // 固定为false，不再提供UI配置
      enableDocumentCategory: false, // 固定为false，不再提供UI配置
      enableContextAssociation: true, // 固定为true，不再提供UI配置
      // 其他
      uploadSizeLimit: ruleForm.value.uploadSizeLimit,
      docTypes: ruleForm.value.docTypes.filter((item) => item.docTypeName.length > 0),
    };
    console.log('[KnowledgeForm] Final payload:', payload);
    if (valid) {
      loading.visible.value = true;
      createLoading.value = true;
      if (ruleForm.value?.kbId) {
        KbAppAPI.updateKbLibrary({
          kbId: ruleForm.value.kbId,
        },payload)
          .then((res) => {
            props.handleOpsKbForm();
            if (props.configInfo) {
              props.handleQueryKbData();
            }
            ElMessage({
              showClose: true,
              message: t('opsMessage.modifSuccess'),
              icon: IconSuccess,
              customClass: 'o-message--success',
              duration: 3000,
            });
            ruleForm.value.docTypes = (res as any).docTypes;
          })
          .finally(() => {
            loading.visible.value = false;
            createLoading.value = false;
          });
      } else {
        let docArr:any = []
        ruleForm.value.docTypes.map((item) => {
          docArr.push({
            docTypeId:item.docTypeId,
            docTypeName:item.docTypeName
          })
        } )
        // 兼容两种URL参数格式：team_id（新）和 id（旧）
        const teamId = (route.query.team_id || route.query.id)?.toString() ?? '';
        KbAppAPI.createKbLibrary({teamId: teamId},{
          ...payload,
          docTypes: docArr
        })
          .then(() => {
            props.handleOpsKbForm();
          })
          .finally(() => {
            loading.visible.value = false;
            createLoading.value = false;
          });
      }
      if (!props.configInfo) {
        props.handelResetForm();
      }
    }
  });
};

const handleCancelForm = () => {
  props.handleCloseCreateKb();
};

const handleRemoveDocType = (index: number) => {
  ruleForm.value.docTypes.splice(index, 1);
};

const handleRemoveAllDocType = () => {
  ruleForm.value.docTypes.splice(0);
};

const handleAddDocType = () => {
  ruleForm.value.docTypes.push({
    docTypeId: uuidv4(),
    docTypeName: '',
  });
  
  // 添加后自动滚动到底部，确保新增的输入框可见
  setTimeout(() => {
    // 获取所有的domain-config元素
    const domainConfigs = document.querySelectorAll('.domain-config');
    // 获取最后一个（即新添加的）元素
    const lastDomainConfig = domainConfigs[domainConfigs.length - 1];
    if (lastDomainConfig) {
      // 使用scrollIntoView滚动到新添加的元素
      lastDomainConfig.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, 100); // 增加延迟时间，确保DOM已更新
};
</script>

<style lang="scss" scoped>
.knowledge-form-container {
  width: 100%;
  max-width: 100%;
  
  // Section导航样式
  .section-navigation {
    display: flex;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--o-border-color-light);
    background: var(--o-bg-color-light);
    border-radius: 6px 6px 0 0;
    
    .section-tab {
      position: relative;
      padding: 12px 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      border-radius: 6px 6px 0 0;
      display: flex;
      align-items: center;
      gap: 8px;
      
      .section-title {
        font-size: 12px;
        color: var(--o-text-color-secondary);
        font-weight: 400;
      }
      
      .check-icon {
        font-size: 14px;
        color: var(--o-color-success);
      }
      
      &:hover {
        background: var(--o-bg-color-base);
        
        .section-title {
          color: var(--o-text-color-primary);
        }
      }
      
      &.active {
        background: var(--o-bg-color-base);
        border-bottom: 2px solid var(--o-color-primary);
        
        .section-title {
          color: var(--o-color-primary);
          font-weight: 500;
        }
      }
      
      &.completed:not(.active) {
        .section-title {
          color: var(--o-color-success);
        }
      }
    }
  }
  
  // 表单section样式
  .form-section {
    padding: 16px 0;
    // 移除固定最小高度，让内容自适应
  }
  
  // 分块设置和向量化设置的卡片样式
  .chunk-settings,
  .vectorization-settings {
    margin-top: 20px;
    padding: 16px;
    background: var(--o-bg-color-light);
    border-radius: 6px;
    border: 1px solid var(--o-border-color-light);
    
    .chunk-header,
    .vectorization-header {
      font-size: 13px;
      font-weight: 500;
      color: var(--o-text-color-primary);
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--o-border-color-light);
    }
  }
  
  // Top K滑块组合样式
  .slider-input-group {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 280px;
    
    .top-k-slider {
      flex: 1;
      min-width: 0;
      margin-right: 0;
      max-width: 200px;
    }
    
    .top-k-input {
      flex-shrink: 0;
    }
  }
  
  // 表单右侧提示文字
  .form-right-tip {
    margin-left: 8px;
    font-size: 12px;
    color: var(--o-text-color-secondary);
    white-space: nowrap;
  }
}

// 操作按钮区域样式
:deep(.kl-ops-btn) {
  margin-bottom: 0 !important;
  padding-top: 16px;
  border-top: 1px solid var(--o-border-color-light);
  
  .el-form-item__content {
    display: flex;
    justify-content: center;
    width: 100%;
    gap: 12px;
  }
  
  .resetBtn {
    height: 32px;
    padding: 0 20px;
    font-size: 12px;
  }
  
  .cancelBtn {
    background: transparent;
    border: 1px solid var(--o-border-color);
    color: var(--o-text-color-primary);
    
    &:hover {
      border-color: var(--o-color-primary);
      color: var(--o-color-primary);
    }
  }
}

// 表单项样式优化
:deep(.kl-ruleForm) {
  .el-form-item {
    gap: 16px;
    margin-bottom: 20px;
    display: flex;
    align-items: flex-start; // 改为顶部对齐，避免换行时的问题
    
    .el-form-item__label {
      display: flex;
      align-items: center;
      padding: 0;
      font-size: 12px;
      color: var(--o-text-color-secondary);
      min-width: 120px;
      max-width: 160px;
      white-space: nowrap;
      flex-shrink: 0;
      line-height: 32px; // 与input高度对齐
      
      .icon-help {
        margin-left: 4px;
        margin-top: 0;
        color: #8d98aa;
        font-size: 16px;
        cursor: pointer;
        
        &:hover {
          color: #409eff;
        }
      }
    }
    
    .el-form-item__content {
      flex: 1;
      
      .el-input,
      .el-select,
      .el-textarea {
        width: 100%;
        max-width: 280px;
        font-size: 12px;
      }
      
      .el-input__inner {
        font-size: 12px;
      }
      
      .el-textarea__inner {
        height: 88px;
        font-size: 12px;
      }
    }
    
    // 特殊处理长标签
    &:has(.el-form-item__label:contains("单次文档上传个数上限")) {
      .el-form-item__label {
        min-width: 140px;
        max-width: 140px;
      }
    }
  }
  
  // 数字输入框样式
  .config-size {
    width: 100px;
    max-width: 100px;
    
    .el-input-number__increase,
    .el-input-number__decrease {
      background: transparent;
      width: 20px;
      
      .el-icon {
        color: #8d98aa;
      }
    }
    
    .el-input__wrapper {
      width: 60px;
      padding-left: 20px;
      padding-right: 20px;
    }
    
    .el-input__inner {
      width: 60px;
      padding-left: 5px;
      padding-right: 5px;
      text-align: center;
    }
  }
  
  // 开关样式
  .el-switch {
    --el-switch-on-color: #409eff;
    --el-switch-off-color: #dcdfe6;
  }
  
  // 滑块样式
  .el-slider {
    .el-slider__runway {
      height: 6px;
    }
    
    .el-slider__button {
      width: 16px;
      height: 16px;
    }
  }
}

// 错误图标样式
:deep(.error-icon) {
  display: none; // 默认隐藏错误图标
}

:deep(.o-validate-input.is-error + .error-icon) {
  display: block; // 只在验证错误时显示
}

// 模型选择器图标样式
.model-option {
  display: flex;
  align-items: center;
  gap: 8px;
  
  .model-icon {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .model-icon-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 2px;
    }
  }
  
  span {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>