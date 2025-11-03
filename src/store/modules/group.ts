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
    let handleKnowledgeTab = (key: string) => {
      knowledgeTabActive.value = key;
    };
    let setCurTeamInfo = (value: any) => {
      curTeamInfo.value = value;
    };
    
    return {
      groupMenu,
      knowledgeTabActive,
      curTeamInfo,
      handleSwitchMenu,
      handleKnowledgeTab,
      setCurTeamInfo,
    };
  },
  {
    // 持久化存储
    persist: {
      key: 'group_data',
      storage: sessionStorage,
      pick: ['groupMenu'],
    },
  }
);

export function useGroupStoreHook() {
  return useGroupStore(store);
}
