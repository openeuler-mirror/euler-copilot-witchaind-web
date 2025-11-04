<template>
    <el-dialog 
        class="evaluate-dialog" 
        v-model="props.dialogEvaluateVisible" 
        :title="$t('testing.createTesting')" 
        width="544"
        v-if="props.dialogEvaluateVisible"
        @close="handleCancelVisible"
        align-center
        :close-on-click-modal="false"
    >
        <el-form class="evaluate-form o-form-has-require" ref="ruleFormRef" :model="form" labelPosition="left" :rules="rules" >
            <el-form-item :label="$t('testing.datasetUsed')" :label-width="formLabelWidth" class="evaluate-dataSetName-container" prop="datasetId">
                <div class="evaluate-dataSetName" >
                    {{ props.rowData?.datasetName }}
                </div>
            </el-form-item>
            <el-form-item :label="$t('testing.testingName')" prop="name" :label-width="formLabelWidth" >
                <el-input class="o-validate-input" v-model="form.name" autocomplete="off" :placeholder="t('model.pleasePlace')" maxlength="30" >
                    <template #suffix>
                        <el-icon class="error-icon" >
                            <img :src="getSvgUrl('fail.svg')" />
                        </el-icon>
                    </template>
                </el-input>
            </el-form-item>
            <el-form-item :label="$t('testing.testingDesc')" prop="desc" :label-width="formLabelWidth">
                <el-input v-model="form.desc" show-word-limit maxlength="200" type="textarea" autocomplete="off" :placeholder="t('model.pleasePlace')" />
            </el-form-item>
            <el-form-item :label="$t('testing.type')" prop="type" :label-width="formLabelWidth" class="evaluate-type-container">
                  <img
                    v-if="currentLlmOption && currentLlmOption.icon"
                    :src="currentLlmOption.icon"
                    style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; z-index: 2;"
                    @error="handleImageError"
                />
                <el-select
                    v-model="form.type"
                    :placeholder="t('model.pleasePlace')"
                    :suffix-icon="IconCaretDown"
                    popper-class="custom-llm-select-popper"
                >
                    <el-option
                        v-for="item in llmOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    >
                        <img 
                          v-if="item.icon"
                          :src="item.icon" 
                          style="width: 20px; height: 20px; margin-right: 8px;" 
                          @error="handleImageError"
                        />
                        <span>{{ item.label }}</span>
                    </el-option>
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('testing.method')" prop="method" :label-width="formLabelWidth">
                <el-select v-model="form.method" :placeholder="t('model.pleasePlace')" :suffix-icon="IconCaretDown" @change="handleSearchMethodChange">
                    <el-option
                        v-for="item in parserMethodOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item v-if="showSearchLlm" label="检索模型" prop="searchLlmId" :label-width="formLabelWidth" class="evaluate-type-container">
                  <img
                    v-if="currentSearchLlmOption && currentSearchLlmOption.icon"
                    :src="currentSearchLlmOption.icon"
                    style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); width: 20px; height: 20px; z-index: 2;"
                    @error="handleImageError"
                />
                <el-select
                    v-model="form.searchLlmId"
                    :placeholder="t('model.pleasePlace')"
                    :suffix-icon="IconCaretDown"
                    popper-class="custom-llm-select-popper"
                >
                    <el-option
                        v-for="item in searchLlmOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    >
                        <img 
                          v-if="item.icon"
                          :src="item.icon" 
                          style="width: 20px; height: 20px; margin-right: 8px;" 
                          @error="handleImageError"
                        />
                        <span>{{ item.label }}</span>
                    </el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="Top_k" prop="topk" :label-width="formLabelWidth">
                <el-input-number v-model="form.topk" :min="0" :max="10" />
                <span class="topk-desc">（1~10）</span>
            </el-form-item>
        </el-form>
        <template #footer>
            <div class="dialog-footer">
                <el-button type="primary" :disabled="isSubmitDisabled" @click="handleSubmit(ruleFormRef)">
                    {{ $t('btnText.confirm') }}
                </el-button>
                <el-button @click="handleCancelVisible">
                    {{ $t('btnText.cancel') }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>
<script setup lang="ts">
import { FormInstance, FormRules } from 'element-plus';
import "@/styles/evaluate.scss"
import KbAppAPI from '@/api/kbApp';
import dataSetAPI from '@/api/dataSet';
import EvaluateAPI from '@/api/evaluate';
import { useAssets } from '@/composables/useAssets';
import { useGroupStore } from '@/store/modules/group';
import { IconCaretDown } from '@computing/opendesign-icons';
import { getUserPreferences, findPreferredOption, getSearchMethodPreference } from '@/utils/userPreferences';

const { t, } = useI18n();
const { getSvgUrl } = useAssets();
const store = useGroupStore();
const { handleKnowledgeTab } = store;
const currentLlmOption = computed(() =>
  llmOptions.value.find(item => item.value === form.type)
);
const currentSearchLlmOption = computed(() =>
  searchLlmOptions.value.find(item => item.value === form.searchLlmId)
);
const showSearchLlm = computed(() => 
  ['enhanced_by_llm', 'query_extend'].includes(form.method)
);
const props = defineProps({
    dialogEvaluateVisible: Boolean,
    rowData: Object,
    close: Function,
})

const isSubmitDisabled = ref(false); // false表示不禁用（按钮可用），true表示禁用
const ruleFormRef = ref<FormInstance>()
const formLabelWidth = '60px';
const parserMethodOptions = ref<any>([])
const llmOptions = ref<Array<{
    label: string,
    value: string,
    icon: string,
    rawData?: any  // 存储完整的原始数据
}>>([]);
const searchLlmOptions = ref<Array<{
    label: string,
    value: string,
    icon: string,
    rawData?: any  // 存储完整的原始数据
}>>([]);

let form = reactive({
  name: '',
  type: '',
  desc: '',
  method:'',
  topk:5,
  searchLlmId: '',
})

const rules = reactive<FormRules>({
  name: [
    { required: true, message: t('model.pleasePlace'), trigger: 'change' },
  ],
  type: [
    { required: true, message: t('model.pleasePlace'), trigger: 'change' },
  ],
  desc: [
    { required: true, message: t('model.pleasePlace'), trigger: ['change','blur'] },
  ],
  method: [
    { required: true, message: t('model.pleasePlace'), trigger: 'change' },
  ],
  topk: [
    { required: true, message: t('model.pleasePlace'), trigger: 'change' },
  ],
})

const handleSubmit = async (formEl: FormInstance | undefined) => {
    if (!formEl) return
    await formEl.validate((valid) => {
        if (valid) {
            // 根据选中的主LLM ID找到对应的原始数据以获取llmName
            const selectedLlm = llmOptions.value.find(item => item.value === form.type);
            const llmName = selectedLlm?.label || '';
            
            // 如果需要检索LLM，获取检索LLM的名称
            let searchLlmName = '';
            if (showSearchLlm.value) {
                const selectedSearchLlm = searchLlmOptions.value.find(item => item.value === form.searchLlmId);
                searchLlmName = selectedSearchLlm?.label || '';
            }
            
            let params = {
                testingName: form.name,
                description: form.desc,
                datasetId: props.rowData?.datasetId,
                llmId: form.type, // 后端需要的主LLM ID
                llmName: llmName, // LLM名称
                searchMethod: form.method,
                topK: form.topk,
                searchLlmId: showSearchLlm.value ? form.searchLlmId : undefined, // 后端需要的检索LLM ID
                searchLlmName: showSearchLlm.value ? searchLlmName : undefined // 检索LLM名称
            }
            EvaluateAPI.createTesting(params).then(()=>{
                handleCancelVisible();
                handleKnowledgeTab('evaluation')
            })
        }
    })
}

const handleCancelVisible = () => {
    props.close?.();
    ruleFormRef.value?.resetFields();
}

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  // 隐藏破损的图片
  target.style.display = 'none';
};

const handleSearchMethodChange = () => {
  // 当检索方法改变时，清空searchLlmId
  if (!showSearchLlm.value) {
    form.searchLlmId = '';
  }
};

const initFormData = () => {
    // 重置表单为默认值
    form.name = t('defaultText.testingName');
    form.desc = '';
    form.topk = 5;
    
    // 获取用户偏好设置
    const userPreferences = getUserPreferences();
    
    // 根据用户偏好设置默认检索方法
    const preferredSearchMethod = getSearchMethodPreference();
    if (preferredSearchMethod && parserMethodOptions.value.some((item: any) => item.value === preferredSearchMethod)) {
      form.method = preferredSearchMethod;
    } else {
      form.method = parserMethodOptions.value.length > 0 ? parserMethodOptions.value[0].value : '';
    }
    
    // 根据用户推理模型偏好设置默认模型
    const preferredModel = findPreferredOption(
        llmOptions.value.map(item => ({ llmId: item.value, modelName: item.label })),
        userPreferences.reasoningModelPreference
    );
    
    // 如果找到匹配的偏好模型，使用它；否则使用第一个
    form.type = preferredModel?.llmId || (llmOptions.value.length > 0 ? llmOptions.value[0].value : '');
    
    // 如果检索方法需要检索模型，设置默认检索模型
    if (showSearchLlm.value) {
        const preferredSearchModel = findPreferredOption(
            searchLlmOptions.value.map(item => ({ llmId: item.value, modelName: item.label })),
            userPreferences.reasoningModelPreference
        );
        form.searchLlmId = preferredSearchModel?.llmId || (searchLlmOptions.value.length > 0 ? searchLlmOptions.value[0].value : '');
    } else {
        form.searchLlmId = '';
    }
}

// 检查数据是否已加载
const dataLoaded = ref(false);

onMounted( async () => {
    await KbAppAPI.querySearchMethodList().then((res: any) => {
        parserMethodOptions.value = res?.map((item: any) => {
            return { label: item, value: item };
        });
    }).catch(err => {
        console.error('加载检索方法列表失败:', err);
    });
    
    await dataSetAPI.queryLlmData().then((res:any)=>{
        llmOptions.value = res.llms?.map((item: any) => {
            return { 
                label: item.llmName, 
                value: item.llmId, 
                icon: item.llmIcon,
                rawData: item // 存储完整的原始数据
            };
        });
        // 检索模型选项使用相同的LLM数据
        searchLlmOptions.value = res.llms?.map((item: any) => {
            return { 
                label: item.llmName, 
                value: item.llmId, 
                icon: item.llmIcon,
                rawData: item // 存储完整的原始数据
            };
        });
    }).catch(err => {
        console.error('加载LLM数据失败:', err);
    });
    
    // 标记数据已加载完成
    dataLoaded.value = true;
})
watch(() => props.dialogEvaluateVisible, (newVal) => {
    if (newVal) {
        // 等待数据加载完成后再初始化表单
        const waitForData = () => {
            if (dataLoaded.value && llmOptions.value.length > 0 && parserMethodOptions.value.length > 0) {
                nextTick(() => {
                    initFormData();
                    isSubmitDisabled.value = false; // false = 不禁用 = 可用
                });
            } else {
                // 如果数据还未加载完成，等待后再尝试
                setTimeout(waitForData, 100);
            }
        };
        waitForData();
    }
});


</script>