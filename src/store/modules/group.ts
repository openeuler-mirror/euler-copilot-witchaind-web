import { store } from '@/store';
import i18n from '@/lang/index';

interface TeamList {
  teamId: string;
  teamName: string;
  description: string;
  authorId: string;
  authorName: string;
  memberCount: string;
  isPublic: boolean;
}

export const useGroupStore = defineStore(
  'group',
  () => {
    let navGroup = ref([{ name: i18n.global.t('group.witchaind'), path: '/group', query: {} }]);
    let groupMenu = ref('knowledge');
    let knowledgeTabActive = ref('document');
    let curTeamInfo: Ref<TeamList> = ref({
      teamId: '',
      teamName: '',
      description: '',
      authorId: '',
      authorName: '',
      memberCount: '',
      isPublic: false,
    });

    let handleSwitchMenu = (menu: string) => {
      groupMenu.value = menu;
    };
    let delNav = (value: number) => {
      navGroup.value.splice(value);
    };
    let handleKnowledgeTab = (key: string) => {
      knowledgeTabActive.value = key;
    };
    let setCurTeamInfo = (value: any) => {
      curTeamInfo.value = value;
    };
    let initNav = () => {
      navGroup.value = [{ name: i18n.global.t('group.witchaind'), path: '/group', query: {} }];
    };
    return {
      navGroup,
      groupMenu,
      knowledgeTabActive,
      curTeamInfo,
      handleSwitchMenu,
      delNav,
      handleKnowledgeTab,
      setCurTeamInfo,
      initNav,
    };
  },
  {
    // 持久化存储
    persist: {
      key: 'group_data',
      storage: sessionStorage,
      pick: ['navGroup', 'groupMenu'],
    },
  }
);

export function useGroupStoreHook() {
  return useGroupStore(store);
}
