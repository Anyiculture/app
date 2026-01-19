
export const translationService = {
  async translateText(text: string, toLang: 'zh' | 'en'): Promise<string> {
    if (!text) return '';

    try {
      // Determine source language (simple heuristic)
      // If target is 'zh', assume source is 'en' (or anything else)
      // If target is 'en', assume source is 'zh'
      const fromLang = toLang === 'zh' ? 'en' : 'zh';

      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
      );

      const data = await response.json();

      if (data.responseStatus === 200) {
        return data.responseData.translatedText;
      }

      console.warn('Translation API warning:', data.responseDetails);
      return text; // Fallback to original text
    } catch (error) {
      console.error('Translation failed:', error);
      return text; // Fallback to original text
    }
  },

  // Helper to determine if text contains Chinese characters
  hasChinese(text: string): boolean {
    return /[\u4e00-\u9fa5]/.test(text);
  }
};
