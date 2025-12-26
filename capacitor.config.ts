import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.expensesmadeeasy.app',
  appName: 'Expenses Made Easy',
  webDir: 'public', // Minimal webDir, we load from server
  server: {
    // Load the app from the live Vercel deployment
    url: 'https://expenses-made-easy-opal.vercel.app',
    cleartext: false,
  },
  plugins: {
    BackgroundGeolocation: {
      locationAuthorizationRequest: 'Always',
    },
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#ffffff',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffffff',
  },
};

export default config;
