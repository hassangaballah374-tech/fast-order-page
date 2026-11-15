/* ثوابت التلبيس بالذكاء الاصطناعي (آمنة للمتصفح واللوحة). الأسماء الحقيقية عند Google: الـ preview ليها اللاحقة -preview.
   gemini-2.5-flash-image = ثابت وأرخص، gemini-3.1-flash-image-preview = أحدث، gemini-3-pro-image-preview = أعلى جودة وأغلى. */
export const TRYON_MODEL_DEFAULT = 'gemini-2.5-flash-image';
export const TRYON_MODELS = ['gemini-2.5-flash-image', 'gemini-3.1-flash-image-preview', 'gemini-3-pro-image-preview'];
/* أسماء قديمة كانت متسجلة قبل كده (غلط) → الاسم الصحيح */
export const TRYON_LEGACY = { 'gemini-3.1-flash-image': 'gemini-3.1-flash-image-preview', 'gemini-3.1-flash-lite-image': 'gemini-2.5-flash-image', 'gemini-3-pro-image': 'gemini-3-pro-image-preview' };
export const fixModel = (m) => TRYON_LEGACY[m] || m;
