import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.atezis.speakchinese',
  appName: 'Speak Chinese',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;