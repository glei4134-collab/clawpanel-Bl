/**
 * i18n 多语言辅助函数
 */
export const SUPPORTED_LANGS = ['zh-CN', 'en', 'zh-TW', 'ja', 'ko', 'vi', 'es', 'pt', 'ru', 'fr', 'de']

export function _(zhCN, en, zhTW, ja, ko, vi, es, pt, ru, fr, de) {
  return {
    'zh-CN': zhCN,
    en: en || zhCN,
    'zh-TW': zhTW || zhCN,
    ja: ja || zhCN,
    ko: ko || zhCN,
    vi: vi || zhCN,
    es: es || zhCN,
    pt: pt || zhCN,
    ru: ru || zhCN,
    fr: fr || zhCN,
    de: de || zhCN,
  }
}
