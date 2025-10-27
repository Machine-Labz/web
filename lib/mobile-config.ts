// Configurações específicas para mobile
export const mobileConfig = {
  // Configurações de UI
  ui: {
    // Botões maiores no mobile
    buttonSize: {
      mobile: "lg",
      web: "default",
    },
    // Espaçamento adaptado
    spacing: {
      mobile: "space-y-4",
      web: "space-y-2",
    },
    // Layout responsivo
    layout: {
      mobile: "flex-col",
      web: "flex-row",
    },
    // Margens específicas para mobile
    margins: {
      top: {
        mobile: "mt-8",
        web: "",
      },
      bottom: {
        mobile: "mb-8",
        web: "",
      },
      sides: {
        mobile: "mx-4",
        web: "",
      },
      full: {
        mobile: "mt-8 mb-8 mx-4",
        web: "",
      },
    },
  },

  // Configurações de funcionalidades
  features: {
    // Habilita recursos nativos apenas no mobile
    nativeFeatures: {
      camera: true,
      notifications: true,
      biometrics: true,
      hapticFeedback: true,
      fileSystem: true,
    },
    // Configurações específicas por plataforma
    platform: {
      android: {
        statusBarStyle: "dark",
        navigationBarColor: "#000000",
        immersiveMode: true,
      },
      ios: {
        statusBarStyle: "dark",
        prefersLargeTitles: true,
        modalPresentationStyle: "pageSheet",
      },
    },
  },

  // Configurações de performance
  performance: {
    // Lazy loading mais agressivo no mobile
    lazyLoading: {
      mobile: true,
      web: false,
    },
    // Compressão de imagens
    imageOptimization: {
      mobile: true,
      web: false,
    },
    // Cache mais agressivo
    caching: {
      mobile: "aggressive",
      web: "standard",
    },
  },
};

// Função helper para obter configuração baseada na plataforma
export function getMobileConfig(platform: string, key: string) {
  const config = mobileConfig as any;
  const platformKey = platform === "web" ? "web" : "mobile";

  if (config[key] && typeof config[key] === "object") {
    return config[key][platformKey] || config[key].default;
  }

  return config[key];
}

// Função para aplicar estilos condicionais
export function getConditionalStyles(
  platform: string,
  styles: {
    mobile?: string;
    web?: string;
    android?: string;
    ios?: string;
  }
) {
  if (platform === "android" && styles.android) {
    return styles.android;
  }
  if (platform === "ios" && styles.ios) {
    return styles.ios;
  }
  if (platform === "web" && styles.web) {
    return styles.web;
  }
  if (styles.mobile) {
    return styles.mobile;
  }
  return "";
}
