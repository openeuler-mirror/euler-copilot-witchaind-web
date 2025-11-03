<template>
  <GroupLayout>
    <!-- 知识库内容 -->
    <template v-slot:default>
      <div v-show="groupMenu === 'knowledge'">
        <div class="library-info-title">{{ route.query.kb_name }}</div>
        <el-tabs
          v-model="knowledgeTabActive"
          class="library-info-tabs"
          @tab-click="handleTabClick">
          <el-tab-pane
            :label="$t('group.documentMnagement')"
            name="document">
            <knowledgeFile />
          </el-tab-pane>
          <el-tab-pane
            :label="$t('group.datasetManagement')"
            name="dataset">
            <DataSet />
          </el-tab-pane>
          <el-tab-pane
            :label="$t('group.testingManagement')"
            name="evaluation">
            <Evaluate />
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>
  </GroupLayout>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useGroupStore } from '@/store/modules/group';
import knowledgeFile from '@/views/knowledgeFile/index.vue';
import DataSet from '@/views/dataSet/index.vue';
import Evaluate from '@/views/evaluate/index.vue';
import { storeToRefs } from 'pinia';
import '@/styles/libraryInfo.scss';

const route = useRoute();
const store = useGroupStore();
const { groupMenu, knowledgeTabActive } = storeToRefs(store);
const { handleKnowledgeTab } = store;

const handleTabClick = (tab: any) => {
  handleKnowledgeTab(tab.name);
};

import { onBeforeUnmount, onMounted } from 'vue';

// 在组件挂载时保存初始状态
onMounted(() => {
  if (groupMenu.value === 'knowledge') {
    handleKnowledgeTab('document');
  }
});

// 在组件即将卸载前重置状态
onBeforeUnmount(() => {
  try {
    // 只有当前是knowledge状态时才需要重置
    if (groupMenu.value === 'knowledge') {
      handleKnowledgeTab('document');
    }
  } catch (error) {
    console.warn(error);
  }
});
</script>