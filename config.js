export const CONFIG = {
  AI_PROVIDERS: {
    GEMINI: {
      name: 'Google Gemini',
      API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE',
      MODEL_NAME: 'gemini-1.5-flash',
      MAX_TOKENS: 150,
      TEMPERATURE: 0.7,
    },
    OPENAI: {
      name: 'OpenAI GPT',
      API_KEY: process.env.EXPO_PUBLIC_OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE',
      MODEL_NAME: 'gpt-3.5-turbo',
      MAX_TOKENS: 150,
      TEMPERATURE: 0.7,
    },
  },

  GEMINI: {
    API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE',
    MODEL_NAME: 'gemini-1.5-flash',
    MAX_TOKENS: 150,
    TEMPERATURE: 0.7,
  },

  APP: {
    NAME: 'HawkAI',
    VERSION: '1.0.0',
    WELCOME_MESSAGE: `Hello! I'm your personal assistant powered by Gemini AI. 

I'm designed to be lightweight, fast, and straightforward - your go-to for quick questions when in doubt:
• Instant answers to quick questions
• Minimal storage footprint
• Straightforward information lookup
• Simple task assistance
• Daily planning on the go

What would you like to know?`,
  },

  UI: {
    ACCENT_COLORS: {
      UNICORN_DREAMS: '#8B5CF6',    // Vibrant Purple
      BUBBLEGUM_POP: '#EC4899',     // Vibrant Pink
      MINTY_FRESH: '#10B981',       // Vibrant Green
      SUNSET_VIBES: '#F59E0B',      // Vibrant Orange
      PEACHY_KEEN: '#EF4444',       // Vibrant Red
      COTTON_CANDY: '#06B6D4',      // Vibrant Cyan
      SKY_DREAMS: '#3B82F6',        // Vibrant Blue
      LAVENDER_LOVE: '#A855F7',     // Vibrant Lavender
      MERMAID_TAIL: '#14B8A6',
      MONOCHROME: '#828282ff',
    },

    THEMES: {
      LIGHT: {
        BACKGROUND: '#ffffff',
        CARD: '#ffffff',
        POPOVER: '#ffffff',
        TEXT_PRIMARY: '#0a0a0a',
        TEXT_SECONDARY: '#71717a',
        TEXT_MUTED: '#a1a1aa',
        BORDER: '#e5e5e5',
        INPUT: '#ffffff',
        RING: '#18181b',
        BUBBLE_USER: '#18181b',
        BUBBLE_ASSISTANT: '#f4f4f5',
        BUBBLE_TEXT_USER: '#fafafa',
        BUBBLE_TEXT_ASSISTANT: '#0a0a0a',
        INPUT_BACKGROUND: '#ffffff',
        STATUS_BAR: 'dark',
        ACCENT: '#18181b',
      },
      DARK: {
        BACKGROUND: '#000000ff',
        CARD: '#0a0a0a',
        POPOVER: '#0a0a0a',
        TEXT_PRIMARY: '#fafafa',
        TEXT_SECONDARY: '#a1a1aa',
        TEXT_MUTED: '#71717a',
        BORDER: '#171717',
        INPUT: '#0a0a0a',
        RING: '#d4d4d8',
        BUBBLE_USER: '#fafafa',
        BUBBLE_ASSISTANT: '#0a0a0a',
        BUBBLE_TEXT_USER: '#0a0a0a',
        BUBBLE_TEXT_ASSISTANT: '#fafafa',
        INPUT_BACKGROUND: '#0a0a0a',
        STATUS_BAR: 'light',
        ACCENT: '#fafafa',
      },
    },

    DEFAULT_THEME: 'SYSTEM',
    DEFAULT_ACCENT: 'UNICORN_DREAMS',
    DEFAULT_LANGUAGE: 'en',
    DEFAULT_AI_PROVIDER: 'GEMINI',
  },

  OPTIMIZATION: {
    MAX_MESSAGE_LENGTH: 500,
    ENABLE_COMPRESSION: true,
    ENABLE_CACHING: false,
  },
};

/**
 * Validates API keys for AI providers
 */
export const validateApiKey = (apiKey, provider = 'GEMINI') => {
  if (!apiKey) {
    return {
      isValid: false,
      message: `Please add your ${provider === 'GEMINI' ? 'Gemini' : 'OpenAI'} API key`,
    };
  }

  if (apiKey === 'YOUR_GEMINI_API_KEY_HERE' || apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
    return {
      isValid: false,
      message: `Please replace the placeholder with your actual ${provider === 'GEMINI' ? 'Gemini' : 'OpenAI'} API key`,
    };
  }

  if (provider === 'GEMINI') {
    if (!apiKey.startsWith('AIza') || apiKey.length < 35) {
      return {
        isValid: false,
        message: 'Invalid Gemini API key format. Keys should start with "AIza" and be longer than 35 characters.',
      };
    }
  } else if (provider === 'OPENAI') {
    if (!apiKey.startsWith('sk-') || apiKey.length < 40) {
      return {
        isValid: false,
        message: 'Invalid OpenAI API key format. Keys should start with "sk-" and be longer than 40 characters.',
      };
    }
  }

  if (apiKey.length < 10) {
    return {
      isValid: false,
      message: 'API key appears to be too short',
    };
  }

  return {
    isValid: true,
    message: `${provider === 'GEMINI' ? 'Gemini' : 'OpenAI'} API key is configured`,
  };
};

/**
 * Optimizes prompts to reduce token usage
 */
export const optimizePrompt = (userMessage) => {
  const basePrompt = "As a helpful personal assistant, provide a concise, practical response to: ";
  const trimmedMessage = userMessage.trim().substring(0, CONFIG.OPTIMIZATION.MAX_MESSAGE_LENGTH);
  return basePrompt + trimmedMessage;
};

/**
 * Gets theme colors based on theme name and accent color
 */
export const getThemeColors = (themeName, accentColor, customColor = null) => {
  const theme = CONFIG.UI.THEMES[themeName] || CONFIG.UI.THEMES[CONFIG.UI.DEFAULT_THEME];
  let accent;

  if (accentColor === 'CUSTOM' && customColor) {
    accent = customColor;
  } else if (accentColor === 'MONOCHROME') {
    accent = themeName === 'DARK' ? '#ffffff' : '#000000';
  } else {
    accent = CONFIG.UI.ACCENT_COLORS[accentColor] || CONFIG.UI.ACCENT_COLORS[CONFIG.UI.DEFAULT_ACCENT];
  }

  const colors = { ...theme };
  colors.BUBBLE_USER = accent;
  colors.ACCENT = accent;

  if (accentColor === 'MONOCHROME') {
    if (themeName === 'DARK') {
      colors.BUBBLE_TEXT_USER = '#000000';
    } else {
      colors.BUBBLE_TEXT_USER = '#ffffff';
    }
  } else {
    colors.BUBBLE_TEXT_USER = '#ffffff';
  }

  colors.ACCENT_LIGHT = accent + '80';

  return colors;
};

/**
 * Returns available AI provider options
 */
export const getAIProviderOptions = (t) => {
  return [
    {
      key: 'GEMINI',
      name: CONFIG.AI_PROVIDERS.GEMINI.name,
      displayName: t ? t('AI_PROVIDER_GEMINI') : 'Google Gemini',
      icon: 'sparkles',
      description: t ? t('AI_PROVIDER_GEMINI_DESC') : 'Fast and cost-effective AI responses',
      setupUrl: 'https://makersuite.google.com/app/apikey',
    },
    {
      key: 'OPENAI',
      name: CONFIG.AI_PROVIDERS.OPENAI.name,
      displayName: t ? t('AI_PROVIDER_OPENAI') : 'OpenAI GPT',
      icon: 'chatbubbles',
      description: t ? t('AI_PROVIDER_OPENAI_DESC') : 'Advanced conversational AI',
      setupUrl: 'https://platform.openai.com/api-keys',
    },
  ];
};

/**
 * Returns available accent color options
 */
export const getAccentColorOptions = (t) => {
  const colorNames = {
    UNICORN_DREAMS: t ? t('COLOR_UNICORN_DREAMS') : 'Unicorn Dreams',
    BUBBLEGUM_POP: t ? t('COLOR_BUBBLEGUM_POP') : 'Bubblegum Pop',
    MINTY_FRESH: t ? t('COLOR_MINTY_FRESH') : 'Minty Fresh',
    SUNSET_VIBES: t ? t('COLOR_SUNSET_VIBES') : 'Sunset Vibes',
    PEACHY_KEEN: t ? t('COLOR_PEACHY_KEEN') : 'Peachy Keen',
    COTTON_CANDY: t ? t('COLOR_COTTON_CANDY') : 'Cotton Candy',
    SKY_DREAMS: t ? t('COLOR_SKY_DREAMS') : 'Sky Dreams',
    LAVENDER_LOVE: t ? t('COLOR_LAVENDER_LOVE') : 'Lavender Love',
    MERMAID_TAIL: t ? t('COLOR_MERMAID_TAIL') : 'Mermaid Tail',
    MONOCHROME: t ? t('COLOR_MONOCHROME') : 'Monochrome',
  };

  return Object.keys(CONFIG.UI.ACCENT_COLORS).map(key => ({
    name: key,
    color: CONFIG.UI.ACCENT_COLORS[key],
    displayName: colorNames[key] || key,
  }));
};

export default CONFIG;
