import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { CONFIG, validateApiKey, optimizePrompt } from '../config';

/**
 * AI Service abstraction layer for multiple AI providers
 */
class AIService {
  constructor() {
    this.currentProvider = null;
    this.aiInstance = null;
    this.apiKey = null;
  }

  async initialize(provider, apiKey) {
    try {
      if (provider === 'OPENAI') {
        throw new Error('OpenAI is temporarily unavailable. Please use Gemini for now.');
      }

      const validation = validateApiKey(apiKey, provider);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      this.currentProvider = provider;
      this.apiKey = apiKey;

      if (provider === 'GEMINI') {
        this.aiInstance = new GoogleGenerativeAI(apiKey);
      } else if (provider === 'OPENAI') {
        this.aiInstance = new OpenAI({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true,
        });
      } else {
        throw new Error(`Unsupported AI provider: ${provider}`);
      }

      return {
        success: true,
        message: `${CONFIG.AI_PROVIDERS[provider].name} initialized successfully`,
      };
    } catch (error) {
      this.currentProvider = null;
      this.aiInstance = null;
      this.apiKey = null;
      throw error;
    }
  }

  isReady() {
    return this.currentProvider && this.aiInstance && this.apiKey;
  }

  getCurrentProvider() {
    return this.currentProvider;
  }

  async fetchAvailableModels() {
    if (this.currentProvider !== 'GEMINI' || !this.aiInstance) {
      throw new Error('Only available for Gemini provider');
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      const models = data.models
        ?.filter(model => model.supportedGenerationMethods?.includes('generateContent'))
        ?.map(model => ({
          id: model.name.split('/')[1],
          name: model.displayName,
          description: model.description,
        }))
        ?.sort((a, b) => a.name.localeCompare(b.name)) || [];

      return models;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  async generateResponse(message, retryCount = 0, customModel = null) {
    if (!this.isReady()) {
      throw new Error('AI service not initialized. Please set up your API key first.');
    }

    const maxRetries = 2;
    const baseDelay = 1000;

    try {
      if (this.currentProvider === 'GEMINI') {
        return await this._generateGeminiResponse(message, customModel);
      } else if (this.currentProvider === 'OPENAI') {
        return await this._generateOpenAIResponse(message);
      } else {
        throw new Error(`Unsupported provider: ${this.currentProvider}`);
      }
    } catch (error) {
      console.error(`Error generating response from ${this.currentProvider}:`, error);

      const is503Error = error.message.includes('503') || error.message.includes('overloaded');

      if (is503Error && retryCount < maxRetries) {
        const delay = baseDelay * Math.pow(2, retryCount);
        console.log(`Retrying in ${delay}ms... (attempt ${retryCount + 1}/${maxRetries})`);

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.generateResponse(message, retryCount + 1, customModel);
      }

      throw error;
    }
  }

  async _generateGeminiResponse(message, customModel = null) {
    const modelName = customModel || CONFIG.AI_PROVIDERS.GEMINI.MODEL_NAME;
    console.log(`Using model: ${modelName}`);
    const model = this.aiInstance.getGenerativeModel({
      model: modelName,
      generationConfig: {
        maxOutputTokens: CONFIG.AI_PROVIDERS.GEMINI.MAX_TOKENS,
        temperature: CONFIG.AI_PROVIDERS.GEMINI.TEMPERATURE,
      },
    });

    const optimizedPrompt = optimizePrompt(message);
    const result = await model.generateContent(optimizedPrompt);
    const response = await result.response;
    return response.text();
  }

  async _generateOpenAIResponse(message) {
    const optimizedPrompt = optimizePrompt(message);

    const completion = await this.aiInstance.chat.completions.create({
      model: CONFIG.AI_PROVIDERS.OPENAI.MODEL_NAME,
      messages: [
        {
          role: 'user',
          content: optimizedPrompt,
        },
      ],
      max_tokens: CONFIG.AI_PROVIDERS.OPENAI.MAX_TOKENS,
      temperature: CONFIG.AI_PROVIDERS.OPENAI.TEMPERATURE,
    });

    return completion.choices[0].message.content;
  }

  reset() {
    this.currentProvider = null;
    this.aiInstance = null;
    this.apiKey = null;
  }
}

export const aiService = new AIService();
export default aiService;
