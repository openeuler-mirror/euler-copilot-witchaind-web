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

// 创建专用于文件上传的 axios 实例
// 注意：前端不设置具体超时限制，由后端/nginx的超时配置来决定
// 这里设置一个足够大的值（60分钟），确保后端先超时
const uploadService = axios.create({
  baseURL: '/witchaind/api',
  timeout: 60 * 60 * 1000, // 60分钟，足够大让后端先超时
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

// 导出上传专用的 axios 实例
export default uploadService;
