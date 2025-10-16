<template>
    <el-dialog 
        v-model="dialogVisible" 
        :title="$t('groupDetail.inviteMember')" 
        width="600px"
        :before-close="handleCancel"
        class="invite-member-dialog"
    >
        <!-- 用户选择器 -->
        <div class="invite-section">
            <el-select
                ref="memberSelectRef"
                v-model="selectedUserIds"
                multiple
                filterable
                :placeholder="$t('groupDetail.placeholderMember')"
                style="width: 100%;"
                popper-class="invite-member-select-dropdown"
                @visible-change="handleSelectVisibleChange"
                @change="handleUserSelection"
                :loading="userSearchLoading"
            >
                <el-option
                    v-for="user in userSearchResults"
                    :key="user.userId"
                    :label="user.userName"
                    :value="user.userId"
                >
                    <span>{{ user.userName }} ({{ user.userId }})</span>
                </el-option>
            </el-select>
            
            <el-button 
                type="primary" 
                @click="handleAddUsers"
                :disabled="selectedUserIds.length === 0"
                style="margin-left: 12px;"
            >
                {{ $t('groupDetail.addMember') }}
            </el-button>
        </div>

        <!-- 已添加的成员列表 -->
        <div v-if="pendingMembers.length > 0" class="member-list-section">
            <div class="section-title">{{ $t('groupDetail.pendingMembers') }}</div>
            <div class="member-list">
                <MemberCard
                    v-for="member in pendingMembers"
                    :key="member.userId"
                    :member-data="member"
                    :role-options="roleOptions"
                    @delete="handleRemoveMember"
                />
            </div>
        </div>

        <!-- 底部计数和按钮 -->
        <div class="dialog-footer-section">
            <div class="member-count">{{ pendingMembers.length }}/20</div>
            <div class="footer-buttons">
                <el-button @click="handleCancel">{{ $t('btnText.cancel') }}</el-button>
                <el-button 
                    type="primary" 
                    @click="handleConfirm"
                    :disabled="pendingMembers.length === 0"
                >
                    {{ $t('btnText.confirm') }}
                </el-button>
            </div>
        </div>
    </el-dialog>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage } from 'element-plus';
import GroupAPI from '@/api/group';
import MemberCard from './MemberCard.vue';

const { t } = useI18n();

// 用户搜索结果类型
interface UserSearchResult {
    userId: string;
    userName: string;
}

// 待添加成员数据类型
interface PendingMember {
    userId: string;
    userName: string;
    selectedRole: string;
}

// 角色选项类型
interface RoleOption {
    value: string;
    label: string;
}

// 组件属性
interface Props {
    visible: boolean;
    roleOptions: RoleOption[];
}

// 组件事件
interface Emits {
    (e: 'update:visible', value: boolean): void;
    (e: 'confirm', members: PendingMember[]): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式数据
const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});

const selectedUserIds = ref<string[]>([]);
const pendingMembers = ref<PendingMember[]>([]);
const memberSelectRef = ref();

// 用户搜索结果，从接口获取
const userSearchResults = ref<UserSearchResult[]>([]);
const userSearchLoading = ref(false);

// 获取可邀请的用户列表
const getUserSearchResults = async () => {
    userSearchLoading.value = true;
    try {
        const response = await GroupAPI.getUserList({
            page: 1,
            pageSize: 100
        });
        
        if (response && (response as any).users) {
            userSearchResults.value = (response as any).users.map((user: any) => ({
                userId: user.userSub || user.user_sub,
                userName: user.userName || user.user_name
            }));
        }
    } catch (error) {
        ElMessage.error(`获取用户列表失败`);
    } finally {
        userSearchLoading.value = false;
    }
};

// 处理下拉框显示/隐藏时设置正确的宽度和层级
const handleSelectVisibleChange = (visible: boolean) => {
    if (visible && memberSelectRef.value) {
        nextTick(() => {
            // 获取 select 组件的实际宽度
            const selectElement = memberSelectRef.value.$el;
            const selectWidth = selectElement.offsetWidth;
            
            // 查找下拉框元素并设置宽度（现在在 body 中）
            const dropdown = document.querySelector('.invite-member-select-dropdown');
            if (dropdown) {
                const dropdownEl = dropdown as HTMLElement;
                dropdownEl.style.width = `${selectWidth}px`;
                dropdownEl.style.minWidth = `${selectWidth}px`;
            }
        });
    }
};

// 用户选择处理
const handleUserSelection = (userIds: string[]) => {
    selectedUserIds.value = userIds;
};

// 添加用户到待邀请列表
const handleAddUsers = () => {
    selectedUserIds.value.forEach(userId => {
        const user = userSearchResults.value.find(u => u.userId === userId);
        if (user && !pendingMembers.value.some(m => m.userId === userId)) {
            // 使用第一个角色选项的 value（roleId）作为默认角色
            const defaultRoleId = props.roleOptions.length > 0 ? props.roleOptions[0].value : '';
            pendingMembers.value.push({
                userId: user.userId,
                userName: user.userName,
                selectedRole: defaultRoleId
            });
        }
    });
    
    // 清空选择
    selectedUserIds.value = [];
};

// 移除待邀请成员
const handleRemoveMember = (userId: string) => {
    const index = pendingMembers.value.findIndex(m => m.userId === userId);
    if (index > -1) {
        pendingMembers.value.splice(index, 1);
    }
};

// 取消操作
const handleCancel = () => {
    // 重置所有数据
    selectedUserIds.value = [];
    pendingMembers.value = [];
    dialogVisible.value = false;
};

// 确认邀请
const handleConfirm = () => {
    if (pendingMembers.value.length === 0) {
        ElMessage.warning('请先添加要邀请的成员');
        return;
    }
    
    emit('confirm', pendingMembers.value);
    
    // 重置数据
    selectedUserIds.value = [];
    pendingMembers.value = [];
    dialogVisible.value = false;
};

// 监听对话框关闭，重置数据
watch(dialogVisible, (newVal) => {
    if (newVal) {
        // 对话框打开时获取用户搜索结果
        getUserSearchResults();
    } else {
        // 对话框关闭时重置数据
        selectedUserIds.value = [];
        pendingMembers.value = [];
    }
});
</script>

<style lang="scss">
// 邀请成员对话框样式
.invite-member-dialog {
    .invite-section {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
    }

    .member-list-section {
        margin-bottom: 20px;
        
        .section-title {
            font-size: 14px;
            font-weight: 500;
            color: var(--o-text-color-primary);
            margin-bottom: 12px;
        }
        
        .member-list {
            max-height: 300px;
            overflow-y: auto;
        }
    }

    .dialog-footer-section {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 16px;
        
        .member-count {
            font-size: 12px;
            color: var(--o-text-color-secondary);
        }
        
        .footer-buttons {
            display: flex;
            gap: 12px;
        }
    }

    // 修复多选标签时的高度自适应
    .el-select {
        .el-select__wrapper {
            min-height: 32px;
            height: auto;
            
            .el-select__tags {
                max-width: calc(100% - 30px);
                flex-wrap: wrap;
                
                .el-tag {
                    margin: 2px 4px 2px 0;
                    max-width: 100%;
                    
                    .el-tag__content {
                        max-width: 100%;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                }
            }
            
            .el-select__suffix {
                align-self: flex-start;
                margin-top: 4px;
            }
            
            .el-select__placeholder {
                line-height: 24px;
            }
        }
        
        // 关键修复：设置input wrapper的高度为auto
        .el-input__wrapper {
            height: auto !important;
        }
        
        // 当有标签时，确保输入框有足够的空间
        &.el-select--multiple .el-select__wrapper {
            .el-select__input-wrapper {
                margin-left: 0;
                flex: 1;
                min-width: 60px;
            }
        }
    }
}

// 修复 el-select 下拉框宽度不匹配问题（全局样式，因为下拉框会被传送到 body）
:global(.invite-member-select-dropdown) {
    // 宽度将通过 JavaScript 动态设置
    // 设置最大宽度防止过宽
    max-width: 500px;
    
    // 确保下拉框在对话框之上显示
    z-index: 3000 !important;
    
    .el-select-dropdown__item {
        // 确保选项内容不会溢出
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 0 20px;
        line-height: 34px;
        
        // 选项悬停效果
        &:hover {
            background-color: var(--el-fill-color-light);
        }
        
        // 选中状态样式
        &.is-selected {
            color: var(--el-color-primary);
            font-weight: 500;
        }
    }
}

// 对话框样式优化
.invite-member-dialog {
    // 确保下拉框容器有足够的空间
    .invite-section {
        position: relative;
    }
}

</style>
