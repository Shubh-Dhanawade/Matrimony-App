import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';

const LANGUAGE_KEY = 'user-language';

const resources = {
    en: { translation: en },
    hi: { translation: hi },
    mr: { translation: mr },
};

const languageDetector = {
    type: 'languageDetector',
    async: true,
    detect: async (callback) => {
        try {
            // 1. Check saved language in AsyncStorage
            const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
            if (savedLanguage) {
                return callback(savedLanguage);
            }

            // 2. Default to English if no language is saved
            return callback('en');
        } catch (error) {
            console.log('Error detecting language:', error);
            callback('en');
        }
    },
    init: () => { },
    cacheUserLanguage: async (language) => {
        try {
            await AsyncStorage.setItem(LANGUAGE_KEY, language);
        } catch (error) {
            console.log('Error caching language:', error);
        }
    },
};

i18n
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',          // Default language is English
        compatibilityJSON: 'v3',    // Required for React Native
        initImmediate: false,        // Wait for async detection before render
        interpolation: {
            escapeValue: false,     // React already does escaping
        },
        react: {
            useSuspense: false,     // Avoid splash screen issues
        },
    });

export default i18n;
