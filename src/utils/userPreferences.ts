/**
 * 用户偏好设置管理工具 (witchaind-web)
 * 从主项目的localStorage中读取用户偏好设置，影响表单的默认选项
 */

export interface ModelPreference {
  llmId: string;
  modelName: string;
  icon?: string;
  [key: string]: any;
}

export interface UserPreferences {
  reasoningModelPreference?: ModelPreference;
  embeddingModelPreference?: ModelPreference;
  rerankerPreference?: ModelPreference;
  chainOfThoughtPreference?: boolean;
  autoExecutePreference?: boolean;
}

const PREFERENCES_KEY = 'euler_user_preferences';

/**
 * 获取用户偏好设置
 */
export function getUserPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('获取用户偏好设置失败:', error);
  }
  return {};
}

/**
 * 根据用户偏好匹配默认选项
 * 支持通过llmId、modelName、label、value、name进行匹配
 */
export function findPreferredOption<T extends { 
  llmId?: string; 
  modelName?: string; 
  label?: string; 
  value?: string;
  name?: string;
}>(
  options: T[],
  preference?: ModelPreference
): T | undefined {
  if (!preference || !options.length) {
    return undefined;
  }

  // 首先尝试通过llmId精确匹配
  if (preference.llmId) {
    const exactMatch = options.find(option => option.llmId === preference.llmId);
    if (exactMatch) {
      return exactMatch;
    }
  }

  // 如果llmId匹配失败，尝试通过modelName匹配
  if (preference.modelName) {
    const nameMatch = options.find(option => 
      option.modelName === preference.modelName || 
      option.label === preference.modelName ||
      option.value === preference.modelName ||
      option.name === preference.modelName
    );
    if (nameMatch) {
      return nameMatch;
    }
  }

  return undefined;
}

/**
 * 获取嵌入模型的默认选项
 */
export function getPreferredEmbeddingModel<T extends { 
  llmId?: string; 
  modelName?: string; 
  label?: string; 
  value?: string;
  name?: string;
}>(options: T[]): T | undefined {
  const preferences = getUserPreferences();
  return findPreferredOption(options, preferences.embeddingModelPreference);
}

/**
 * 获取重排序模型的默认选项
 */
export function getPreferredRerankerModel<T extends { 
  llmId?: string; 
  modelName?: string; 
  label?: string; 
  value?: string;
  name?: string;
}>(options: T[]): T | undefined {
  const preferences = getUserPreferences();
  return findPreferredOption(options, preferences.rerankerPreference);
}

/**
 * 获取思维链偏好设置
 */
export function getChainOfThoughtPreference(): boolean {
  const preferences = getUserPreferences();
  return preferences.chainOfThoughtPreference ?? true; // 默认开启
}

/**
 * 获取自动执行偏好设置
 */
export function getAutoExecutePreference(): boolean {
  const preferences = getUserPreferences();
  return preferences.autoExecutePreference ?? false; // 默认关闭
}

/**
 * 监听用户偏好设置变化
 */
export function watchUserPreferences(callback: (preferences: UserPreferences) => void): () => void {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === PREFERENCES_KEY) {
      const newPreferences = e.newValue ? JSON.parse(e.newValue) : {};
      callback(newPreferences);
    }
  };

  window.addEventListener('storage', handleStorageChange);
  
  // 返回清理函数
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}

/**
 * 专门为witchaind-web优化的embedding模型匹配函数
 * 匹配格式: { label: string, value: string }
 */
export function matchEmbeddingModelOption(
  options: Array<{ label: string; value: string }>,
  preference?: ModelPreference
): { label: string; value: string } | undefined {
  if (!preference || !options.length) {
    return undefined;
  }

  // 尝试通过modelName匹配value或label
  if (preference.modelName) {
    const match = options.find(option => 
      option.value === preference.modelName || 
      option.label === preference.modelName ||
      option.value.includes(preference.modelName) ||
      option.label.includes(preference.modelName)
    );
    if (match) {
      return match;
    }
  }

  // 尝试通过llmId匹配
  if (preference.llmId) {
    const match = options.find(option => 
      option.value === preference.llmId || 
      option.label === preference.llmId ||
      option.value.includes(preference.llmId) ||
      option.label.includes(preference.llmId)
    );
    if (match) {
      return match;
    }
  }

  return undefined;
}

/**
 * 专门为witchaind-web优化的reranker模型匹配函数
 * 匹配格式: { label: string, value: string, method: string, name: string }
 */
export function matchRerankerModelOption(
  options: Array<{ label: string; value: string; method: string; name: string }>,
  preference?: ModelPreference
): { label: string; value: string; method: string; name: string } | undefined {
  if (!preference || !options.length) {
    return undefined;
  }

  // 尝试通过modelName匹配name、value或label
  if (preference.modelName) {
    const match = options.find(option => 
      option.name === preference.modelName ||
      option.value === preference.modelName || 
      option.label === preference.modelName ||
      option.name.includes(preference.modelName) ||
      option.value.includes(preference.modelName) ||
      option.label.includes(preference.modelName)
    );
    if (match) {
      return match;
    }
  }

  // 尝试通过llmId匹配
  if (preference.llmId) {
    const match = options.find(option => 
      option.name === preference.llmId ||
      option.value === preference.llmId || 
      option.label === preference.llmId ||
      option.name.includes(preference.llmId) ||
      option.value.includes(preference.llmId) ||
      option.label.includes(preference.llmId)
    );
    if (match) {
      return match;
    }
  }

  return undefined;
}
