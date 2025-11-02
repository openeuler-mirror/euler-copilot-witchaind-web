<template>
    <div class="group-info">
        <!-- 通用标题部分 -->
        <div class="group-info-title">
            <div class="group-left-menu">
                <div class="group-menu-item">
                    <el-link @click="handleHomeClick" type="primary" class="home-menu" :underline="false">
                    {{ $t('group.witchaind') }}
                </el-link>
                </div>
                <div v-if="breadcrumbs.length > 1" class="group-menu-item">
                    <!-- 第二级（团队名）：始终可点击，点击后跳转到资产库列表 -->
                    <div class="library-name" @click="handleBreadcrumbClick(breadcrumbs[1])">
                        <el-link class="home-menu" type="primary" target="_blank" :underline="false">
                            /
                            {{ breadcrumbs[1]?.name }}
                        </el-link>
                    </div>
                </div>
                <div v-if="breadcrumbs.length > 2" class="group-menu-item">
                    <!-- 第三级：只在 groupInfo 页面时显示为黑色（资产库列表或团队详情） -->
                    <div v-if="router.currentRoute.value.path.includes('/groupInfo')" class="group-name">
                        <div>/</div>
                        <div class="last-name">
                            {{ breadcrumbs[2]?.name }}
                        </div>
                    </div>
                    <div v-else class="library-name" @click="handleBreadcrumbClick(breadcrumbs[2])">
                        <el-link class="home-menu" type="primary" target="_blank" :underline="false">
                            <span class="last-name">/
                                {{ breadcrumbs[2]?.name }}
                            </span>
                        </el-link>
                    </div>
                </div>
                <div v-if="breadcrumbs.length > 3" class="group-menu-item">
                    <!-- 第四级：在 libraryInfo 页面时显示为黑色（资产库详情） -->
                    <div v-if="router.currentRoute.value.path.includes('/libraryInfo')" class="group-name">
                        <div>/</div>
                        <div class="last-name">
                            {{ breadcrumbs[3]?.name }}
                        </div>
                    </div>
                    <div v-else class="library-name" @click="handleBreadcrumbClick(breadcrumbs[3])">
                        <el-link class="home-menu" type="primary" target="_blank" :underline="false">
                            <span class="last-name">/
                                {{ breadcrumbs[3]?.name }}
                            </span>
                        </el-link>
                    </div>
                </div>
                <div v-if="breadcrumbs.length > 4" class="group-menu-item">
                    <!-- 第五级：文档详情，始终显示为黑色 -->
                    <div class="group-name">
                        <div>/</div>
                        <div class="last-name">
                            {{ breadcrumbs[4]?.name }}
                        </div>
                    </div>
                </div>
            </div>
            <div class="group-mid-menu">
                <div class="section" :class="{ 'section-active': groupMenu === 'knowledge' }"
                    @click="handleSwitchToKnowledge">
                    {{ $t('assetLibrary.assetLibrary') }}
                </div>
                <div class="section" :class="{ 'section-active': groupMenu === 'detail' }"
                    @click="handleSwitchToDetail">
                    {{ $t('group.teamDetail') }}
                </div>
            </div>
        </div>

        <!-- 内容区域 -->
        <div class="group-info-content">
            <!-- 只有在 groupInfo 页面且 groupMenu === 'detail' 时才显示团队详情 -->
            <div v-show="router.currentRoute.value.path === '/groupInfo' && groupMenu === 'detail'">
                <groupDetail />
            </div>

            <!-- 在非团队详情状态时显示默认插槽内容 -->
            <slot v-if="router.currentRoute.value.path !== '/groupInfo' || groupMenu !== 'detail'" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useRouter, useRoute } from 'vue-router';
import { useGroupStore } from "@/store/modules/group";
import { storeToRefs } from 'pinia';
import groupDetail from '@/views/groupDetail/index.vue';
import { computed, watch, onMounted } from 'vue';

const router = useRouter();
const route = useRoute();
const groupStore = useGroupStore();
const { groupMenu } = storeToRefs(groupStore);
const { handleSwitchMenu } = groupStore;

// 组件挂载时，从 URL 读取视图状态
onMounted(() => {
  const viewFromUrl = route.query.view as string;
  
  // 根据路由状态初始化 groupMenu
  if (route.path === '/groupInfo') {
    // 在 groupInfo 页面，根据 view 参数决定状态
    if (viewFromUrl === 'detail' && groupMenu.value !== 'detail') {
      handleSwitchMenu('detail');
    } else if (!viewFromUrl && groupMenu.value !== 'knowledge') {
      handleSwitchMenu('knowledge');
    }
  } else {
    // 不在 groupInfo 页面，应该是 knowledge 状态
    if (groupMenu.value !== 'knowledge') {
      handleSwitchMenu('knowledge');
    }
  }
});

// 监听路由变化，同步视图状态（避免循环调用）
watch(() => [route.path, route.query.view] as const, ([newPath, newView]) => {
  if (newPath === '/groupInfo') {
    // 在 groupInfo 页面，根据 view 参数决定状态
    if (newView === 'detail' && groupMenu.value !== 'detail') {
      handleSwitchMenu('detail');
    } else if (!newView && groupMenu.value !== 'knowledge') {
      handleSwitchMenu('knowledge');
    }
  } else {
    // 不在 groupInfo 页面（libraryInfo/documentInfo），应该是 knowledge 状态
    if (groupMenu.value !== 'knowledge') {
      handleSwitchMenu('knowledge');
    }
  }
});

// 从 URL 构建面包屑导航
const breadcrumbs = computed(() => {
  const crumbs = [
    { name: '知识库', path: '/group', query: {} }
  ];
  
  // 如果有团队信息
  if (route.query.team_id || route.query.id) {
    const teamId = route.query.team_id || route.query.id;
    const teamName = route.query.team_name || route.query.name;
    crumbs.push({
      name: teamName as string || '团队',
      path: '/groupInfo',
      query: {
        team_id: teamId,
        team_name: teamName
      }
    });
  }
  
  // 如果在 groupInfo 页面（团队主页）
  if (route.path === '/groupInfo') {
    if (groupMenu.value === 'detail') {
      // 团队详情页面
      crumbs.push({
        name: '团队详情',
        path: route.path,
        query: { ...route.query, view: 'detail' }
      });
    } else {
      // 资产库列表页面
      crumbs.push({
        name: '资产库',
        path: route.path,
        query: { ...route.query }
      });
    }
    return crumbs;
  }
  
  // 如果有资产库信息（在 libraryInfo 或 documentInfo 页面）
  if (route.query.kb_id) {
    // 先添加"资产库"层级，指向 groupInfo
    const teamId = route.query.team_id || route.query.id;
    const teamName = route.query.team_name || route.query.name;
    crumbs.push({
      name: '资产库',
      path: '/groupInfo',
      query: {
        team_id: teamId,
        team_name: teamName
      }
    });
    
    // 再添加具体的资产库名称层级
    crumbs.push({
      name: route.query.kb_name as string || '资产库详情',
      path: '/libraryInfo',
      query: {
        team_id: teamId,
        team_name: teamName,
        kb_id: route.query.kb_id,
        kb_name: route.query.kb_name
      }
    });
  }
  
  // 如果有文档信息
  if (route.query.file_id) {
    crumbs.push({
      name: route.query.file_name as string || '文档',
      path: '/documentInfo',
      query: { ...route.query }
    });
  }
  
  return crumbs;
});

const handleHomeClick = () => {
    router.push('/group');
    handleSwitchMenu('knowledge');
};

const handleBreadcrumbClick = (breadcrumb: any) => {
    // 如果当前在团队详情，切换到资产库视图
    if(groupMenu.value === 'detail'){
        handleSwitchMenu('knowledge');
    }
    // 跳转时移除 view 参数，确保显示资产库视图
    const targetQuery = { ...breadcrumb.query };
    delete targetQuery.view;
    router.push({ path: breadcrumb.path, query: targetQuery });
}

const handleSwitchToDetail = () => {
    handleSwitchMenu('detail');
    
    // 构建新的 query，只保留团队相关参数，清除资产库和文档相关参数
    const teamId = route.query.team_id || route.query.id;
    const teamName = route.query.team_name || route.query.name;
    const newQuery: any = {
        view: 'detail'
    };
    
    if (teamId) {
        newQuery.team_id = teamId;
    }
    if (teamName) {
        newQuery.team_name = teamName;
    }
    
    // 根据当前路径决定跳转目标
    // 如果在 libraryInfo 或 documentInfo，需要跳回 groupInfo
    if (route.path === '/libraryInfo' || route.path === '/documentInfo') {
        router.push({
            path: '/groupInfo',
            query: newQuery
        });
    } else {
        // 已经在 groupInfo，只更新 query
        router.push({
            path: route.path,
            query: newQuery
        });
    }
}

const handleSwitchToKnowledge = () => {
    handleSwitchMenu('knowledge');
    
    // 如果在 libraryInfo 或 documentInfo，保留当前参数
    if (route.path === '/libraryInfo' || route.path === '/documentInfo') {
        // 保持当前页面，只移除 view 参数
        const newQuery = { ...route.query };
        delete newQuery.view;
        router.push({
            path: route.path,
            query: newQuery
        });
    } else {
        // 在 groupInfo，移除 view 参数并清除资产库相关参数
        const teamId = route.query.team_id || route.query.id;
        const teamName = route.query.team_name || route.query.name;
        const newQuery: any = {};
        
        if (teamId) {
            newQuery.team_id = teamId;
        }
        if (teamName) {
            newQuery.team_name = teamName;
        }
        
        router.push({
            path: route.path,
            query: newQuery
        });
    }
}
</script>


<style lang="scss">
@use '@/styles/grouInfo.scss';
</style>