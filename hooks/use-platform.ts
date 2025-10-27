import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export interface PlatformInfo {
  platform: string;
  isNative: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  isWeb: boolean;
  isMobile: boolean;
}

export function usePlatform() {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo>({
    platform: "web",
    isNative: false,
    isAndroid: false,
    isIOS: false,
    isWeb: true,
    isMobile: false,
  });

  useEffect(() => {
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();

    setPlatformInfo({
      platform,
      isNative,
      isAndroid: platform === "android",
      isIOS: platform === "ios",
      isWeb: platform === "web",
      isMobile: platform === "android" || platform === "ios",
    });
  }, []);

  return platformInfo;
}

// Hook para funcionalidades específicas do mobile
export function useMobileFeatures() {
  const { isMobile, isAndroid, isIOS } = usePlatform();

  return {
    isMobile,
    isAndroid,
    isIOS,
    // Funcionalidades específicas do mobile
    canUseNativeFeatures: isMobile,
    canUseBiometrics: isMobile,
    canUseCamera: isMobile,
    canUseNotifications: isMobile,
    canUseHapticFeedback: isMobile,
  };
}
