import axios, { InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ResultEnum } from '@/enums/ResultEnum';
import { TOKEN_KEY } from '@/enums/CacheEnum';
import qs from 'qs';
import i18n from '@/lang/index';
import { IconError } from '@computing/opendesign-icons';

// 获取有效的认证头
const getAuthHeader = (): string | null => {
  const ecsessionToken = localStorage.getItem('ECSESSION');
  const accessToken = localStorage.getItem(TOKEN_KEY);
  
  if (ecsessionToken) {
    return `Bearer ${ecsessionToken}`;
  } else if (accessToken) {
    return accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`;
  }
  
  return null;
};

// 动态计算超时时间的函数
const calculateTimeout = (fileSize: number, fileCount: number = 1): number => {
  // 基础超时时间：2分钟
  const baseTimeout = 2 * 60;
  
  // 根据文件大小计算额外时间（假设最慢网速 100KB/s）
  const sizeBasedTimeout = (fileSize / (100 * 1024));
  
  // 批量上传的额外时间
  const batchTimeout = fileCount > 1 ? fileCount * 30: 0;
  
  // 最小5分钟，最大30分钟
  const calculatedTimeout = Math.min(
    Math.max(baseTimeout + sizeBasedTimeout + batchTimeout, 5 * 60),
    30 * 60
  );
  
  return calculatedTimeout;
};

// 创建专用于文件上传的 axios 实例
const uploadService = axios.create({
  baseURL: '/witchaind/api',
  timeout: 10 * 60 * 1000, // 默认10分钟，会被动态覆盖
  withCredentials: true,
  headers: {
    'Access-control-allow-origin': '*',
  },
  paramsSerializer: (params) => {
    return qs.stringify(params);
  },
});

// 请求拦截器
uploadService.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 获取认证头
    const authHeader = getAuthHeader();
    if (authHeader) {
      config.headers['Authorization'] = authHeader;
    } else {
      console.warn('⚠️ No valid authentication token found for upload request');
    }
    
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
uploadService.interceptors.response.use(
  (response: AxiosResponse) => {
    // 检查配置的响应类型是否为二进制类型（'blob' 或 'arraybuffer'）, 如果是，直接返回响应对象
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response;
    }
    const { code, result, message } = response?.data;
    if (code?.toString() === ResultEnum.SUCCESS) {
      return result;
    }
    ElMessage({
      showClose: true,
      message: message || i18n.global.t('pageTipText.systemError'),
      icon: IconError,
      customClass: 'o-message--error',
      duration: 3000,
    });
    return Promise.reject(new Error(message || 'Error'));
  },
  (error: any) => {
    // 上传专用的错误处理，提供更详细的超时和网络错误信息
    if (error?.response?.data) {
      const { retcode, message } = error.response.data;
      if (retcode?.toString() === ResultEnum.TOKEN_INVALID) {
        ElNotification({
          title: i18n.global.t('dialogTipText.tipsText'),
          message: i18n.global.t('login.message.loginToken'),
          type: 'info',
        });
      } else {
        ElMessage({
          showClose: true,
          message: message || error?.message,
          icon: IconError,
          customClass: 'o-message--error',
          duration: 3000,
        });
      }
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // 专门处理上传超时错误
      ElMessage({
        showClose: true,
        message: i18n.global.t('uploadTipText.uploadTimeout', '文件上传超时，请检查网络连接或尝试分批上传'),
        icon: IconError,
        customClass: 'o-message--error',
        duration: 5000,
      });
    } else {
      ElMessage({
        showClose: true,
        message: error?.message || i18n.global.t('uploadTipText.uploadError', '文件上传失败'),
        icon: IconError,
        customClass: 'o-message--error',
        duration: 3000,
      });
    }
    return Promise.reject(error.message);
  }
);

// 创建带动态超时的上传请求函数
const createUploadRequest = (fileSize?: number, fileCount?: number) => {
  const timeout = calculateTimeout(fileSize || 0, fileCount || 1);
  
  // 创建新的 axios 实例并复制所有配置和拦截器
  const dynamicUploadService = axios.create({
    ...uploadService.defaults,
    timeout,
  });
  
  // 复制请求拦截器
  dynamicUploadService.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // 获取认证头
      const authHeader = getAuthHeader();
      if (authHeader) {
        config.headers['Authorization'] = authHeader;
      } else {
        console.warn('⚠️ No valid authentication token found for dynamic upload request');
      }
      
      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    }
  );
  
  // 复制响应拦截器
  dynamicUploadService.interceptors.response.use(
    (response: AxiosResponse) => {
      // 检查配置的响应类型是否为二进制类型（'blob' 或 'arraybuffer'）, 如果是，直接返回响应对象
      if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
        return response;
      }
      const { code, result, message } = response?.data;
      if (code?.toString() === ResultEnum.SUCCESS) {
        return result;
      }
      ElMessage({
        showClose: true,
        message: message || i18n.global.t('pageTipText.systemError'),
        icon: IconError,
        customClass: 'o-message--error',
        duration: 3000,
      });
      return Promise.reject(new Error(message || 'Error'));
    },
    (error: any) => {
      // 上传专用的错误处理，提供更详细的超时和网络错误信息
      if (error?.response?.data) {
        const { retcode, message } = error.response.data;
        if (retcode?.toString() === ResultEnum.TOKEN_INVALID) {
          ElNotification({
            title: i18n.global.t('dialogTipText.tipsText'),
            message: i18n.global.t('login.message.loginToken'),
            type: 'info',
          });
        } else {
          ElMessage({
            showClose: true,
            message: message || error?.message,
            icon: IconError,
            customClass: 'o-message--error',
            duration: 3000,
          });
        }
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        // 专门处理上传超时错误
        ElMessage({
          showClose: true,
          message: i18n.global.t('uploadTipText.uploadTimeout', '文件上传超时，请检查网络连接或尝试分批上传'),
          icon: IconError,
          customClass: 'o-message--error',
          duration: 5000,
        });
      } else {
        ElMessage({
          showClose: true,
          message: error?.message || i18n.global.t('uploadTipText.uploadError', '文件上传失败'),
          icon: IconError,
          customClass: 'o-message--error',
          duration: 3000,
        });
      }
      return Promise.reject(error.message);
    }
  );
  
  return dynamicUploadService;
};

// 导出上传专用的 axios 实例和工具函数
export default uploadService;
export { createUploadRequest, calculateTimeout };
