import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Markdown from 'react-native-markdown-display';

const CustomChat = ({
  messages = [],
  onSend,
  user,
  isLoading = false,
  theme,
  accentColor,
  t
}) => {
  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim().length === 0) return;

    const message = {
      _id: Date.now().toString(),
      text: inputText.trim(),
      createdAt: new Date(),
      user: user,
    };

    onSend([message]);
    setInputText('');
  };

  const handleCopyMessage = async (text) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied', 'Message copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy message');
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = (message, index) => {
    const isUser = message.user._id === user._id;
    const isLastMessage = index === messages.length - 1;

    return (
      <View
        key={message._id}
        style={{
          flexDirection: 'row',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginBottom: isLastMessage ? 24 : 12,
          paddingHorizontal: 16,
        }}
      >
        <TouchableOpacity
          onLongPress={() => handleCopyMessage(message.text)}
          style={{
            maxWidth: '80%',
          }}
        >
          {isUser ? (
            <View
              style={{
                backgroundColor: accentColor,
                padding: 14,
                borderRadius: 12,
                borderBottomRightRadius: 4,
              }}
            >
              <Text style={{
                color: theme.BUBBLE_TEXT_USER,
                fontSize: 16,
                lineHeight: 22,
                fontWeight: '400',
              }}>
                {message.text}
              </Text>
              <Text style={{
                color: theme.BUBBLE_TEXT_USER + '90',
                fontSize: 12,
                marginTop: 6,
                textAlign: 'right',
                fontWeight: '400',
              }}>
                {formatTime(message.createdAt)}
              </Text>
            </View>
          ) : (
            <View
              style={{
                backgroundColor: theme.CARD,
                padding: 14,
                borderRadius: 12,
                borderBottomLeftRadius: 4,
                borderWidth: 1,
                borderColor: theme.BORDER,
              }}
            >
              <Markdown
                style={{
                  body: { color: theme.TEXT_PRIMARY, fontSize: 16, lineHeight: 22 },
                  text: { color: theme.TEXT_PRIMARY, fontSize: 16, lineHeight: 22 },
                  strong: { fontWeight: '700', color: theme.TEXT_PRIMARY },
                  em: { fontStyle: 'italic', color: theme.TEXT_PRIMARY },
                  code: {
                    backgroundColor: theme.BACKGROUND,
                    color: theme.ACCENT,
                    fontFamily: 'monospace',
                    paddingHorizontal: 4,
                    paddingVertical: 2,
                    borderRadius: 4,
                  },
                  codeBlock: {
                    backgroundColor: theme.BACKGROUND,
                    color: theme.ACCENT,
                    fontFamily: 'monospace',
                    padding: 8,
                    borderRadius: 4,
                    marginVertical: 4,
                  },
                  hr: { backgroundColor: theme.BORDER, marginVertical: 8 },
                  link: { color: theme.ACCENT },
                  list: { marginVertical: 4 },
                  listItem: { marginVertical: 2 },
                  blockquote: {
                    borderLeftWidth: 3,
                    borderLeftColor: theme.ACCENT,
                    paddingLeft: 8,
                    marginVertical: 4,
                  },
                  heading1: { fontSize: 20, fontWeight: '700', marginVertical: 4 },
                  heading2: { fontSize: 18, fontWeight: '700', marginVertical: 4 },
                  heading3: { fontSize: 16, fontWeight: '700', marginVertical: 4 },
                }}
              >
                {message.text}
              </Markdown>
              <Text style={{
                color: theme.TEXT_MUTED,
                fontSize: 12,
                marginTop: 6,
                fontWeight: '400',
              }}>
                {formatTime(message.createdAt)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.BACKGROUND }}>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, backgroundColor: theme.BACKGROUND }}
        contentContainerStyle={{
          paddingTop: 10,
          paddingBottom: 80 + keyboardHeight,
        }}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((message, index) => renderMessage(message, index))}

        {isLoading && (
          <View style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            marginBottom: 24,
            paddingHorizontal: 16,
          }}>
            <View style={{
              backgroundColor: theme.CARD,
              padding: 16,
              borderRadius: 12,
              borderBottomLeftRadius: 4,
              borderWidth: 1,
              borderColor: theme.BORDER,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <ActivityIndicator
                size="small"
                color={accentColor}
                style={{ marginRight: 8 }}
              />
              <Text style={{
                color: theme.TEXT_MUTED,
                fontSize: 14,
                fontStyle: 'italic',
                fontWeight: '400',
              }}>
                {t ? t('ASSISTANT_TYPING') : 'Thinking...'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={{
        position: 'absolute',
        bottom: keyboardHeight > 0 ? keyboardHeight + 20 : Platform.OS === 'android' ? 24 : 0,
        left: 0,
        right: 0,
        backgroundColor: theme.BACKGROUND,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 12 : 12,
        borderTopColor: theme.BORDER
      }}>
        <View style={{
          flexDirection: 'row',
          backgroundColor: theme.CARD,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 4,
          minHeight: 48,
          borderWidth: 1,
          borderColor: theme.BORDER,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
          elevation: 0.5,
        }}>
          <TextInput
            style={{
              flex: 1,
              fontSize: 16,
              color: theme.TEXT_PRIMARY,
              maxHeight: 100,
              paddingVertical: 10,
              fontWeight: '400',
              lineHeight: 22,
            }}
            placeholder={t ? t('CHAT_PLACEHOLDER') : 'Type a message...'}
            placeholderTextColor={theme.TEXT_MUTED}
            value={inputText}
            onChangeText={setInputText}
            multiline
            textAlignVertical="top"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={inputText.trim().length === 0 || isLoading}
            style={{
              marginLeft: 10,
              padding: 10,
              borderRadius: 8,
              backgroundColor: inputText.trim().length === 0 || isLoading
                ? 'transparent'
                : accentColor + '10',
            }}
          >
            <Ionicons
              name="send"
              size={20}
              color={
                inputText.trim().length === 0 || isLoading
                  ? theme.TEXT_MUTED
                  : accentColor
              }
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CustomChat;
