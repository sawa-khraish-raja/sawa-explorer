/**
 * LLM Integration helpers
 * Replaces invokeLLM()
 */

import { invokeFunction } from './functions';

/**
 * Invoke LLM with a prompt
 * @param {object} params - LLM parameters
 * @param {string} params.prompt - The prompt to send to the LLM
 * @param {string} params.model - Model to use (default: gpt-4)
 * @param {number} params.temperature - Temperature (default: 0.7)
 * @param {number} params.maxTokens - Max tokens (default: 1000)
 * @returns {Promise<string>} - LLM response
 */
export async function invokeLLM({
  prompt,
  model = 'gpt-4',
  temperature = 0.7,
  maxTokens = 1000,
  ...otherParams
}) {
  try {
    const response = await invokeFunction('invokeLLM', {
      prompt,
      model,
      temperature,
      max_tokens: maxTokens,
      ...otherParams,
    });

    return response.text || response.content || response;
  } catch (error) {
    console.error('Error invoking LLM:', error);
    throw error;
  }
}

/**
 * Get AI trip plan
 */
export async function getAITripPlan(params) {
  return invokeLLM({
    prompt: createTripPlanPrompt(params),
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
  });
}

/**
 * Route intent detection
 */
export async function detectIntent(message) {
  return invokeLLM({
    prompt: `Analyze this message and determine the user's intent: "${message}"`,
    model: 'gpt-3.5-turbo',
    temperature: 0.3,
    maxTokens: 100,
  });
}

function createTripPlanPrompt(params) {
  const { city, duration, interests, budget } = params;
  return `Create a detailed trip plan for ${city} for ${duration} days.
          Interests: ${interests}.
          Budget: ${budget}.
          Provide day-by-day itinerary with activities, estimated costs, and local tips.`;
}
