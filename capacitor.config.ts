import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pokepet.app',
  appName: 'PokéPet',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    Haptics: {
      // Uses native Android Vibrator service
    },
  },
};

export default config;
