import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

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
  const scrollViewRef = useRef();

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
              <Text style={{
                color: theme.TEXT_PRIMARY,
                fontSize: 16,
                lineHeight: 22,
                fontWeight: '400',
              }}>
                {message.text}
              </Text>
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, backgroundColor: theme.BACKGROUND }}
        contentContainerStyle={{ paddingTop: 10, flexGrow: 0 }}
        showsVerticalScrollIndicator={false}
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
        backgroundColor: theme.BACKGROUND,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 12 : 0,
        marginBottom: Platform.OS === 'android' ? 12 : 0,
        // borderTopWidth: 1,
        borderTopColor: theme.BORDER,
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
    </KeyboardAvoidingView>
  );
};

export default CustomChat;
