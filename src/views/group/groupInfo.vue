<template>
  <GroupLayout>
    <!-- 知识库内容 -->
    <template v-slot:default>
        <div>
          <knowledgeLibrary :groupName="groupName" />
        </div>
    </template>
  </GroupLayout>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import GroupLayout from '@/components/GroupLayout/index.vue';
import knowledgeLibrary from "@/views/knowledgeLibrary/index.vue";

const route = useRoute();
const groupName = route.query.team_name as string;
</script>