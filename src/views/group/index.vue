<template>
    <UserHeaderBar />
    <CustomLoading :loading="loading" />
    <div class="group-container">
        <div class="group-box">
            <el-tabs type="card" class="group-tabs" default-active="mycreated" v-model="activeName"
                @tab-change="handleTabChange">
                <el-tab-pane 
                    class="group-tabs-item" 
                    v-for="tab in groupTabs" 
                    :name="tab.name" 
                    :key="tab.name"
                    :label="tab.label"
                >
                    <div class="group-tab-header">
                        <div>
                            <el-button 
                                v-if="tab.name === 'mycreated'" 
                                type="primary" 
                                class="group-btn"
                                @click="handleCreateGroup(true)"
                            >
                                {{ $t('group.createTeam') }}
                            </el-button>
                        </div>
                        <div class="group-right-btn">
                            <div class="group-btn-search">
                                <el-input ref="inputRef" v-model="teamSearchName" @input="handleInputSearch"
                                    class="o-style-serch" :placeholder="$t('group.pleaseInput')" clearable>
                                    <template #suffix>
                                        <el-icon class="el-input__icon">
                                            <IconSearch />
                                        </el-icon>
                                    </template>
                                </el-input>
                            </div>
                            <div class="group-btn-switch">
                                <div class="group-btn-switch-icon" @click="handleSwitch('thumb')"
                                    :class="switchIcon === 'thumb' ? 'bgThumb' : ''">
                                    <el-icon>
                                        <IconThumbnail />
                                    </el-icon>
                                </div>

                                <div class="group-btn-switch-icon" @click="handleSwitch('list')"
                                    :class="switchIcon === 'list' ? 'bgThumb' : ''">
                                    <el-icon>
                                        <IconList />
                                    </el-icon>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="group-content-container" :style="groupList.length === 0? 'height: calc(100vh - 408px)' : ''">
                        <!-- 卡片布局 -->
                        <div v-if="switchIcon === 'thumb'" class="" :class="groupList.length === 0 ? 'group-card-empty-mid' : 'group-tabs-content'">
                            <div v-if="groupList.length === 0" class="group-card-empty empty_box">
                                <div class="empty_img empty_pending"></div>
                                <div class="empty_text">{{ $t('group.noData') }}</div>
                            </div>
                            <div v-else class="group-card-item" 
                                v-for="item in groupList" 
                                :key="item.teamId" 
                                @click="handleToGroup(item)">
                                <div class="group-card-title">
                                    <span class="group-card-title-name">{{ item.teamName }}</span>
                                    <span v-if="item.isPublic" class="card-type card-type-public">{{ $t('group.public') }}</span>
                                    <span v-else class="card-type card-type-privacy">{{ $t('group.private') }}</span>
                                </div>
                                <div class="group-card-desc">
                                    <el-tooltip popper-class="desc-popper" effect="dark" :content="item.description"
                                        placement="top">
                                        {{ item.description }}
                                    </el-tooltip>
                                </div>
                                <div class="group-card-footer">
                                    <div class="info">
                                        <el-tooltip :content="`@${item.authorName}`" placement="top" :disabled="item.authorName && item.authorName.length <= 8">
                                            <span class="author-name">@{{ item.authorName }}</span>
                                        </el-tooltip>
                                        <span class="member-count">
                                            <img :src="getImageUrl('member_count.svg')" />
                                            {{ item.memberCount }}{{ $t('group.people') }}
                                        </span>
                                    </div>
                                    <!-- 我创建的团队显示编辑按钮 -->
                                    <el-button v-if="tab.name === 'mycreated'" text @click.stop="handleEditKl(item)">
                                        {{ $t('btnText.edit') }}
                                    </el-button>
                                    <!-- 全部团队tab中，我创建的显示编辑按钮 -->
                                    <el-button 
                                        v-else-if="tab.name === 'all' && item.isMyCreated" 
                                        text 
                                        @click.stop="handleEditKl(item)"
                                    >
                                        {{ $t('btnText.edit') }}
                                    </el-button>
                                    <!-- 全部团队tab中，已加入但非我创建的显示退出按钮 -->
                                    <el-button 
                                        v-else-if="tab.name === 'all' && item.isJoined && !item.isMyCreated" 
                                        text 
                                        @click.stop="handleQuitTeam(item)"
                                    >
                                        {{ $t('group.quit') }}
                                    </el-button>
                                    <!-- 全部团队tab中，未加入的显示申请加入按钮 -->
                                    <el-button 
                                        v-else-if="tab.name === 'all' && !item.isJoined" 
                                        text
                                        size="small"
                                        :loading="item.applying"
                                        @click.stop="handleApplyToJoin(item)"
                                    >
                                        {{ $t('group.applyToJoin') }}
                                    </el-button>
                                    <!-- 我加入的团队显示退出按钮 -->
                                    <el-button 
                                        v-else-if="tab.name === 'myjoined'" 
                                        text 
                                        @click.stop="handleQuitTeam(item)"
                                    >
                                        {{ $t('group.quit') }}
                                    </el-button>
                                </div>
                            </div>
                        </div>
                        <!-- 列表布局 -->
                        <div class="group-table-box" v-else>
                            <el-table :data="groupList" :border="true" max-height="640" >
                                <template #empty>
                                    <div class="table-empty-box">
                                        <div class="table-empty-img"></div>
                                        <div>暂无数据</div>
                                    </div>
                                </template>
                                <el-table-column prop="teamName" :label="$t('group.teamName')" width="200"
                                    class-name="group-name">
                                    <template #default="scope">
                                        <el-tooltip :content="scope.row.teamName" placement="top" >
                                            <span 
                                                class="group-name-row table-row-content" 
                                                @click="handleToGroup(scope.row)">
                                                {{ scope.row.teamName }}
                                            </span>
                                        </el-tooltip>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="description" :label="$t('group.teamDesc')" width="200" >
                                    <template #default="scope">
                                        <el-tooltip :content="scope.row.description" placement="top" >
                                            <div class="table-row-content">{{ scope.row.description }}</div>
                                        </el-tooltip>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="memberCount" width="150" :label="$t('group.teamSize')" />
                                <el-table-column prop="isPublic" width="150" :label="$t('group.teamAuth')">
                                    <template #default="scope">
                                        <span v-if="scope.row.isPublic" class="card-type card-type-public">{{ $t('group.public') }}</span>
                                        <span v-else class="card-type card-type-privacy">{{ $t('group.private') }}</span>
                                    </template>
                                </el-table-column>
                                <el-table-column prop="authorName" width="150" :label="$t('group.owner')" />
                                <el-table-column prop="createdTime" width="150" :label="$t('group.createTime')" >
                                    <template #default="scope">
                                        {{ convertUTCToLocalTime(scope.row.createdTime)}}
                                    </template>
                                </el-table-column>
                                <el-table-column prop="action" :label="$t('btnText.operation')" width="120">
                                    <template #default="scope">
                                        <!-- 我创建的团队显示编辑按钮 -->
                                        <el-button v-if="activeName === 'mycreated'" text @click="handleEditKl(scope.row)">
                                            {{ $t('btnText.edit') }}
                                        </el-button>
                                        <!-- 全部团队tab中，我创建的显示编辑按钮 -->
                                        <el-button 
                                            v-else-if="activeName === 'all' && scope.row.isMyCreated" 
                                            text 
                                            @click="handleEditKl(scope.row)"
                                        >
                                            {{ $t('btnText.edit') }}
                                        </el-button>
                                        <!-- 全部团队tab中，已加入但非我创建的显示退出按钮 -->
                                        <el-button 
                                            v-else-if="activeName === 'all' && scope.row.isJoined && !scope.row.isMyCreated" 
                                            text 
                                            @click="handleQuitTeam(scope.row)"
                                        >
                                            {{ $t('group.quit') }}
                                        </el-button>
                                        <!-- 全部团队tab中，未加入的显示申请加入按钮 -->
                                        <el-button 
                                            v-else-if="activeName === 'all' && !scope.row.isJoined" 
                                            type="primary" 
                                            size="small"
                                            :loading="scope.row.applying"
                                            @click="handleApplyToJoin(scope.row)"
                                        >
                                            {{ $t('group.applyToJoin') }}
                                        </el-button>
                                        <!-- 我加入的团队显示退出按钮 -->
                                        <el-button 
                                            v-else-if="activeName === 'myjoined'" 
                                            text 
                                            @click="handleQuitTeam(scope.row)"
                                        >
                                            {{ $t('group.quit') }}
                                        </el-button>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>
                    </div>
                    <el-pagination class="group-pagination"
                        v-if="groupList?.length > 0" :current-page="currentPage" :page-size="currentPageSize"
                        :page-sizes="pagination.pageSizes" :layout="pagination.layout" :total="totalCount"
                        popper-class="fileLibraryPage" @size-change="handleSizeChange"
                        @current-change="handleCurrentChange" 
                    />
                </el-tab-pane>
            </el-tabs>
        </div>
    </div>
    <CreateGroup 
        :createGroupVisible="createGroupVisible" 
        :handlequeryTeamList="handlequeryTeamList"
        :dialogueType="dialogueType" 
        :currentRow="currentRow" 
        :close="() => handleCreateGroup(false)" 
    />
</template>
<script lang="ts" setup>
import UserHeaderBar from '@/components/UserHeaderBar/index.vue';
import CustomLoading from '@/components/CustomLoading/index.vue';
import "@/styles/group.scss"
import {
    IconList,
    IconSearch,
    IconThumbnail,
} from '@computing/opendesign-icons';
import { ref, onMounted, watch } from 'vue';
import { debounce } from 'lodash';
import { useAssets } from '@/composables/useAssets';
import router from '@/router/index';
import { useGroupStore } from '@/store/modules/group.js';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import CreateGroup from './createGroup.vue';
import GroupAPI from '@/api/group';
import { TabPaneName } from 'element-plus';
import { convertUTCToLocalTime } from '@/utils/convertUTCToLocalTime';

const { getImageUrl } = useAssets();
const { t, locale} = useI18n();

const groupStore = useGroupStore();
const { setCurTeamInfo } = groupStore;

const activeName = ref('all');
const currentRow = ref({});
const dialogueType = ref('create');
let groupList = ref<any>([]);

const pagination = ref({
    pageSizes: [10, 20, 30, 40, 50],
    layout: 'total,sizes,prev,pager,next,jumper',
});
const currentPage = ref(1);
const totalCount = ref(groupList.value.length);
const currentPageSize = ref(20);
const loading = ref(false);

const handleTabChange = (tabName: TabPaneName) => {
    activeName.value = tabName.toString();
    teamSearchName.value = '';
    currentPage.value = 1;
    let param = {
        teamType: tabName.toString(),
        page: currentPage.value,
        pageSize: currentPageSize.value
    };
    handlequeryTeamList(param);
};

const handleCurrentChange = (pageNum: number) => {
    currentPage.value = pageNum;
    let param = {
        teamType: activeName.value,
        teamName: teamSearchName.value,
        page: pageNum,
        pageSize: currentPageSize.value,
    };
    handlequeryTeamList(param);
};

const handleSizeChange = (pageSize: number) => {
    currentPageSize.value = pageSize;
    currentPage.value = 1; // 切换每页显示数量时重置为第一页
    let param = {
        teamType: activeName.value,
        teamName: teamSearchName.value,
        page: 1,
        pageSize: pageSize,
    };
    handlequeryTeamList(param);
};

const { navGroup } = storeToRefs(useGroupStore());

const groupTabs = ref([
    {
        label: t('group.allTeams'),
        name: 'all',
    },
    {
        label: t('group.myCreate'),
        name: 'mycreated',
    },
    {
        label: t('group.myJoin'),
        name: 'myjoined',
    },
])
watch(()=>t('') , () => {
    groupTabs.value = [
        {
            label: t('group.allTeams'),
            name: 'all',
        },
        {
            label: t('group.myCreate'),
            name: 'mycreated',
        },
        {
            label: t('group.myJoin'),
            name: 'myjoined',
        },
    ];
}, { immediate: true,deep: true });

const switchIcon = ref('thumb');
const teamSearchName = ref();
const createGroupVisible = ref(false);

const handleCreateGroup = (value: boolean) => {
    createGroupVisible.value = value;
    currentRow.value = {};
    dialogueType.value = 'create';
}

const handleEditKl = (row: any) => {
    currentRow.value = row;
    createGroupVisible.value = true;
    dialogueType.value = 'edit';
}

const handleInputSearch = debounce(() => {
    currentPage.value = 1;
    let param = {
        teamType: activeName.value,
        teamName: teamSearchName.value,
        page: currentPage.value,
        pageSize: currentPageSize.value
    };
    handlequeryTeamList(param);
}, 200);

const handleSwitch = (switchType: string) => {
    switchIcon.value = switchType;
};
const handleToGroup = async (row: any) => {
    // 如果团队未加入，显示提示消息并阻止进入详情页
    if (row.isJoined === false) {
        ElMessage.warning(t('group.notJoinedTeam'));
        return;
    }
    
    localStorage.setItem('teamId', row.teamId);
    await router.push({ path: `/groupInfo`, query: { name: row.teamName, id: row.teamId } });
    let groupNav = navGroup.value;
    groupNav[1] = {
        name: row.teamName,
        path: '/groupInfo',
        query: {
            name: row.teamName,
            id: row.teamId
        }
    }
    setCurTeamInfo(row);
}

const handlequeryTeamList = async (param: { teamType: string, page: number, pageSize: number, teamName?: string }) => {
    loading.value = true;
    try {
        if (param.teamType === 'all') {
            // 获取全部团队：公开团队 + 我加入的团队 + 我创建的团队
            const [publicRes, joinedRes, createdRes] = await Promise.all([
                GroupAPI.teamList({ teamType: 'public', page: 1, pageSize: 1000, teamName: param.teamName }),
                GroupAPI.teamList({ teamType: 'myjoined', page: 1, pageSize: 1000, teamName: param.teamName }),
                GroupAPI.teamList({ teamType: 'mycreated', page: 1, pageSize: 1000, teamName: param.teamName })
            ]);
            
            const publicTeams = (publicRes as any)?.teams || [];
            const joinedTeams = (joinedRes as any)?.teams || [];
            const createdTeams = (createdRes as any)?.teams || [];
            
            // 创建我创建的团队ID集合
            const createdTeamIds = new Set(createdTeams.map((team: any) => team.teamId));
            
            // 合并已加入和创建的团队，标记为已加入
            const myTeams = [...joinedTeams, ...createdTeams];
            const myTeamIds = new Set(myTeams.map((team: any) => team.teamId));
            
            // 处理公开团队，标记是否已加入和是否我创建
            const processedPublicTeams = publicTeams.map((team: any) => ({
                ...team,
                isJoined: myTeamIds.has(team.teamId),
                isMyCreated: createdTeamIds.has(team.teamId),
                applying: false
            }));
            
            // 处理我的团队，标记为已加入和是否我创建
            const processedMyTeams = myTeams.map((team: any) => ({
                ...team,
                isJoined: true,
                isMyCreated: createdTeamIds.has(team.teamId),
                applying: false
            }));
            
            // 合并所有团队，去重
            const allTeamsMap = new Map();
            [...processedPublicTeams, ...processedMyTeams].forEach((team: any) => {
                if (!allTeamsMap.has(team.teamId)) {
                    allTeamsMap.set(team.teamId, team);
                } else {
                    // 如果团队已存在，优先保留已加入和创建者的状态
                    const existingTeam = allTeamsMap.get(team.teamId);
                    if (team.isJoined) {
                        allTeamsMap.set(team.teamId, { ...existingTeam, isJoined: true, isMyCreated: team.isMyCreated || existingTeam.isMyCreated });
                    }
                }
            });
            
            const allTeams = Array.from(allTeamsMap.values()).sort((a: any, b: any) => 
                new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime()
            );
            
            // 手动分页
            const start = (param.page - 1) * param.pageSize;
            const end = start + param.pageSize;
            groupList.value = allTeams.slice(start, end);
            totalCount.value = allTeams.length;
        } else {
            // 原有逻辑
            const res = await GroupAPI.teamList(param) as any;
            groupList.value = res.teams;
            totalCount.value = res.total;
        }
    } catch (error) {
        console.error('获取团队列表失败:', error);
        groupList.value = [];
        totalCount.value = 0;
    } finally {
        loading.value = false;
    }
}

// 申请加入团队
const handleApplyToJoin = async (team: any) => {
    try {
        team.applying = true;
        await GroupAPI.applyToJoinTeam(team.teamId);
        ElMessage.success(`已成功申请加入团队"${team.teamName}"`);
        // 可以选择刷新团队列表或更新团队状态
    } catch (error) {
        console.error('申请加入团队失败:', error);
        ElMessage.error('申请加入团队失败，请重试');
    } finally {
        team.applying = false;
    }
};

// 退出团队
const handleQuitTeam = async (team: any) => {
    try {
        await ElMessageBox.confirm(
            t('group.confirmQuit', { teamName: team.teamName }),
            t('dialogTipText.tipsText'),
            {
                confirmButtonText: t('btnText.confirm'),
                cancelButtonText: t('btnText.cancel'),
                type: 'warning',
            }
        );
        
        // 使用当前团队的 teamId 获取当前用户的 user_sub
        const response = await GroupAPI.getCurrentUserRole(team.teamId);
        let userSub = '';
        if (response) {
            const data = response as any;
            userSub = data.userSub || data.user_sub || '';
        }
        
        if (!userSub) {
            ElMessage.error('无法获取当前用户信息，请重试');
            return;
        }
        
        await GroupAPI.quitTeam({
            teamId: team.teamId,
            userSubs: [userSub]
        });
        
        ElMessage.success(t('group.quitSuccess', { teamName: team.teamName }));
        
        // 刷新团队列表
        let param = {
            teamType: activeName.value,
            teamName: teamSearchName.value,
            page: currentPage.value,
            pageSize: currentPageSize.value
        };
        handlequeryTeamList(param);
    } catch (error: any) {
        if (error !== 'cancel') {
            console.error('退出团队失败:', error);
            ElMessage.error(t('group.quitFailed'));
        }
    }
};

onMounted(() => {
    let param = {
        teamType: activeName.value,
        teamName: teamSearchName.value,
        page: currentPage.value,
        pageSize: currentPageSize.value
    };
    handlequeryTeamList(param);
})

</script>
<style lang="scss">
    .desc-popper {
        max-width: 376px !important;
    }
</style>