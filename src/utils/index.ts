/**
 * Check if an element has a class
 * @param {HTMLElement} ele
 * @param {string} cls
 * @returns {boolean}
 */
export function hasClass(ele: HTMLElement, cls: string) {
  return !!ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
}

/**
 * Add class to element
 * @param {HTMLElement} ele
 * @param {string} cls
 */
export function addClass(ele: HTMLElement, cls: string) {
  if (!hasClass(ele, cls)) ele.className += ' ' + cls;
}

/**
 * Remove class from element
 * @param {HTMLElement} ele
 * @param {string} cls
 */
export function removeClass(ele: HTMLElement, cls: string) {
  if (hasClass(ele, cls)) {
    const reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
    ele.className = ele.className.replace(reg, ' ');
  }
}

/**
 * 判断是否是外部链接
 *
 * @param {string} path
 * @returns {Boolean}
 */
export function isExternal(path: string) {
  const isExternal = /^(https?:|http?:|mailto:|tel:|data:)/.test(path);
  return isExternal;
}

/**
 * 检测是否在 iframe 环境中运行
 * @returns {boolean}
 */
export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}

/**
 * 获取集成来源的 origin
 * @returns {string}
 */
export function getIntegrationOrigin(): string {
  // 优先使用环境变量配置
  const configuredOrigin = import.meta.env.VITE_INTEGRATION_ORIGIN;
  if (configuredOrigin) {
    return configuredOrigin;
  }
  
  // 如果在 iframe 中，尝试从 parent 获取
  if (isInIframe()) {
    try {
      return window.parent.location.origin;
    } catch (e) {
      // 跨域时无法访问 parent.location，使用 referrer
      if (document.referrer) {
        const url = new URL(document.referrer);
        return url.origin;
      }
    }
  }
  
  // 默认返回当前 origin
  return window.location.origin;
}

/**
 * 处理静态资源 URL，解决 iframe 跨域问题
 * @param {string} assetPath - 静态资源路径
 * @returns {string} - 处理后的完整 URL
 */
export function resolveAssetUrl(assetPath: string): string {
  // 如果已经是完整 URL，直接返回
  if (isExternal(assetPath)) {
    return assetPath;
  }
  
  // 如果不在 iframe 环境中，使用默认处理
  const isIframeMode = String(import.meta.env.VITE_IS_IFRAME_MODE) === 'true' || isInIframe();
  if (!isIframeMode) {
    return assetPath;
  }
  
  // 在 iframe 环境中，使用集成来源的 origin
  const integrationOrigin = getIntegrationOrigin();
  const basePath = import.meta.env.BASE_URL || '/witchaind/';
  
  // 确保路径以 / 开头
  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  
  // 构建完整 URL
  return `${integrationOrigin}${basePath.replace(/\/$/, '')}${normalizedPath}`;
}
