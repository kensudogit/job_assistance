import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationJa from '../locales/ja/translation.json';
import translationEn from '../locales/en/translation.json';
import translationZh from '../locales/zh/translation.json';
import translationVi from '../locales/vi/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ja: {
        translation: translationJa,
      },
      en: {
        translation: translationEn,
      },
      zh: {
        translation: translationZh,
      },
      vi: {
        translation: translationVi,
      },
    },
    fallbackLng: 'ja',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

