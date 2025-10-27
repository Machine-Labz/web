import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.cloakprotocol.app",
  appName: "Cloak Protocol",
  webDir: "out",
  server: {
    androidScheme: "https",
    // Permitir deep links para Mobile Wallet Adapter
    allowNavigation: [
      "https://solflare.com/*",
      "https://phantom.app/*",
      "solana://*",
      "solflare://*",
      "phantom://*",
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#000000",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#999999",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#000000",
    },
    Keyboard: {
      resize: "body",
      style: "dark",
      resizeOnFullScreen: true,
    },
  },
  // Configurações específicas para Android
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  // Configurações específicas para iOS (quando implementado)
  ios: {
    scheme: "Cloak Protocol",
    contentInset: "automatic",
  },
};

export default config;
