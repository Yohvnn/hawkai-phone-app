import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  useColorScheme
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomChat from './components/CustomChat';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { CONFIG, getThemeColors } from './config';
import { aiService } from './services/aiService';
import { getTranslation, DEFAULT_LANGUAGE } from './languages';
import SettingsModal from './components/SettingsModal';
import ApiKeyModal from './components/ApiKeyModal';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(CONFIG.UI.DEFAULT_THEME);
  const [currentAccent, setCurrentAccent] = useState(CONFIG.UI.DEFAULT_ACCENT);
  const [customAccentColor, setCustomAccentColor] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState(CONFIG.UI.DEFAULT_LANGUAGE);
  const [currentProvider, setCurrentProvider] = useState(CONFIG.DEFAULT_AI_PROVIDER);
  const [userApiKey, setUserApiKey] = useState('');
  const [assistantName, setAssistantName] = useState('Assistant');
  const [messageCount, setMessageCount] = useState(0);

  const systemColorScheme = useColorScheme();
  const actualTheme = currentTheme === 'SYSTEM'
    ? (systemColorScheme === 'dark' ? 'DARK' : 'LIGHT')
    : currentTheme;

  const colors = getThemeColors(actualTheme, currentAccent, customAccentColor);
  const t = useCallback((key) => getTranslation(key, currentLanguage), [currentLanguage]);

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    const welcomeText = userApiKey || CONFIG.GEMINI.API_KEY !== 'YOUR_GEMINI_API_KEY_HERE'
      ? t('WELCOME_MESSAGE')
      : t('WELCOME_NO_API');

    setMessages([
      {
        _id: 1,
        text: welcomeText,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: assistantName,
          avatar: '🤖',
        },
      },
    ]);
  }, [userApiKey, assistantName, currentLanguage, t]);

  const loadPreferences = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('userTheme');
      const savedAccent = await AsyncStorage.getItem('userAccent');
      const savedCustomColor = await AsyncStorage.getItem('userCustomColor');
      const savedLanguage = await AsyncStorage.getItem('userLanguage');
      const savedProvider = await AsyncStorage.getItem('userProvider');
      const savedApiKey = await AsyncStorage.getItem('userApiKey');
      const savedAssistantName = await AsyncStorage.getItem('assistantName');
      const savedMessageCount = await AsyncStorage.getItem('messageCount');

      if (savedTheme) setCurrentTheme(savedTheme);
      if (savedAccent) setCurrentAccent(savedAccent);
      if (savedCustomColor) setCustomAccentColor(savedCustomColor);
      if (savedLanguage) setCurrentLanguage(savedLanguage);

      // Force Gemini provider since OpenAI is temporarily disabled
      setCurrentProvider(providerToUse);

      if (savedApiKey) {
        setUserApiKey(savedApiKey);
        // Initialize AI service with Gemini provider and API key
        try {
        } catch (error) {
          console.warn('Failed to initialize AI service with saved credentials:', error);
        }
      }
      if (savedAssistantName) setAssistantName(savedAssistantName);
      if (savedMessageCount) setMessageCount(parseInt(savedMessageCount));
    } catch (error) {
      console.log('No saved preferences found');
    }
  };

  const savePreferences = async (theme, accent, language, provider, customColor = null) => {
    try {
      await AsyncStorage.setItem('userTheme', theme);
      await AsyncStorage.setItem('userAccent', accent);
      if (customColor) {
        await AsyncStorage.setItem('userCustomColor', customColor);
      } else if (accent !== 'CUSTOM') {
        await AsyncStorage.removeItem('userCustomColor');
      }
      if (language) await AsyncStorage.setItem('userLanguage', language);
      if (provider) await AsyncStorage.setItem('userProvider', provider);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme);
    savePreferences(newTheme, currentAccent, currentLanguage, currentProvider, customAccentColor);
  };

  const handleAccentChange = (newAccent, customColor = null) => {
    setCurrentAccent(newAccent);
    if (customColor) {
      setCustomAccentColor(customColor);
    } else if (newAccent !== 'CUSTOM') {
      setCustomAccentColor(null);
    }
    savePreferences(currentTheme, newAccent, currentLanguage, currentProvider, customColor);
  };

  const handleLanguageChange = (newLanguage) => {
    setCurrentLanguage(newLanguage);
    savePreferences(currentTheme, currentAccent, newLanguage, currentProvider, customAccentColor);
  };

  const handleProviderChange = (newProvider) => {
    setCurrentProvider(newProvider);
    savePreferences(currentTheme, currentAccent, currentLanguage, newProvider, customAccentColor);
    aiService.reset();
    if (userApiKey) {
      try {
        aiService.initialize(newProvider, userApiKey);
      } catch (error) {
        console.warn('Failed to initialize new provider:', error);
      }
    }
  };

  const handleAssistantNameChange = async (newName) => {
    try {
      await AsyncStorage.setItem('assistantName', newName);
      setAssistantName(newName);
    } catch (error) {
      console.error('Failed to save assistant name:', error);
      Alert.alert('Error', 'Failed to save assistant name. Please try again.');
    }
  };

  const handleSaveApiKey = async (newApiKey) => {
    try {
      await AsyncStorage.setItem('userApiKey', newApiKey);
      setUserApiKey(newApiKey);
      setMessageCount(0);
      await AsyncStorage.setItem('messageCount', '0');

      try {
        const result = await aiService.initialize(currentProvider, newApiKey);
        Alert.alert('Success!', result.message + ' You can now start chatting with unlimited messages!');
      } catch (error) {
        console.error('Failed to initialize AI with new key:', error);
        Alert.alert('API Key Error', error.message || 'Failed to initialize AI. Please check if the key is valid for the selected provider.');
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      Alert.alert('Error', 'Failed to save API key. Please try again.');
    }
  };

  const saveMessageCount = async (count) => {
    try {
      await AsyncStorage.setItem('messageCount', count.toString());
    } catch (error) {
      console.error('Failed to save message count:', error);
    }
  };

  const onSend = useCallback(async (newMessages = []) => {
    if (!aiService.isReady() && messageCount >= 5) {
      Alert.alert(
        'Message Limit Reached',
        `You\'ve sent 5 messages! To continue chatting, please add your ${CONFIG.AI_PROVIDERS[currentProvider].name} API key.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add API Key', onPress: () => setShowApiKeyModal(true) }
        ]
      );
      return;
    }

    if (!aiService.isReady()) {
      const newCount = messageCount + 1;
      setMessageCount(newCount);
      saveMessageCount(newCount);

      setMessages(previousMessages => [...previousMessages, ...newMessages]);

      setIsTyping(true);
      setTimeout(() => {
        const demoResponse = {
          _id: Math.round(Math.random() * 1000000),
          text: `This is a demo response (${newCount}/5 free messages). To get real AI responses from ${CONFIG.AI_PROVIDERS[currentProvider].name}, please add your API key in settings!`,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: assistantName,
            avatar: '🤖',
          },
        };
        setMessages(previousMessages => [...previousMessages, demoResponse]);
        setIsTyping(false);
      }, 1000);
      return;
    }

    setMessages(previousMessages => [...previousMessages, ...newMessages]);
    setIsTyping(true);

    try {
      const userMessage = newMessages[0].text;
      const response = await aiService.generateResponse(userMessage);

      const assistantMessage = {
        _id: Math.round(Math.random() * 1000000),
        text: response,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: assistantName,
          avatar: '🤖',
        },
      };

      setMessages(previousMessages => [...previousMessages, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);

      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      if (error.message.includes('API key')) {
        errorMessage = `Please check your ${CONFIG.AI_PROVIDERS[currentProvider].name} API key configuration.`;
      }

      const errorResponse = {
        _id: Math.round(Math.random() * 1000000),
        text: errorMessage,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: assistantName,
          avatar: '⚠️',
        },
      };

      setMessages(previousMessages => [...previousMessages, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  }, [aiService, messageCount, assistantName, currentProvider]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.BACKGROUND }]}>
      <StatusBar style={colors.STATUS_BAR} />

      <View style={[styles.header, {
        borderBottomColor: colors.BORDER,
      }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.TEXT_PRIMARY }]}>{CONFIG.APP.NAME}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.TEXT_MUTED }]}>
              {!aiService.isReady() ?
                (messageCount >= 5 ? 'Add API Key to Continue' : `${5 - messageCount} free messages left`) :
                isTyping ? `${assistantName} is typing...` : `Online • ${assistantName}`
              }
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.settingsButton, {
              backgroundColor: colors.CARD,
              borderColor: colors.BORDER,
            }]}
            onPress={() => setShowSettings(true)}
          >
            <Ionicons name="settings-outline" size={20} color={colors.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>
      </View>

      <CustomChat
        messages={messages}
        onSend={onSend}
        user={{
          _id: 1,
        }}
        isLoading={isTyping}
        theme={colors}
        accentColor={colors.ACCENT}
        t={t}
      />

      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        currentTheme={currentTheme}
        currentAccent={currentAccent}
        currentLanguage={currentLanguage}
        currentProvider={currentProvider}
        onThemeChange={handleThemeChange}
        onAccentChange={handleAccentChange}
        onLanguageChange={handleLanguageChange}
        onProviderChange={handleProviderChange}
        onApiKeyPress={() => setShowApiKeyModal(true)}
        onAssistantNameChange={handleAssistantNameChange}
        userApiKey={userApiKey}
        assistantName={assistantName}
        colors={colors}
        t={t}
      />

      <ApiKeyModal
        visible={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSaveApiKey={handleSaveApiKey}
        currentApiKey={userApiKey}
        currentProvider={currentProvider}
        colors={colors}
        t={t}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 30,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {},
  appIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
