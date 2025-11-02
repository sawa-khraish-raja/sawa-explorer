export async function routeIntent(base44, text) {
  const labels = ['trip', 'translation', 'service', 'general'];
  const prompt = `Classify the intent of this travel-related message into one of ${labels.join(', ')}:\n\nMessage:\n${text}\n\nOnly output a single word which is the most relevant label.`;

  try {
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
    });

    const label = response.toLowerCase().trim();
    const picked = labels.find((l) => label.includes(l)) || 'general';
    return picked;
  } catch (error) {
    console.error('Error in routeIntent:', error);
    return 'general'; // Fallback to general intent on error
  }
}
