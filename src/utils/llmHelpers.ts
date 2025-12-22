import { generateTitleWithFallback } from '@/services/aiProviders';
import { logger } from '@/lib/logger';

export const getLLMGeneratedTitle = async (input: string): Promise<string> => {
  try {
    return await generateTitleWithFallback(input);
  } catch (error) {
    logger.error('Error generating LLM title:', error);
    return '';
  }
};
