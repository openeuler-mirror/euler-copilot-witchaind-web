/**
 * CSS 静态资源动态解析工具
 * 在运行时动态替换 CSS 变量中的静态资源路径
 */
import { isInIframe, getIntegrationOrigin } from './index';
import { useAssets } from '@/composables/useAssets';

/**
 * 初始化 CSS 静态资源解析
 * 在应用启动时调用，动态设置 CSS 变量
 */
export function initCssAssetResolver() {
  // 检测是否需要处理静态资源
  const isIframeMode = String(import.meta.env.VITE_IS_IFRAME_MODE) === 'true' || isInIframe();
  
  if (!isIframeMode) {
    return;
  }
  
  const { getImageUrl, getSvgUrl, getAssetUrl } = useAssets();
  
  // 设置 CSS 变量
  const root = document.documentElement;
  
  // 设置具体的静态资源路径，使用 useAssets 来获取正确的打包后路径
  try {
    // 背景图片
    root.style.setProperty('--bg-light', `url('${getImageUrl('light_bg_1.webp')}')`);
    root.style.setProperty('--bg-dark', `url('${getImageUrl('dark_bg_1.webp')}')`);
    
    // 空状态图标
    root.style.setProperty('--empty-pending-light', `url('${getImageUrl('empty_pending.svg')}')`);
    root.style.setProperty('--empty-pending-dark', `url('${getImageUrl('empty_pending_dark.svg')}')`);
    root.style.setProperty('--empty-failed-light', `url('${getImageUrl('empty_failed.svg')}')`);
    root.style.setProperty('--empty-failed-dark', `url('${getImageUrl('empty_failed_dark.svg')}')`);
    root.style.setProperty('--empty-running-light', `url('${getImageUrl('empty_running.svg')}')`);
    root.style.setProperty('--empty-running-dark', `url('${getImageUrl('empty_running_dark.svg')}')`);
    
    // 任务图标
    root.style.setProperty('--task-list-light', `url('${getSvgUrl('light_taskList.svg')}')`);
    root.style.setProperty('--task-list-dark', `url('${getSvgUrl('dark_taskList.svg')}')`);
    root.style.setProperty('--task-score-light', `url('${getSvgUrl('light_taskScore.svg')}')`);
    root.style.setProperty('--task-score-dark', `url('${getSvgUrl('dark_taskScore.svg')}')`);
    
    // 加载图标（从 icons 目录）
    root.style.setProperty('--task-loading', `url('${getAssetUrl('icons/taskLoading.png')}')`);
    
    // 更多操作图标 - 已迁移到 MoreIcon 组件，不再需要 CSS 变量
    // root.style.setProperty('--more-icon', `url('${getSvgUrl('more.svg')}')`);
    // root.style.setProperty('--more-hover-icon', `url('${getSvgUrl('more_hover.svg')}')`);
    // root.style.setProperty('--more-active-icon', `url('${getSvgUrl('more_active.svg')}')`);
    
    // 登录背景
    root.style.setProperty('--login-bg-light', `url('${getImageUrl('login-background-light.webp')}')`);
    root.style.setProperty('--login-bg-dark', `url('${getImageUrl('login-background-dark.jpg')}')`);
    
    // 信息图标
    root.style.setProperty('--info-icon', `url('${getSvgUrl('icon_info.svg')}')`);
    
    // 字体文件
    root.style.setProperty('--font-harmony-woff2', `url('${getAssetUrl('fonts/HarmonyOS/HarmonyOS_Sans_SC/HarmonyOS_Sans_SC_Regular.woff2')}')`);
    root.style.setProperty('--font-harmony-woff', `url('${getAssetUrl('fonts/HarmonyOS/HarmonyOS_Sans_SC/HarmonyOS_Sans_SC_Regular.woff')}')`);
    
    console.log('CSS 静态资源路径已动态设置，使用 useAssets 组合式函数');
  } catch (error) {
    console.error('设置 CSS 静态资源路径时出错:', error);
  }
}
