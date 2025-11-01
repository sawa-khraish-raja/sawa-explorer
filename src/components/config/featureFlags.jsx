//  Feature Flags for safe rollback
// Set to false to disable features without code changes

export const FLAGS = {
  // Translation features
  aiTranslateEnabled: true,
  aiVoiceToTextEnabled: true,
  aiChatTranslateEnabled: true,

  // Performance features
  translationCacheEnabled: true,
  parallelTranslationEnabled: true,

  // Voice features
  autoVoiceEnabled: true,
  whisperTranscriptionEnabled: true,
};

/**
 * Check if feature is enabled
 * @param {string} flagName
 * @returns {boolean}
 */
export function isFeatureEnabled(flagName) {
  return FLAGS[flagName] === true;
}

/**
 * Safely execute feature code only if enabled
 * @param {string} flagName
 * @param {Function} callback
 * @param {Function} fallback
 */
export async function withFeature(flagName, callback, fallback = () => null) {
  if (isFeatureEnabled(flagName)) {
    try {
      return await callback();
    } catch (error) {
      console.error(`[Feature ${flagName}] Error:`, error);
      return fallback();
    }
  }
  return fallback();
}
