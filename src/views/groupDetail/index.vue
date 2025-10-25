<template>
    <CustomLoading :loading="loading" />
    <div class="group-detial-container">
        <div class="group-name">{{ groupName }}</div>
        <el-tabs v-model="activeName" class="group-detail-tabs" @tab-click="handleClick">
            <el-tab-pane :label="$t('groupDetail.memberPermission')" name="memberPermission">
                <div class="member-permission-container">
                    <!-- 第一行：操作按钮和搜索框 -->
                    <div class="member-permission-header">
                        <div class="header-left">
                            <el-button type="primary" @click="handleInviteMember" :disabled="!hasRolePermission">
                                {{ $t('groupDetail.inviteMember') }}
                            </el-button>
                            <el-button 
                                :disabled="selectedMembers.length === 0" 
                                @click="handleBatchDeleteMember"
                            >
                                {{ $t('groupDetail.batchDeleteMember') }}
                            </el-button>
                        </div>
                        <div class="header-right">
                            <el-input
                                v-model="memberSearchKeyword"
                                :placeholder="$t('groupDetail.memberFilter')"
                                clearable
                                style="width: 200px;"
                                @input="handleMemberSearch"
                            >
                                <template #suffix>
                                    <el-icon><Search /></el-icon>
                                </template>
                            </el-input>
                        </div>
                    </div>

                    <!-- 表格 -->
                    <div class="table-container">
                        <el-table 
                            :data="paginatedMemberTableData" 
                            style="width: 100%;"
                            row-key="memberId"
                            @selection-change="handleMemberSelectionChange"
                        >
                            <el-table-column width="55">
                                <template #header>
                                    <el-checkbox 
                                        :model-value="isAllMembersSelected"
                                        :indeterminate="isSomeMembersSelected"
                                        @change="(val: any) => handleSelectAllMembers(!!val)"
                                    />
                                </template>
                                <template #default="{ row }">
                                    <el-checkbox 
                                        v-if="row.roleName !== 'owner'"
                                        :model-value="isMemberRowSelected(row)"
                                        @change="(val: any) => handleMemberRowSelection(row, !!val)"
                                    />
                                </template>
                            </el-table-column>
                            
                            <el-table-column :label="$t('groupDetail.memberId')" min-width="120">
                                <template #default="{ row }">
                                    <span>{{ row.userId }}</span>
                                </template>
                            </el-table-column>

                            <el-table-column :label="$t('groupDetail.memberName')" min-width="150">
                                <template #default="{ row }">
                                    <div class="member-info">
                                        <el-avatar 
                                            :size="24" 
                                            class="member-avatar"
                                            :src="row.avatar || getDefaultAvatarUrl()"
                                        >
                                            {{ getUserAvatarContent(row.userName, row.avatar) }}
                                        </el-avatar>
                                        <span class="member-name">{{ row.userName }}</span>
                                    </div>
                                </template>
                            </el-table-column>

                            <el-table-column :label="$t('groupDetail.roleAuth')" min-width="150">
                                <template #default="{ row }">
                                    <!-- 编辑状态显示选择框（仅在有权限且有角色选项时） -->
                                    <el-select 
                                        v-if="editingMemberId === row.userId && hasRolePermission && roleOptions.length > 0"
                                        v-model="row.roleId" 
                                        :placeholder="$t('groupDetail.pleaseSelectRole')"
                                        size="small"
                                        style="width: 120px;"
                                    >
                                        <el-option
                                            v-for="option in roleOptions"
                                            :key="option.value"
                                            :label="option.label"
                                            :value="option.value"
                                        />
                                    </el-select>
                                    <!-- 普通状态或无权限时显示角色名 -->
                                    <span v-else>{{ row.roleName }}</span>
                                </template>
                            </el-table-column>

                            <el-table-column :label="$t('groupDetail.operation')" width="120">
                                <template #default="{ row }">
                                    <!-- 编辑状态时显示保存和取消按钮（仅在有权限且有角色选项时） -->
                                    <template v-if="editingMemberId === row.userId && hasRolePermission && roleOptions.length > 0">
                                        <el-button 
                                            type="text" 
                                            @click="handleSaveMember(row)"
                                            class="table-action-btn"
                                        >
                                            {{ $t('btnText.save') }}
                                        </el-button>
                                        <el-button 
                                            type="text" 
                                            @click="handleCancelEditMember()" 
                                            class="table-action-btn delete-btn"
                                        >
                                            {{ $t('btnText.cancel') }}
                                        </el-button>
                                    </template>
                                    <!-- 普通状态时显示编辑和删除按钮 -->
                                    <template v-else>
                                        <el-button 
                                            type="text" 
                                            @click="handleEditMember(row)"
                                            class="table-action-btn"
                                            :disabled="!row.isEditable || !hasRolePermission"
                                        >
                                            {{ $t('groupDetail.editMember') }}
                                        </el-button>
                                        <el-button 
                                            type="text" 
                                            @click="handleDeleteMember(row)" 
                                            class="table-action-btn delete-btn"
                                            :disabled="!row.isEditable || isCurrentUser(row)"
                                        >
                                            {{ $t('groupDetail.deleteMember') }}
                                        </el-button>
                                    </template>
                                </template>
                            </el-table-column>
                        </el-table>
                        
                        <!-- 分页组件 -->
                        <div class="pagination-container">
                            <el-pagination
                                v-model:current-page="currentPage"
                                v-model:page-size="pageSize"
                                :page-sizes="[10, 20, 50, 100]"
                                :total="total"
                                layout="total, sizes, prev, pager, next, jumper"
                                @size-change="handleSizeChange"
                                @current-change="handleCurrentChange"
                            />
                        </div>
                    </div>
                </div>
            </el-tab-pane>
            <el-tab-pane :label="$t('groupDetail.roleManage')" name="roleManage">
                <div class="role-manage-container">
                    <!-- 第一行：操作按钮和搜索框 -->
                    <div class="role-manage-header">
                        <div class="header-left">
                            <el-button type="primary" @click="handleCreateRole">
                                {{ $t('groupDetail.createRole') }}
                            </el-button>
                            <el-button 
                                :disabled="selectedRoles.length === 0" 
                                @click="handleBatchDelete"
                            >
                                {{ $t('groupDetail.batchDeleteRole') }}
                            </el-button>
                        </div>
                        <div class="header-right">
                            <el-input
                                v-model="roleSearchKeyword"
                                :placeholder="$t('groupDetail.roleFilter')"
                                clearable
                                style="width: 200px;"
                                @input="handleRoleSearch"
                            >
                                <template #suffix>
                                    <el-icon><Search /></el-icon>
                                </template>
                            </el-input>
                        </div>
                    </div>

                    <!-- 表格 -->
                    <div class="table-container">
                        <el-table 
                            :data="flatTableData" 
                            style="width: 100%;"
                            row-key="rowId"
                            @selection-change="handleSelectionChange"
                        >
                        <el-table-column width="55">
                            <template #header>
                                <el-checkbox 
                                    :model-value="isAllRolesSelected"
                                    :indeterminate="isSomeRolesSelected"
                                    @change="(val: any) => handleSelectAll(!!val)"
                                />
                            </template>
                            <template #default="{ row }">
                                <el-checkbox 
                                    v-if="row.type === 'role'"
                                    :model-value="isRowSelected(row)"
                                    :disabled="!getRoleDeletable(row.roleId)"
                                    @change="(val: any) => handleRowSelection(row, !!val)"
                                />
                            </template>
                        </el-table-column>
                        
                        <el-table-column :label="$t('groupDetail.roleName')" min-width="150">
                            <template #default="{ row }">
                                <div v-if="row.type === 'role'" class="role-name-container">
                                    <el-icon 
                                        class="expand-icon" 
                                        @click="toggleRoleExpand(row.roleId!)"
                                    >
                                        <CaretRight v-if="!isRoleExpanded(row.roleId!)" />
                                        <CaretBottom v-else />
                                    </el-icon>
                                    <span class="role-name">{{ row.roleName }}</span>
                                </div>
                            </template>
                        </el-table-column>

                        <el-table-column :label="$t('groupDetail.permissionAssignment')" min-width="400">
                            <template #default="{ row }">
                                <div v-if="row.type === 'permission'" class="permission-row">
                                    <el-checkbox 
                                        :model-value="row.groupAssigned"
                                        :disabled="!getGroupEditable(row.roleId, row.actionType)"
                                        @change="(val: any) => handleGroupPermissionChange(row.roleId, row.actionType, !!val)"
                                        class="permission-group-checkbox"
                                        :class="{ 'disabled-checkbox': !getGroupEditable(row.roleId, row.actionType) }"
                                    >
                                        {{ row.actionType }}
                                    </el-checkbox>
                                    <el-checkbox 
                                        v-for="action in row.actions" 
                                        :key="action.action"
                                        :model-value="action.isUsed"
                                        :disabled="!action.editable"
                                        @change="(val: any) => handleItemPermissionChange(row.roleId, row.actionType, action.action, !!val)"
                                        class="permission-item-checkbox"
                                        :class="{ 'disabled-checkbox': !action.editable }"
                                    >
                                        {{ getActionDisplayName(action) }}
                                    </el-checkbox>
                                </div>
                            </template>
                        </el-table-column>

                        <el-table-column :label="$t('groupDetail.createTime')" width="180">
                            <template #default="{ row }">
                                <span v-if="row.type === 'role'">{{ row.created_time }}</span>
                            </template>
                        </el-table-column>

                        <el-table-column :label="$t('groupDetail.operation')" width="120">
                            <template #default="{ row }">
                                <div v-if="row.type === 'role'">
                                    <el-button 
                                        type="text" 
                                        @click="handleEditRole(row)"
                                        class="table-action-btn"
                                    >
                                        {{ $t('groupDetail.editRole') }}
                                    </el-button>
                                    <el-button 
                                        type="text" 
                                        @click="handleDeleteRole(row)" 
                                        class="table-action-btn delete-btn"
                                        :disabled="!getRoleDeletable(row.roleId)"
                                    >
                                        {{ $t('groupDetail.deleteRole') }}
                                    </el-button>
                                </div>
                            </template>
                        </el-table-column>
                        </el-table>
                    </div>
                </div>
            </el-tab-pane>
            <el-tab-pane :label="$t('groupDetail.teamNews')" name="teamNews">
                <div class="team-news-container" @scroll="handleTeamNewsScroll" ref="teamNewsContainer">
                    <el-timeline style="margin: 10px;">
                        <el-timeline-item
                            v-for="(activity, index) in teamActivities"
                            :key="index"
                            :type="activity.type"
                            hide-timestamp
                        >
                            <div class="timeline-item-content">
                                <div class="avatar-section">
                                    <el-avatar 
                                        :size="32" 
                                        class="user-avatar"
                                        :src="activity.avatar || getDefaultAvatarUrl()"
                                    >
                                        {{ getUserAvatarContent(activity.user_sub, activity.avatar) }}
                                    </el-avatar>
                                </div>
                                <div class="content-section">
                                    <div class="action-text">{{ activity.user_sub }}{{ activity.action }}</div>
                                    <div class="datetime-text">{{ activity.datetime }}</div>
                                </div>
                            </div>
                        </el-timeline-item>
                        
                        <!-- 加载更多指示器 -->
                        <div v-if="teamMessagesLoading" class="loading-more">
                            <el-icon class="is-loading">
                                <Loading />
                            </el-icon>
                            <span>加载中...</span>
                        </div>
                        
                        <!-- 没有更多数据提示 -->
                        <div v-else-if="!hasMoreTeamMessages && teamActivities.length > 0" class="no-more-data">
                            <span>没有更多数据了</span>
                        </div>
                    </el-timeline>
                </div>
            </el-tab-pane>
            <el-tab-pane :label="$t('groupDetail.teamSet')" name="teamSet">
                <el-form :model="form" label-width="auto">
                    <el-form-item prop="name" :label="$t('group.teamName')">
                        <el-input style="width: 400px;" v-model="form.teamName" maxlength="100" />
                    </el-form-item>
                    <el-form-item prop="description" :label="$t('group.teamDesc')">
                        <el-input v-model="form.description" type="textarea" :rows="4" maxlength="200"
                          style="width: 400px;" show-word-limit />
                    </el-form-item>
                    <el-form-item prop="isPublic" :label="$t('group.isPublic')" class="isPublicItem">
                        <el-switch v-model="form.isPublic" style="--el-switch-on-color: rgb(36,171,54); " />
                    </el-form-item>
                    <el-form-item prop="memberCount" :label="$t('group.teamSize')" class="memberCountItem" >
                       {{ form.memberCount }}{{ $t('group.people') }}
                    </el-form-item>
                    <el-form-item prop="transferTeam" :label="$t('groupDetail.transferTeam')">
                        <div>
                            <el-button @click="handleTransferTeam">{{ $t('groupDetail.transfer') }}</el-button>
                            <span class="btn-tips">{{ $t('groupDetail.transferTip') }}</span>
                        </div>
                    </el-form-item>
                    <el-form-item prop="deleteTeam" :label="$t('groupDetail.dissolveTeam')">
                        <div>
                            <el-button @click="handleDeleteTeam" >{{ $t('groupDetail.dissolve') }}</el-button>
                            <span class="btn-tips">{{ $t('groupDetail.dissolveTip') }}</span>
                            <div class="save-btn">
                                <el-button type="primary" :disabled="isSubmitDisabled" @click="onSubmit">{{ $t('btnText.save') }}</el-button>
                            </div>
                        </div>
                    </el-form-item>
                </el-form>
            </el-tab-pane>
        </el-tabs>
        
        <!-- 移交团队对话框 -->
        <el-dialog 
            v-model="transferDialogVisible" 
            :title="$t('groupDetail.transferDialog')" 
            width="500px"
            :before-close="handleTransferCancel"
        >
            <div>
                <!-- Info 类型的消息组件 -->
                <el-alert
                    :title="$t('groupDetail.transferMessage')"
                    type="info"
                    :closable="false"
                    show-icon
                    style="margin-bottom: 20px;"
                />
                
                <!-- 选择接收人 -->
                <el-form label-width="auto">
                    <el-form-item :label="$t('groupDetail.selectReceiver')">
                        <el-select 
                            v-model="selectedReceiver" 
                            :placeholder="$t('groupDetail.pleaseSelectReceiver')"
                            fit-input-width
                        >
                            <el-option
                                v-for="user in filteredUserOptions"
                                :key="user.value"
                                :label="user.label"
                                :value="user.value"
                            />
                        </el-select>
                    </el-form-item>
                </el-form>
            </div>
            
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="handleTransferCancel">{{ $t('btnText.cancel') }}</el-button>
                    <el-button type="primary" @click="handleTransferConfirm">{{ $t('btnText.confirm') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 角色对话框 -->
        <RoleDialog 
            v-model:visible="roleDialogVisible"
            :is-edit="isEditRole"
            :role-data="currentEditRole"
            :role-id="currentEditRole?.roleId"
            @confirm="handleRoleConfirm"
        />

        <!-- 确认修改成员角色对话框 -->
        <el-dialog 
            v-model="memberRoleConfirmVisible" 
            :title="$t('groupDetail.confirmChangeRole')" 
            width="400px"
            :before-close="handleMemberRoleConfirmCancel"
        >
            <div style="text-align: center; padding: 20px 0;">
                <el-icon style="font-size: 48px; color: #E6A23C; margin-bottom: 16px;">
                    <Warning />
                </el-icon>
                <p style="margin: 0; font-size: 14px; color: var(--o-text-color-primary);">
                    确定要将成员 <strong>{{ pendingMemberChange?.userName }}</strong> 的角色从 
                    <strong>{{ pendingMemberChange?.oldRoleName }}</strong> 修改为 
                    <strong>{{ pendingMemberChange?.newRoleName }}</strong> 吗？
                </p>
            </div>
            
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="handleMemberRoleConfirmCancel">{{ $t('btnText.cancel') }}</el-button>
                    <el-button type="primary" @click="handleMemberRoleConfirmOk">{{ $t('btnText.confirm') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <!-- 邀请成员对话框 -->
        <InviteMemberDialog
            v-model:visible="inviteMemberDialogVisible"
            :role-options="roleOptions"
            @confirm="handleInviteMemberConfirm"
        />
    </div>
</template>
<script lang="ts" setup>
import GroupAPI from '@/api/group';
import { useGroupStore } from '@/store/modules/group';
import { useAppStore } from '@/store/modules/app';
import { IconAlarm } from '@computing/opendesign-icons';
import CustomLoading from '@/components/CustomLoading/index.vue';
import RoleDialog from '@/components/RoleDialog/index.vue';
import InviteMemberDialog from '@/components/InviteMemberDialog/index.vue';
import { Search, CaretRight, CaretBottom, Warning, Loading } from '@element-plus/icons-vue';

const groupStore = useGroupStore();
const { curTeamInfo,groupMenu } = storeToRefs(groupStore);
const { handleSwitchMenu, delNav } = groupStore;

const appStore = useAppStore();
const { language } = storeToRefs(appStore);

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const loading = ref(false);

// 各个数据加载状态
const userListLoading = ref(false);
const teamMessagesLoading = ref(false);

const isSubmitDisabled = computed(()=>{
    let oldData = JSON.stringify({teamName:curTeamInfo.value.teamName,description:curTeamInfo.value.description,isPublic:curTeamInfo.value.isPublic})
    let newData = JSON.stringify({teamName:form.value.teamName,description:form.value.description,isPublic:form.value.isPublic})
    return oldData === newData
})

let groupName = ref('');
let activeName = 'memberPermission';
const form = ref({
    teamName: '',
    description: '',
    isPublic: false,
    memberCount: '',
})

// 移交团队对话框相关
const transferDialogVisible = ref(false);
const selectedReceiver = ref('');
// 用户选项数据，从接口获取
const userOptions = ref<{ value: string; label: string }[]>([])

// 过滤后的用户选项（排除owner和无效数据）
const filteredUserOptions = computed(() => {
    return userOptions.value.filter(user => {
        // 过滤掉value为空或无效的用户
        if (!user.value || user.value.trim() === '') {
            return false;
        }
        // 过滤掉owner角色的用户（不能转移给自己）
        const member = memberTableData.value.find(m => m.userId === user.value);
        return member && member.roleName !== 'owner';
    });
})

// 角色对话框相关
const roleDialogVisible = ref(false);
const isEditRole = ref(false);
const currentEditRole = ref<Role | null>(null);

// 成员角色确认对话框相关
const memberRoleConfirmVisible = ref(false);
const pendingMemberChange = ref<{
    userId: string;
    userName: string;
    oldRoleName: string;
    newRoleId: string;
    newRoleName: string;
} | null>(null);

// 当前用户在团队中的信息
const currentTeamUser = ref<CurrentTeamUser | null>(null);

// 邀请成员对话框相关
const inviteMemberDialogVisible = ref(false);

// 团队动态数据类型定义
interface TeamActivity {
    user_sub: string;
    action: string;
    datetime: string;
    type: 'success' | 'info' | 'warning' | 'primary' | 'danger';
    avatar?: string; // 用户头像URL，可选
}

// 当前用户在团队中的信息类型定义
interface CurrentTeamUser {
    user_sub: string;
    team: string;
    role: string;
    is_owner: boolean;
}

// 成员数据类型定义
interface Member {
    userId: string;
    userName: string;
    roleId: string;
    roleName: string;
    isEditable: boolean; // 是否可编辑
    avatar?: string; // 用户头像URL，可选
}

// 角色权限数据类型定义
// 动作项
interface Action {
    action: string;
    actionName: string;
    isUsed: boolean;
    editable?: boolean; // 是否可编辑，默认true
}

// 类型动作（权限组）
interface TypeAction {
    actionType: string;
    actions: Action[];
    assigned?: boolean; // 权限组是否被分配，用于前端勾选状态
    editable?: boolean; // 权限组是否可编辑，默认true
}

// 角色数据结构（直接使用后端字段）
interface Role {
    roleId: string;
    roleName: string;
    typeActions: TypeAction[];
    created_time?: string;
    isEditable?: boolean; // 角色是否可删除，默认false
}

// 表格行数据类型
interface TableRow {
    rowId: string;
    type: 'role' | 'permission';
    roleId?: string;
    roleName?: string;
    created_time?: string;
    actionType?: string;
    actions?: Action[];
    groupAssigned?: boolean;
}

// 团队动态数据，从接口获取
const teamActivities = ref<TeamActivity[]>([])
const teamNewsContainer = ref<HTMLElement | null>(null)
const currentTeamMessagesPage = ref(1)
const hasMoreTeamMessages = ref(true)
const teamMessagesPageSize = ref(20)

// 角色管理相关数据
const roleSearchKeyword = ref('');
const selectedRoles = ref<Role[]>([]);
const expandedRoles = ref<string[]>([]); // 默认不展开角色，等数据加载后再设置

// 成员管理相关数据
const memberSearchKeyword = ref('');
const selectedMembers = ref<Member[]>([]);

// 成员编辑状态管理
const editingMemberId = ref<string | null>(null); // 当前正在编辑的成员ID
const originalMemberData = ref<Member | null>(null); // 保存原始数据用于取消操作

// 角色选项数据，从接口获取
const roleOptions = ref<{ value: string; label: string }[]>([]);

// 角色权限状态跟踪
const hasRolePermission = ref(true); // 默认有权限，当API调用失败时设为false

// 成员分页相关数据
const currentPage = ref(1);
const pageSize = ref(10);
const total = computed(() => filteredMemberTableData.value.length);

// 成员表格数据
// 成员表格数据，从接口获取
const memberTableData = ref<Member[]>([]);

// 角色数据（从接口获取）
const roleTableData = ref<Role[]>([]);

// 过滤后的角色表格数据
const filteredRoleTableData = computed(() => {
    if (!roleSearchKeyword.value) {
        return roleTableData.value;
    }
    return roleTableData.value.filter(role => 
        role.roleName.toLowerCase().includes(roleSearchKeyword.value.toLowerCase())
    );
});

// 过滤后的成员表格数据（搜索过滤）
const filteredMemberTableData = computed(() => {
    if (!memberSearchKeyword.value) {
        return memberTableData.value;
    }
    return memberTableData.value.filter(member => 
        member.userId.toLowerCase().includes(memberSearchKeyword.value.toLowerCase()) ||
        member.userName.toLowerCase().includes(memberSearchKeyword.value.toLowerCase())
    );
});

// 分页后的成员表格数据
const paginatedMemberTableData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredMemberTableData.value.slice(start, end);
});

// 扁平化表格数据
const flatTableData = computed(() => {
    const flatData: TableRow[] = [];
    
    filteredRoleTableData.value.forEach(role => {
        // 添加角色行
        flatData.push({
            rowId: `role-${role.roleId}`,
            type: 'role',
            roleId: role.roleId,
            roleName: role.roleName,
            created_time: role.created_time
        });
        
        // 只有当角色展开时才添加权限行
        if (expandedRoles.value.includes(role.roleId)) {
            role.typeActions.forEach(typeAction => {
                flatData.push({
                    rowId: `permission-${role.roleId}-${typeAction.actionType}`,
                    type: 'permission',
                    roleId: role.roleId,
                    actionType: typeAction.actionType,
                    actions: typeAction.actions,
                    groupAssigned: typeAction.assigned
                });
            });
        }
    });
    
    return flatData;
});

// 角色管理方法
const handleCreateRole = () => {
    isEditRole.value = false;
    currentEditRole.value = null;
    roleDialogVisible.value = true;
};

const handleBatchDelete = () => {
    if (selectedRoles.value.length === 0) {
        ElMessage.warning('请选择要删除的角色');
        return;
    }
    
    // 过滤出可删除的角色
    const deletableRoles = selectedRoles.value.filter(role => role.isEditable !== false);
    
    if (deletableRoles.length === 0) {
        ElMessage.warning('选中的角色中没有可删除的角色');
        return;
    }
    
    ElMessageBox.confirm(
        `确定删除选中的 ${deletableRoles.length} 个角色吗？`,
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(async () => {
        try {
            // 调用后端批量删除角色API
            const roleIds = deletableRoles.map(role => role.roleId);
            await GroupAPI.batchDeleteRoles(roleIds);
            
            // 删除成功后从本地数据中移除
            deletableRoles.forEach(role => {
                const index = roleTableData.value.findIndex(r => r.roleId === role.roleId);
                if (index > -1) {
                    roleTableData.value.splice(index, 1);
                }
            });
            
            // 清空选择列表
            selectedRoles.value = [];
            
            ElMessage.success('批量删除成功');
            
            // 刷新角色列表和角色选项
            await getRoleTableData();
            await getRoleList();
            
        } catch (error) {
            console.error('批量删除角色失败:', error);
            ElMessage.error('批量删除失败，请重试');
        }
    });
};

const handleRoleSearch = () => {
    // 搜索逻辑由 computed 自动处理
};

const handleSelectionChange = (selection: TableRow[]) => {
    // 只保留角色行的选择
    const roleRows = selection.filter(row => row.type === 'role');
    selectedRoles.value = roleRows.map(row => {
        return roleTableData.value.find(role => role.roleId === row.roleId)!;
    }).filter(Boolean);
};

const rowSelectable = (row: TableRow) => {
    return row.type === 'role';
};

const isRowSelected = (row: TableRow) => {
    return selectedRoles.value.some(role => role.roleId === row.roleId);
};

const isAllRolesSelected = computed(() => {
    const deletableRoles = filteredRoleTableData.value.filter(role => role.isEditable !== false);
    return deletableRoles.length > 0 && 
           selectedRoles.value.length === deletableRoles.length;
});

const isSomeRolesSelected = computed(() => {
    const deletableRoles = filteredRoleTableData.value.filter(role => role.isEditable !== false);
    return selectedRoles.value.length > 0 && 
           selectedRoles.value.length < deletableRoles.length;
});

// 成员选择相关计算属性
const isAllMembersSelected = computed(() => {
    // 过滤掉owner角色的成员
    const selectableMembers = paginatedMemberTableData.value.filter(member => member.roleName !== 'owner');
    return selectableMembers.length > 0 && 
           selectableMembers.every(member => 
               selectedMembers.value.some(selected => selected.userId === member.userId)
           );
});

const isSomeMembersSelected = computed(() => {
    // 过滤掉owner角色的成员
    const selectableMembers = paginatedMemberTableData.value.filter(member => member.roleName !== 'owner');
    const currentPageSelected = selectableMembers.filter(member => 
        selectedMembers.value.some(selected => selected.userId === member.userId)
    );
    return currentPageSelected.length > 0 && 
           currentPageSelected.length < selectableMembers.length;
});

const handleRowSelection = (row: TableRow, selected: boolean) => {
    const role = roleTableData.value.find(r => r.roleId === row.roleId);
    if (!role) return;
    
    if (selected) {
        if (!selectedRoles.value.some(r => r.roleId === role.roleId)) {
            selectedRoles.value.push(role);
        }
    } else {
        const index = selectedRoles.value.findIndex(r => r.roleId === role.roleId);
        if (index > -1) {
            selectedRoles.value.splice(index, 1);
        }
    }
};

const handleSelectAll = (selected: boolean) => {
    if (selected) {
        // 只选择可删除的角色
        selectedRoles.value = filteredRoleTableData.value.filter(role => role.isEditable !== false);
    } else {
        selectedRoles.value = [];
    }
};

// 角色折叠相关方法
const isRoleExpanded = (roleId: string) => {
    return expandedRoles.value.includes(roleId);
};

const toggleRoleExpand = (roleId: string) => {
    const index = expandedRoles.value.indexOf(roleId);
    if (index > -1) {
        expandedRoles.value.splice(index, 1);
    } else {
        expandedRoles.value.push(roleId);
    }
};

// 获取权限组是否可编辑
const getGroupEditable = (roleId: string, actionType: string) => {
    const role = roleTableData.value.find(r => r.roleId === roleId);
    if (role) {
        const typeAction = role.typeActions.find(ta => ta.actionType === actionType);
        return typeAction?.editable !== false;
    }
    return true;
};

// 获取角色是否可删除
const getRoleDeletable = (roleId: string) => {
    const role = roleTableData.value.find(r => r.roleId === roleId);
    return role?.isEditable !== false;
};

const handleEditRole = (row: TableRow) => {
    isEditRole.value = true;
    // 找到完整的角色数据
    const roleData = roleTableData.value.find(r => r.roleId === row.roleId);
    currentEditRole.value = roleData || null;
    roleDialogVisible.value = true;
};

const handleDeleteRole = (row: TableRow) => {
    // 检查角色是否可删除
    if (!row.roleId || !getRoleDeletable(row.roleId)) {
        ElMessage.warning(t('groupDetail.systemRoleCannotDelete'));
        return;
    }
    
    ElMessageBox.confirm(
        t('groupDetail.confirmDeleteRole', { roleName: row.roleName }),
        t('dialogTipText.tipsText'),
        {
            confirmButtonText: t('btnText.confirm'),
            cancelButtonText: t('btnText.cancel'),
            type: 'warning',
        }
    ).then(async () => {
        try {
            // 调用后端删除角色API
            await GroupAPI.deleteRole(row.roleId!);
            
            // 删除成功后从本地数据中移除
            const index = roleTableData.value.findIndex(r => r.roleId === row.roleId);
            if (index > -1) {
                roleTableData.value.splice(index, 1);
                
                // 从选择列表中移除被删除的角色
                const selectedIndex = selectedRoles.value.findIndex(r => r.roleId === row.roleId);
                if (selectedIndex > -1) {
                    selectedRoles.value.splice(selectedIndex, 1);
                }
            }
            
            ElMessage.success('删除成功');
            
            // 刷新角色列表和角色选项
            await getRoleTableData();
            await getRoleList();
            
        } catch (error) {
            console.error('删除角色失败:', error);
            ElMessage.error('删除失败，请重试');
        }
    });
};

const handleGroupPermissionChange = (roleId: string, actionType: string, assigned: boolean) => {
    const role = roleTableData.value.find(r => r.roleId === roleId);
    if (role) {
        const typeAction = role.typeActions.find(ta => ta.actionType === actionType);
        if (typeAction) {
            typeAction.assigned = assigned;
            // 当组权限变化时，只同步更新可编辑的子权限，不可编辑的权限项保持原状态
            typeAction.actions.forEach(action => {
                if (action.editable !== false) {
                    action.isUsed = assigned;
                }
                // 如果 action.editable === false，则不修改 action.isUsed，保持原状态
            });
        }
    }
};

const handleItemPermissionChange = (roleId: string, actionType: string, actionName: string, assigned: boolean) => {
    const role = roleTableData.value.find(r => r.roleId === roleId);
    if (role) {
        const typeAction = role.typeActions.find(ta => ta.actionType === actionType);
        if (typeAction) {
            const action = typeAction.actions.find(a => a.action === actionName);
            if (action) {
                action.isUsed = assigned;
            }
            
            // 检查是否所有可编辑的子权限都被勾选，如果是则勾选组权限
            const editableActions = typeAction.actions.filter(action => action.editable !== false);
            typeAction.assigned = editableActions.length > 0 && editableActions.every(action => action.isUsed);
        }
    }
};

// 成员管理方法
const handleInviteMember = () => {
    // 检查是否有角色权限
    if (!hasRolePermission.value) {
        ElMessage.warning('没有查询角色列表的权限，无法邀请成员');
        return;
    }
    
    inviteMemberDialogVisible.value = true;
};

// 邀请成员确认处理
const handleInviteMemberConfirm = async (members: any[]) => {
    try {
        const teamId = localStorage.getItem('teamId') ?? '';
        
        // 调用邀请成员接口
        await GroupAPI.inviteMembers({
            teamId,
            inviteUsers: members.map(member => ({
                roleId: member.selectedRole,
                userSubInvite: member.userId
            }))
        });
        
        ElMessage.success(`成功邀请 ${members.length} 个成员`);
        
        // 邀请成功后刷新用户列表和用户选项
        getTeamUsers();
        
    } catch (error) {
        console.error('邀请成员失败:', error);
        ElMessage.error('邀请成员失败，请重试');
    }
};

const handleBatchDeleteMember = () => {
    if (selectedMembers.value.length === 0) {
        ElMessage.warning('请选择要删除的成员');
        return;
    }
    
    ElMessageBox.confirm(
        `确定删除选中的 ${selectedMembers.value.length} 个成员吗？`,
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(async () => {
        try {
            const teamId = localStorage.getItem('teamId') ?? '';
            const userSubs = selectedMembers.value.map(member => member.userId);
            
            // 调用删除成员接口（支持批量）
            await GroupAPI.deleteTeamMember({
                teamId,
                userSubs
            });
            
            // 删除成功后从本地数据中移除
            selectedMembers.value.forEach(member => {
                const index = memberTableData.value.findIndex(m => m.userId === member.userId);
                if (index > -1) {
                    memberTableData.value.splice(index, 1);
                }
            });
            
            // 清空选择列表
            selectedMembers.value = [];
            
            // 检查当前页是否还有数据，如果没有且不是第一页，则跳转到上一页
            const newTotal = filteredMemberTableData.value.length;
            const maxPage = Math.ceil(newTotal / pageSize.value) || 1;
            if (currentPage.value > maxPage) {
                currentPage.value = maxPage;
            }
            
            ElMessage.success('批量删除成功');
            
            // 刷新用户列表
            getTeamUsers();
            
        } catch (error) {
            console.error('批量删除成员失败:', error);
            ElMessage.error('批量删除失败，请重试');
        }
    });
};

const handleMemberSearch = () => {
    // 搜索时重置到第一页
    currentPage.value = 1;
};

const handleMemberSelectionChange = (selection: Member[]) => {
    selectedMembers.value = selection;
};

const isMemberRowSelected = (row: Member) => {
    return selectedMembers.value.some(member => member.userId === row.userId);
};

const handleMemberRowSelection = (row: Member, selected: boolean) => {
    // 如果是owner角色，直接返回，不允许选中
    if (row.roleName === 'owner') {
        return;
    }
    
    if (selected) {
        if (!selectedMembers.value.some(m => m.userId === row.userId)) {
            selectedMembers.value.push(row);
        }
    } else {
        const index = selectedMembers.value.findIndex(m => m.userId === row.userId);
        if (index > -1) {
            selectedMembers.value.splice(index, 1);
        }
    }
};

const handleSelectAllMembers = (selected: boolean) => {
    if (selected) {
        // 将当前页的所有非owner角色成员添加到选择列表中
        const selectableMembers = paginatedMemberTableData.value.filter(member => member.roleName !== 'owner');
        selectableMembers.forEach(member => {
            if (!selectedMembers.value.some(m => m.userId === member.userId)) {
                selectedMembers.value.push(member);
            }
        });
    } else {
        // 从选择列表中移除当前页的所有非owner角色成员
        const selectableMemberIds = paginatedMemberTableData.value
            .filter(member => member.roleName !== 'owner')
            .map(m => m.userId);
        selectedMembers.value = selectedMembers.value.filter(member => 
            !selectableMemberIds.includes(member.userId)
        );
    }
};

// 判断是否为当前用户
const isCurrentUser = (member: Member): boolean => {
    // 使用当前团队用户信息中的user_sub进行比较
    return !!(currentTeamUser.value && member.userName === currentTeamUser.value.user_sub);
};

const handleEditMember = (row: Member) => {
    // 检查成员是否可编辑
    if (!row.isEditable) {
        ElMessage.warning('该成员不可编辑');
        return;
    }
    
    // 检查是否有角色权限
    if (!hasRolePermission.value) {
        ElMessage.warning('无法查询到角色列表，无法编辑成员角色');
        return;
    }
    
    // 检查角色选项是否存在
    if (roleOptions.value.length === 0) {
        ElMessage.warning('无法查询到角色列表，无法编辑成员角色');
        return;
    }
    
    // 进入编辑状态
    editingMemberId.value = row.userId;
    // 保存原始数据用于取消操作
    originalMemberData.value = { ...row };
};

// 保存成员角色修改
const handleSaveMember = (row: Member) => {
    if (!originalMemberData.value) return;
    
    // 检查是否有角色权限
    if (!hasRolePermission.value) {
        ElMessage.warning('无法查询到角色列表，无法保存角色修改');
        handleCancelEditMember();
        return;
    }
    
    // 检查角色是否有变化
    if (row.roleId === originalMemberData.value.roleId) {
        // 角色没有变化，直接退出编辑状态
        editingMemberId.value = null;
        originalMemberData.value = null;
        return;
    }
    
    // 根据roleId找到对应的角色名称
    const newRole = roleOptions.value.find(option => option.value === row.roleId);
    const newRoleName = newRole ? newRole.label : row.roleName;
    
    // 设置待确认的修改数据
    pendingMemberChange.value = {
        userId: row.userId,
        userName: row.userName,
        oldRoleName: originalMemberData.value.roleName,
        newRoleId: row.roleId,
        newRoleName: newRoleName,
    };
    
    // 显示确认对话框
    memberRoleConfirmVisible.value = true;
};

// 取消成员角色编辑
const handleCancelEditMember = () => {
    if (editingMemberId.value && originalMemberData.value) {
        // 恢复原始数据
        const memberIndex = memberTableData.value.findIndex(m => m.userId === editingMemberId.value);
        if (memberIndex > -1) {
            // 恢复角色ID和角色名称
            memberTableData.value[memberIndex].roleId = originalMemberData.value.roleId;
            memberTableData.value[memberIndex].roleName = originalMemberData.value.roleName;
        }
    }
    
    // 退出编辑状态
    editingMemberId.value = null;
    originalMemberData.value = null;
};

// 确认修改成员角色
const handleMemberRoleConfirmOk = async () => {
    if (!pendingMemberChange.value) return;
    
    try {
        const teamId = localStorage.getItem('teamId') ?? '';
        // 调用更新成员角色接口
        await GroupAPI.updateMemberRole({
            teamId: teamId,
            targetUserSub: pendingMemberChange.value.userId,
            roleId: pendingMemberChange.value.newRoleId,
        });
        
        ElMessage.success(`成员 ${pendingMemberChange.value.userName} 的角色已成功修改为 ${pendingMemberChange.value.newRoleName}`);
        
        // 刷新用户列表以获取最新数据
        getTeamUsers();
        
    } catch (error) {
        ElMessage.error('角色修改失败，请重试');
        console.error('角色修改失败:', error);
        
        // 失败时恢复原始数据
        if (originalMemberData.value) {
            const memberIndex = memberTableData.value.findIndex(m => m.userId === pendingMemberChange.value!.userId);
            if (memberIndex > -1) {
                memberTableData.value[memberIndex].roleId = originalMemberData.value.roleId;
                memberTableData.value[memberIndex].roleName = originalMemberData.value.roleName;
            }
        }
    } finally {
        // 无论成功还是失败，都要恢复原有样式
        memberRoleConfirmVisible.value = false;
        editingMemberId.value = null;
        originalMemberData.value = null;
        pendingMemberChange.value = null;
    }
};

// 取消确认修改成员角色
const handleMemberRoleConfirmCancel = () => {
    // 恢复原始数据
    if (editingMemberId.value && originalMemberData.value) {
        const memberIndex = memberTableData.value.findIndex(m => m.userId === editingMemberId.value);
        if (memberIndex > -1) {
            memberTableData.value[memberIndex].roleId = originalMemberData.value.roleId;
            memberTableData.value[memberIndex].roleName = originalMemberData.value.roleName;
        }
    }
    
    // 关闭对话框并恢复状态
    memberRoleConfirmVisible.value = false;
    editingMemberId.value = null;
    originalMemberData.value = null;
    pendingMemberChange.value = null;
};

const handleDeleteMember = (row: Member) => {
    // 检查成员是否可删除
    if (!row.isEditable) {
        ElMessage.warning('该成员不可删除');
        return;
    }
    
    // 检查是否为当前用户
    if (isCurrentUser(row)) {
        ElMessage.warning('不能删除自己');
        return;
    }
    
    ElMessageBox.confirm(
        `确定删除成员 ${row.userName} 吗？`,
        '提示',
        {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
        }
    ).then(async () => {
        try {
            const teamId = localStorage.getItem('teamId') ?? '';
            
            // 调用删除成员接口
            await GroupAPI.deleteTeamMember({
                teamId,
                userSubs: [row.userId]
            });
            
            // 删除成功后从本地数据中移除
            const index = memberTableData.value.findIndex(m => m.userId === row.userId);
            if (index > -1) {
                memberTableData.value.splice(index, 1);
                
                // 从选择列表中移除被删除的成员
                const selectedIndex = selectedMembers.value.findIndex(m => m.userId === row.userId);
                if (selectedIndex > -1) {
                    selectedMembers.value.splice(selectedIndex, 1);
                }
                
                // 检查当前页是否还有数据，如果没有且不是第一页，则跳转到上一页
                const newTotal = filteredMemberTableData.value.length;
                const maxPage = Math.ceil(newTotal / pageSize.value) || 1;
                if (currentPage.value > maxPage) {
                    currentPage.value = maxPage;
                }
                
                ElMessage.success('删除成功');
                
                // 刷新用户列表
                getTeamUsers();
            }
        } catch (error) {
            console.error('删除成员失败:', error);
            ElMessage.error('删除失败，请重试');
        }
    });
};

// 分页处理方法
const handleCurrentChange = (page: number) => {
    currentPage.value = page;
};

const handleSizeChange = (size: number) => {
    pageSize.value = size;
    currentPage.value = 1; // 重置到第一页
};

const queryGroupDetail = () => {
    loading.value = true;
    let param = {
        teamId: localStorage.getItem('teamId') ?? '',
        page: 1,
        pageSize: 10,
    };
    GroupAPI.teamList(param).then((res: any) => {
        form.value = res.teams[0];
        groupName.value = res.teams[0].teamName;
    }).finally(() => {
        loading.value = false;
    })
}

// 获取当前用户在团队中的信息
const getCurrentTeamUserInfo = async () => {
    try {
        const teamId = localStorage.getItem('teamId') ?? '';
        const response = await GroupAPI.getCurrentUserRole(teamId);
        
        if (response) {
            const data = response as any;
            currentTeamUser.value = {
                user_sub: data.userSub || data.user_sub,
                team: data.teamName || data.team_name,
                role: data.role,
                is_owner: data.isOwner || data.is_owner || false
            };
        }
    } catch (error) {
        console.error('获取当前用户团队信息失败:', error);
        // 使用静态数据作为fallback
        currentTeamUser.value = {
            user_sub: "ethan55",
            team: "第二团队", 
            role: "自定义角色A",
            is_owner: false
        };
    }
}

// 获取团队用户列表（用于用户选项和成员表格数据）
const getTeamUsers = async (page: number = 1, pageSize: number = 100) => {
    userListLoading.value = true;
    try {
        const teamId = localStorage.getItem('teamId') ?? '';
        const response = await GroupAPI.getTeamUsers({
            teamId,
            page,
            pageSize
        });
        
        if (response) {
            const data = response as any;
            const teamUsers = data.teamUsers;
            
            // 更新用户选项数据（用于移交团队等功能）
            // 使用userId作为唯一标识，确保key唯一且与成员表格数据一致
            userOptions.value = teamUsers.map((user: any, index: number) => ({
                value: user.userId || user.userSub || user.user_sub,
                label: user.userName || user.user_name || user.userId || user.userSub || user.user_sub
            }));
            
            // 更新成员表格数据
            memberTableData.value = teamUsers.map((user: any) => ({
                userId: user.userId,
                userName: user.userName,
                roleId: user.roleId,
                roleName: user.roleName,
                isEditable: user.isEditable, // 所有者不可编辑
                avatar: user.avatar || undefined // 用户头像
            }));
        }
    } catch (error) {
        console.error('获取团队用户列表失败:', error);
        ElMessage.error('获取团队成员数据失败');
    } finally {
        userListLoading.value = false;
    }
};

// 获取角色列表（用于角色选项）
const getRoleList = async () => {
    try {
        const teamId = localStorage.getItem('teamId') ?? '';
        // 获取当前语言环境
        const currentLanguage = language.value;
        
        const response = await GroupAPI.getRoleList({
            teamId,
            isEditable: false,
            page: 1,
            pageSize: 100,
            language: currentLanguage
        });
        if (response) {
            const data = response as any;
            const roles = data.roles;
            
            // 更新角色选项
            roleOptions.value = roles.map((role: any) => ({
                value: role.roleId || role.role_id || role.id,
                label: role.roleName || role.role_name || role.name
            }));
            
            // 成功获取角色列表，设置权限状态为true
            hasRolePermission.value = true;
        }
    } catch (error) {
        console.error('获取角色列表失败:', error);
        
        // 检查是否是权限错误
        const errorResponse = error as any;
        const errorMessage = errorResponse?.response?.data?.message || errorResponse?.message || '';
        const statusCode = errorResponse?.response?.status;
        
        // 检查权限错误：状态码为403/401，或者错误信息包含权限相关关键词
        const isPermissionError = 
            statusCode === 403 || 
            statusCode === 401 || 
            errorMessage.includes('权限') || 
            errorMessage.includes('permission') ||
            errorMessage.includes('unauthorized') ||
            errorMessage.includes('forbidden');
            
        if (isPermissionError) {
            console.warn('用户没有查询角色列表的权限');
            console.log('权限错误详情:', { statusCode, errorMessage, hasRolePermission: hasRolePermission.value });
            hasRolePermission.value = false;
            
            // 如果当前正在编辑成员，自动退出编辑状态
            if (editingMemberId.value) {
                console.log('自动退出编辑状态，当前编辑的成员ID:', editingMemberId.value);
                handleCancelEditMember();
            }
        } else {
            // 非权限错误，可能是网络问题等，不改变权限状态
            console.warn('获取角色列表失败，但不是权限问题');
        }
        
        // 清空角色选项
        roleOptions.value = [];
    }
};

// 获取角色表格数据
const getRoleTableData = async () => {
    try {
        const teamId = localStorage.getItem('teamId') ?? '';
        // 获取当前语言环境
        const currentLanguage = language.value;
        
        const response = await GroupAPI.getRoleList({
            teamId,
            isEditable: true,
            page: 1,
            pageSize: 100,
            language: currentLanguage
        });
        if (response) {
            const data = response as any;
            const roles = data.roles;
            const roleTableRoles: Role[] = roles.map((role: any) => ({
                ...role,
                // 为缺失的字段设置默认值
                deletable: false,
                editable: false,
                created_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
                // 为每个typeAction添加前端需要的字段
                typeActions: role.typeActions.map((typeAction: any) => ({
                    ...typeAction,
                    assigned: false, // 初始状态，由前端逻辑控制
                    editable: true,
                    actions: typeAction.actions.map((action: any) => ({
                        ...action,
                        editable: true
                    }))
                }))
            }));
            roleTableData.value = roleTableRoles;
            
            // 计算权限组的初始状态
            roleTableRoles.forEach(role => {
                role.typeActions.forEach(typeAction => {
                    // 检查是否所有可编辑的子权限都被勾选，如果是则勾选组权限
                    const editableActions = typeAction.actions.filter(action => action.editable !== false);
                    typeAction.assigned = editableActions.length > 0 && editableActions.every(action => action.isUsed);
                });
            });
            
            // 默认收起所有角色，用户可以手动展开
            expandedRoles.value = [];
        }
    } catch (error) {
        console.error('获取角色表格数据失败:', error);
        roleTableData.value = [];
    }
};

// 获取动作显示名称
const getActionDisplayName = (action: Action): string => {
    return action.actionName;
};

// 获取用户头像显示内容
const getUserAvatarContent = (userSub: string | undefined, avatar?: string): string => {
    // 如果有头像URL，返回空字符串（让el-avatar使用src属性）
    if (avatar) {
        return '';
    }
    
    // 如果没有头像但有用户名，使用用户名首字符
    if (userSub && typeof userSub === 'string' && userSub.length > 0) {
        return userSub.charAt(0).toUpperCase();
    }
    
    // 默认显示 'U'
    return 'U';
};

// 获取默认头像URL（如果需要的话）
const getDefaultAvatarUrl = (): string => {
    // 这里可以返回一个默认头像的URL，或者返回空字符串使用字符头像
    return '';
};

// 映射 messageLevel 到 el-timeline-item 的 type
const mapMessageLevelToTimelineType = (messageLevel: 'default' | 'info' | 'warning' | 'error'): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
    const levelMap = {
        'default': 'info' as const,
        'info': 'primary' as const,
        'warning': 'warning' as const,
        'error': 'danger' as const
    };
    
    return levelMap[messageLevel] || 'info';
};

// 获取团队动态消息
const getTeamMessages = async (page: number = 1, pageSize: number = 20, append: boolean = false) => {
    teamMessagesLoading.value = true;
    try {
        const teamId = localStorage.getItem('teamId') ?? '';
        // 获取当前语言环境
        const currentLanguage = language.value;
        
        const response = await GroupAPI.getTeamMessages({
            teamId,
            page,
            pageSize,
            language: currentLanguage
        });
        
        if (response) {
            const data = response as any;
            
            const newActivities = data.teamMsgs.map((msg: any) => ({
                user_sub: msg.authorName || '',
                action: msg.msg || '', //
                datetime: msg.createdTime || '',
                type: mapMessageLevelToTimelineType(msg.messageLevel || 'default'), // 使用映射方法转换类型
                avatar: msg.avatar || msg.userAvatar || undefined // 用户头像
            }));
            
            if (append) {
                // 追加到现有数据
                teamActivities.value.push(...newActivities);
            } else {
                // 替换现有数据
                teamActivities.value = newActivities;
                currentTeamMessagesPage.value = 1;
            }
            
            // 检查是否还有更多数据
            hasMoreTeamMessages.value = newActivities.length === pageSize;
            
            // 如果是追加模式，更新当前页码
            if (append) {
                currentTeamMessagesPage.value = page;
            }
        }
    } catch (error) {
        console.error('获取团队动态失败:', error);
        ElMessage.error('获取团队动态数据失败');
    } finally {
        teamMessagesLoading.value = false;
    }
};

// 处理团队动态滚动事件
const handleTeamNewsScroll = (event: Event) => {
    const target = event.target as HTMLElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    
    // 当滚动到底部附近时加载更多数据
    if (scrollTop + clientHeight >= scrollHeight - 50) {
        loadMoreTeamMessages();
    }
};

// 加载更多团队动态消息
const loadMoreTeamMessages = async () => {
    if (teamMessagesLoading.value || !hasMoreTeamMessages.value) {
        return;
    }
    
    const nextPage = currentTeamMessagesPage.value + 1;
    await getTeamMessages(nextPage, teamMessagesPageSize.value, true);
};


watch(()=>groupMenu.value , (newVal) => {
    if(newVal=== 'detail'){
        queryGroupDetail();
        getCurrentTeamUserInfo(); // 获取当前用户在团队中的信息
        getTeamUsers(); // 获取团队用户列表
        getTeamMessages(); // 获取团队动态
        getRoleList(); // 获取角色列表
        getRoleTableData(); // 获取角色表格数据
    } 
})

// 监听语言切换，重新触发 getTeamMessages 和 getRoleTableData
watch(() => language.value, (newLanguage, oldLanguage) => {
    // 只有在 groupDetail 页面且语言确实发生变化时才重新加载数据
    if (groupMenu.value === 'detail' && newLanguage !== oldLanguage) {
        // 重新获取团队动态消息（支持多语言）
        getTeamMessages();
        // 重新获取角色表格数据（支持多语言）
        getRoleTableData();
    }
})

const onSubmit = () => {
  const teamId = localStorage.getItem('teamId') ?? '';
  GroupAPI.updateTeam(
        { teamId },
        {
            teamName: form.value.teamName,
            description: form.value.description,
            isPublic: form.value.isPublic,
        }
    ).then((res) => {
        ElMessage({
            message: t('groupDetail.updateTeamTip'),
            type: 'success',
        })
        queryGroupDetail();
    })
}


const handleClick = (tab: any, event: any) => { };

const handleTransferTeam = () => {
    transferDialogVisible.value = true;
    selectedReceiver.value = ''; // 重置选择
}

const handleTransferConfirm = async () => {
    // 增强验证：检查是否为空字符串、undefined、null等
    if (!selectedReceiver.value || selectedReceiver.value.trim() === '') {
        ElMessage.warning('请选择接收人');
        return;
    }
    
    try {
        const teamId = localStorage.getItem('teamId') ?? '';
        
        // 调用移交团队所有权接口
        await GroupAPI.transferTeamOwnership({
            teamId,
            targetUserSub: selectedReceiver.value
        });
        
        ElMessage.success('团队所有权移交成功');
        transferDialogVisible.value = false;
        
        // 刷新页面数据
        queryGroupDetail();
        getCurrentTeamUserInfo();
        getTeamUsers();
        
    } catch (error) {
        console.error('移交团队失败:', error);
        ElMessage.error('移交团队失败，请重试');
    }
}

const handleTransferCancel = () => {
    transferDialogVisible.value = false;
    selectedReceiver.value = '';
}

const handleDeleteTeam=() => {
    ElMessageBox.confirm(
        `${t('groupDetail.confirmDissolve',{name:form.value.teamName})}`,
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
    const teamId = localStorage.getItem('teamId') ?? '';
    GroupAPI.deleteTeam({
            teamId
        }).then((res) => {
            delNav(1);
            router.push('/group');
            handleSwitchMenu('knowledge')
            ElMessage.success(`${t('groupDetail.team')}【${form.value.teamName}】${t('groupDetail.dissolveSuccess')}`);
        })
    })
}

// 角色对话框确认处理
const handleRoleConfirm = async (roleData: any) => {
    try {
        if (isEditRole.value) {
            // 编辑角色 - 重新获取最新数据
            await getRoleTableData();
            await getRoleList();
            ElMessage.success('角色编辑成功');
        } else {
            // 新建角色 - 重新获取最新数据
            await getRoleTableData();
            await getRoleList();
            ElMessage.success('角色创建成功');
        }
        
        // 重置对话框状态
        roleDialogVisible.value = false;
        isEditRole.value = false;
        currentEditRole.value = null;
        
    } catch (error) {
        console.error('角色操作失败:', error);
        ElMessage.error(isEditRole.value ? '角色编辑失败' : '角色创建失败');
    }
};

onMounted(()=>{
    if(groupMenu.value=== 'detail'){
        queryGroupDetail();
        getCurrentTeamUserInfo(); // 获取当前用户在团队中的信息
        getTeamUsers(); // 获取团队用户列表
        getTeamMessages(); // 获取团队动态
        getRoleList(); // 获取角色列表
        getRoleTableData(); // 获取角色表格数据
    } 
})

</script>

<style lang="scss">
.group-detial-container {
    display: flex;
    flex-direction: column;
    margin-right: 24px;

    .group-name {
        font-size: 16px;
        font-weight: 700;
        line-height: 24px;
        color: var(--o-text-color-primary);
        margin-bottom: 8px;
    }

    .group-detail-tabs {
        .el-form{
            margin-top: 16px;
        }
        .el-form-item{
            margin-bottom: 24px;
            .el-form-item__label {
                font-size: 12px;
                padding-right: 24px;
                color: var(--o-text-color-secondary);
                // padding: 0 24px 0 0 !important;
            }
            .el-form-item__content{
                font-size:12px;
                .el-input__inner,.el-textarea__inner{
                    font-size: 12px;
                }
                .el-switch{
                    height: 16px;
                    .el-switch__core{
                        min-width: 32px;
                        height: 16px;
                        .el-switch__action{
                            width: 12px;
                            height: 12px;
                        }
                    }
                }
                .el-switch.is-checked .el-switch__core .el-switch__action{
                    left: calc(100% - 13px);
                }
            }
        }
        .isPublicItem,.memberCountItem{
            height: 16px !important;
            line-height: 16px !important;
            .el-form-item__label-wrap .el-form-item__label{
                height: 16px !important;
                line-height: 16px !important;
                min-height: 16px !important;
            }
            .el-form-item__label{
                padding-top: 0px;
                padding-bottom: 0px;
            }
            .el-form-item__content{
                height: 16px !important;
                line-height: 16px !important;
                min-height: 16px !important;
            }
        }
        .btn-tips{
            font-size: 12px;
            color: rgb(141,152,170);
            margin-left: 8px;
        }
        .save-btn{
            margin-top: 32px;
            display: block;
        }
    }

    // 空白内容样式
    .empty-content {
        padding: 40px 0;
        text-align: center;
    }


    // 团队动态样式
    .team-news-container {
        padding: 16px 0;
        height: calc(100vh - 280px); // 设置固定高度，预留给其他元素的空间
        overflow-y: auto; // 启用垂直滚动
        overflow-x: hidden; // 隐藏水平滚动
        
        // 自定义滚动条样式
        &::-webkit-scrollbar {
            width: 6px;
        }
        
        &::-webkit-scrollbar-track {
            background: var(--el-fill-color-lighter);
            border-radius: 3px;
        }
        
        &::-webkit-scrollbar-thumb {
            background: var(--el-border-color-darker);
            border-radius: 3px;
            
            &:hover {
                background: var(--el-border-color-dark);
            }
        }
        
        // 加载更多和没有更多数据的样式
        .loading-more,
        .no-more-data {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 16px 0;
            color: var(--el-text-color-secondary);
            font-size: 14px;
            
            .el-icon {
                font-size: 16px;
            }
        }
        
        .no-more-data {
            color: var(--el-text-color-disabled);
        }

        .timeline-item-content {
            display: flex;
            align-items: flex-start;
            gap: 12px;

            .avatar-section {
                flex-shrink: 0;
                
                .user-avatar {
                    background-color: var(--el-color-primary);
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                }
            }

            .content-section {
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 4px;

                .action-text {
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--o-text-color-primary);
                    line-height: 1.4;
                }

                .datetime-text {
                    font-size: 12px;
                    color: var(--o-text-color-secondary);
                    line-height: 1.2;
                }
            }
        }
    }

    // 成员管理样式
    .member-permission-container {
        padding: 16px 0;
        height: calc(100vh - 200px);
        display: flex;
        flex-direction: column;
        
        // 成员信息显示样式
        .member-info {
            display: flex;
            align-items: center;
            gap: 8px;
            
            .member-avatar {
                background-color: var(--el-color-primary);
                color: white;
                font-size: 12px;
                flex-shrink: 0;
            }
            
            .member-name {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }

        .member-permission-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;

            .header-left {
                display: flex;
                gap: 12px;
            }

            .header-right {
                .el-input {
                    .el-input__wrapper {
                        .el-input__suffix {
                            .el-input__suffix-inner {
                                .el-icon {
                                    color: var(--o-text-color-secondary);
                                }
                            }
                        }
                    }
                }
            }
        }

        .table-container {
            flex: 1;
            overflow: auto;
            margin-top: 16px;
        }

        .pagination-container {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            margin-top: 20px;
            padding: 0 16px;

            .el-pagination {
                --el-pagination-font-size: 12px;
                --el-pagination-bg-color: var(--o-bg-color-primary);
                --el-pagination-text-color: var(--o-text-color-primary);
                --el-pagination-border-radius: 4px;
                --el-pagination-button-color: var(--o-text-color-secondary);
                --el-pagination-button-bg-color: var(--o-bg-color-secondary);
                --el-pagination-button-disabled-color: var(--o-text-color-disabled);
                --el-pagination-button-disabled-bg-color: var(--o-bg-color-disabled);
                --el-pagination-hover-color: var(--o-color-primary);

                .el-select {
                    .el-input {
                        .el-input__wrapper {
                            background-color: var(--o-bg-color-secondary);
                            border-color: var(--o-border-color);
                            
                            .el-input__inner {
                                color: var(--o-text-color-primary);
                            }
                        }
                    }
                }

                .el-input {
                    .el-input__wrapper {
                        background-color: var(--o-bg-color-secondary);
                        border-color: var(--o-border-color);
                        
                        .el-input__inner {
                            color: var(--o-text-color-primary);
                        }
                    }
                }
            }
        }

        // 成员管理表格特定样式 - 更紧凑的行高
        .el-table {
            .el-table__row {
                height: 36px; // 成员表格行高设置为36px，比角色表格更紧凑
                
                .el-table__cell {
                    padding: 6px 12px; // 更小的内边距
                    
                    .cell {
                        line-height: 1.2; // 更紧凑的行高
                        font-size: 12px; // 确保字体大小一致
                        
                        span {
                            font-size: 12px;
                            line-height: 1.2;
                        }
                    }
                }
            }
            
            // 表头样式调整
            .el-table__header {
                .el-table__row {
                    height: 32px; // 表头行高
                    
                    .el-table__cell {
                        padding: 4px 12px;
                        
                        .cell {
                            font-size: 12px;
                            font-weight: 500;
                            line-height: 1.2;
                        }
                    }
                }
            }
        }
    }

    // 角色管理样式
    .role-manage-container {
        padding: 16px 0;
        height: calc(100vh - 200px);
        display: flex;
        flex-direction: column;

        .role-manage-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;

            .header-left {
                display: flex;
                gap: 12px;
            }

            .header-right {
                .el-input {
                    .el-input__wrapper {
                        .el-input__suffix {
                            .el-input__suffix-inner {
                                .el-icon {
                                    color: var(--o-text-color-secondary);
                                }
                            }
                        }
                    }
                }
            }
        }

        .table-container {
            flex: 1;
            overflow: auto;
            margin-top: 16px;
        }

        .role-name-container {
            display: flex;
            align-items: center;
            gap: 8px;

            .expand-icon {
                cursor: pointer;
                font-size: 14px;
                color: var(--o-text-color-secondary);
                transition: transform 0.2s ease;

                &:hover {
                    color: var(--o-text-color-primary);
                }
            }
        }

        .role-name {
            font-weight: 500;
            color: var(--o-text-color-primary);
        }

        .permission-row {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 16px;

            .permission-group-checkbox {
                margin-right: 0;
                
                .el-checkbox__label {
                    font-weight: 500;
                    font-size: 14px;
                    color: var(--o-text-color-primary);
                }
                
                &.disabled-checkbox {
                    opacity: 1;
                    cursor: not-allowed !important;
                    
                    :deep(.el-checkbox__input) {
                        cursor: not-allowed !important;
                        
                        .el-checkbox__inner {
                            background-color: var(--el-disabled-bg-color) !important;
                            border-color: var(--el-disabled-border-color) !important;
                            cursor: not-allowed !important;
                        }
                        
                        &.is-checked .el-checkbox__inner {
                            background-color: var(--el-disabled-bg-color) !important;
                            border-color: var(--el-disabled-border-color) !important;
                            
                            &::after {
                                border-color: var(--el-disabled-text-color) !important;
                            }
                        }
                    }
                    
                    .el-checkbox__label {
                        color: var(--el-disabled-text-color) !important;
                        cursor: not-allowed !important;
                        text-decoration: line-through;
                        text-decoration-color: var(--el-disabled-text-color);
                        opacity: 0.8;
                    }
                }
            }

            .permission-item-checkbox {
                margin-right: 0;
                
                .el-checkbox__label {
                    font-size: 12px;
                    color: var(--o-text-color-secondary);
                }

                &.disabled-checkbox {
                    opacity: 1;
                    cursor: not-allowed !important;
                    position: relative;
                    
                    // 添加视觉提示
                    &::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%);
                        pointer-events: none;
                        z-index: 1;
                    }
                    
                    :deep(.el-checkbox__input) {
                        cursor: not-allowed !important;
                        
                        .el-checkbox__inner {
                            background-color: var(--el-disabled-bg-color) !important;
                            border-color: var(--el-disabled-border-color) !important;
                            cursor: not-allowed !important;
                            box-shadow: inset 0 0 3px var(--el-border-color-darker) !important;
                        }
                        
                        &.is-checked .el-checkbox__inner {
                            background-color: var(--el-disabled-bg-color) !important;
                            border-color: var(--el-disabled-border-color) !important;
                            box-shadow: inset 0 0 3px var(--el-border-color-darker) !important;
                            
                            &::after {
                                border-color: var(--el-disabled-text-color) !important;
                            }
                        }
                    }
                    
                    .el-checkbox__label {
                        color: var(--el-disabled-text-color) !important;
                        cursor: not-allowed !important;
                        text-decoration: line-through;
                        text-decoration-color: var(--el-disabled-text-color);
                        opacity: 0.8;
                    }
                }
            }
        }

    }

    // 通用表格样式 - 应用于成员管理和角色管理
    .member-permission-container,
    .role-manage-container {
        .el-table {
            // 调整表格行高
            .el-table__row {
                height: 40px; // 设置行高为40px
                
                .el-table__cell {
                    padding: 8px 12px; // 减少内边距
                    vertical-align: middle; // 垂直居中对齐
                    
                    .cell {
                        line-height: 1.4; // 设置行高比例
                        .el-button--text {
                            padding: 0;
                            font-size: 12px;
                            margin-right: 12px;
                            border: none !important;
                            background: none !important;
                            box-shadow: none !important;
                            
                            &:hover {
                                background: none !important;
                                border: none !important;
                            }
                            
                            &:focus {
                                background: none !important;
                                border: none !important;
                                box-shadow: none !important;
                            }
                            
                            &:active {
                                background: none !important;
                                border: none !important;
                            }
                            
                            &:last-child {
                                margin-right: 0;
                            }
                        }
                        
                        // 表格操作按钮样式
                        .table-action-btn {
                            padding: 0;
                            font-size: 12px;
                            margin-right: 12px;
                            border: none !important;
                            background: none !important;
                            box-shadow: none !important;
                            color: var(--el-color-primary) !important;
                            
                            &:hover {
                                background: none !important;
                                border: none !important;
                                color: var(--el-color-primary-light-3) !important;
                            }
                            
                            &:focus {
                                background: none !important;
                                border: none !important;
                                box-shadow: none !important;
                            }
                            
                            &:active {
                                background: none !important;
                                border: none !important;
                            }
                            
                            &:last-child {
                                margin-right: 0;
                            }
                            
                            // 删除按钮特殊样式
                            &.delete-btn {
                                color: var(--el-color-danger) !important;
                                
                                &:hover {
                                    color: var(--el-color-danger-light-3) !important;
                                }
                                
                                // 禁用状态
                                &:disabled,
                                &.is-disabled {
                                    color: var(--el-text-color-disabled) !important;
                                    cursor: not-allowed !important;
                                    
                                    &:hover {
                                        color: var(--el-text-color-disabled) !important;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
</style>
