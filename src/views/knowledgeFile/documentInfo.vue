<template>
  <GroupLayout>
    <!-- 知识库内容 -->
    <template v-slot:default>
      <div v-show="groupMenu === 'knowledge'">
        <div class="document-info-title">
          <div class="document-info-title-left">
            {{ route.query.file_name }}
          </div>
        </div>
        <el-tabs v-model="activeName" class="document-info-tabs" @tab-click="handleTabClick">
          <el-tab-pane :label="$t('assetFile.documentInfo')" name="documentInfo">
            <knowledgeFileSection />
          </el-tab-pane>
          <el-tab-pane :label="$t('assetFile.log')" name="log">
            <documentLog :activeName="activeName" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>
  </GroupLayout>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useGroupStore } from "@/store/modules/group";
import knowledgeFileSection from "@/views/knowledgeFileSection/index.vue"
import GroupLayout from "@/components/GroupLayout/index.vue"
import documentLog from "@/views/knowledgeFile/documentLog.vue"
import { storeToRefs } from "pinia";
import "@/styles/libraryInfo.scss"

const route = useRoute();
const { groupMenu } = storeToRefs(useGroupStore());

let activeName = ref('documentInfo')
const handleTabClick = (tab: any, event: any) => { }


</script>
<style lang="scss" scoped>
:deep(.el-tabs__nav-wrap:after){
  width: calc(100% - 24px) !important;
}
.document-info-title {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .document-info-title-left {
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 8px;
    line-height: 24px;
    color: var(--o-text-color-primary);
  }

}

  .el-dropdown-menu {
    padding: 4px 0 ;
  }
  .el-dropdown-menu__item {
    font-size: 12px;
  }
</style>