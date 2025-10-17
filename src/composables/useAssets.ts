/**
 * 静态资源处理组合式函数
 */
import { resolveAssetUrl } from '@/utils';

export function useAssets() {
  /**
   * 解析静态资源 URL
   * @param assetPath 静态资源路径
   * @returns 处理后的完整 URL
   */
  const resolveAsset = (assetPath: string): string => {
    return resolveAssetUrl(assetPath);
  };

  /**
   * 批量解析静态资源 URL
   * @param assetPaths 静态资源路径数组
   * @returns 处理后的完整 URL 数组
   */
  const resolveAssets = (assetPaths: string[]): string[] => {
    return assetPaths.map(path => resolveAssetUrl(path));
  };

  /**
   * 获取图片 URL
   * @param imagePath 图片路径（相对于 src/assets/images/）
   * @returns 处理后的图片 URL
   */
  const getImageUrl = (imagePath: string): string => {
    try {
      // 使用 Vite 的 new URL() 构造函数来获取正确的打包后路径
      // 这是 Vite 推荐的静态资源处理方式
      const imageUrl = new URL(`../assets/images/${imagePath}`, import.meta.url).href;
      return resolveAssetUrl(imageUrl);
    } catch (error) {
      console.warn(`Failed to resolve image path: ${imagePath}`, error);
      // 回退方案：直接使用相对路径
      return resolveAssetUrl(`./assets/images/${imagePath}`);
    }
  };

  /**
   * 获取 SVG 图标 URL
   * @param iconPath SVG 图标路径（相对于 src/assets/svg/）
   * @returns 处理后的图标 URL
   */
  const getSvgUrl = (iconPath: string): string => {
    try {
      // 使用 Vite 的 new URL() 构造函数来获取正确的打包后路径
      const svgUrl = new URL(`../assets/svg/${iconPath}`, import.meta.url).href;
      return resolveAssetUrl(svgUrl);
    } catch (error) {
      console.warn(`Failed to resolve SVG path: ${iconPath}`, error);
      // 回退方案：直接使用相对路径
      return resolveAssetUrl(`./assets/svg/${iconPath}`);
    }
  };

  /**
   * 通用的静态资源获取函数
   * @param assetPath 资源路径（相对于 src/assets/）
   * @returns 处理后的资源 URL
   */
  const getAssetUrl = (assetPath: string): string => {
    try {
      // 使用 Vite 的 new URL() 构造函数来获取正确的打包后路径
      const fullAssetUrl = new URL(`../assets/${assetPath}`, import.meta.url).href;
      return resolveAssetUrl(fullAssetUrl);
    } catch (error) {
      console.warn(`Failed to resolve asset path: ${assetPath}`, error);
      // 回退方案：直接使用相对路径
      return resolveAssetUrl(`./assets/${assetPath}`);
    }
  };

  return {
    resolveAsset,
    resolveAssets,
    getImageUrl,
    getSvgUrl,
    getAssetUrl
  };
}
