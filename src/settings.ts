import { ThemeEnum } from './enums/ThemeEnum';
import { LanguageEnum } from './enums/LanguageEnum';

const { pkg } = __APP_INFO__;

const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

const defaultSettings: AppSettings = {
  title: pkg.name,
  version: pkg.version,
  showSettings: true,
  tagsView: true,
  fixedHeader: true,
  sidebarLogo: true,
  theme: mediaQueryList.matches ? ThemeEnum.DARK : ThemeEnum.LIGHT,
  language: LanguageEnum.ZH_CN,
  themeColor: '#409EFF',
  watermarkEnabled: false,
  watermarkContent: pkg.name,
};

export default defaultSettings;
