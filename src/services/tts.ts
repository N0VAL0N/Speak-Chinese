import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { AppLauncher } from '@capacitor/app-launcher';

async function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (window.speechSynthesis.getVoices().length) {
      resolve(window.speechSynthesis.getVoices());
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
    }
  });
}

export async function speak(text: string, lang: string = 'zh-CN'): Promise<void> {
  console.log(`[TTS] Озвучка: "${text}" (${lang})`);
  if (!Capacitor.isNativePlatform()) {
    return new Promise(async (resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }
      window.speechSynthesis.cancel();
      const voices = await waitForVoices();
      let selectedVoice = voices.find(v => v.lang === 'zh-CN' || v.lang.startsWith('zh-'));
      if (!selectedVoice) {
        console.warn('No Chinese voice found, using default');
        selectedVoice = voices[0];
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        reject(new Error(`Speech synthesis failed: ${event.error}`));
      };
      window.speechSynthesis.speak(utterance);
    });
  }

  try {
    await TextToSpeech.speak({
      text,
      lang,
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
    });
  } catch (error) {
    console.error('TTS error:', error);
    throw error;
  }
}

export async function isChineseVoiceAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    const voices = await waitForVoices();
    return voices.some(v => v.lang === 'zh-CN' || v.lang.startsWith('zh-'));
  }
  
  // Пробуем несколько раз с задержкой
  for (let i = 0; i < 5; i++) {
    try {
      const result = await TextToSpeech.getSupportedLanguages();
      return result.languages.includes('zh-CN') || result.languages.some(l => l.startsWith('zh-'));
    } catch (error) {
      console.warn(`TTS not ready, attempt ${i + 1}/5`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return false;
}

export async function openTtsSettings() {
  if (!Capacitor.isNativePlatform()) return;
  
  const intents = [
    'android.settings.TTS_SETTINGS',
    'com.android.settings.TTS_SETTINGS',
    'settings:action:tts_settings'
  ];
  
  for (const intent of intents) {
    try {
      await AppLauncher.openUrl({ url: intent });
      return;
    } catch (e) {
      console.warn(`Failed with intent: ${intent}`);
    }
  }
  
  // Финальный fallback
  try {
    await AppLauncher.openUrl({
      url: 'intent:#Intent;action=android.settings.TTS_SETTINGS;end'
    });
  } catch (error) {
    console.error('Cannot open TTS settings:', error);
    throw new Error('Не удалось открыть настройки TTS');
  }
}