# Modificações Mobile-Específicas

Este guia mostra como fazer modificações específicas para mobile usando Capacitor.

## 🎯 **Estratégias Principais**

### **1. Detecção de Plataforma**

```typescript
import { usePlatform } from '@/hooks/use-platform';

function MyComponent() {
  const { isMobile, isAndroid, isIOS, isWeb } = usePlatform();
  
  return (
    <div>
      {isMobile ? (
        <MobileLayout />
      ) : (
        <WebLayout />
      )}
    </div>
  );
}
```

### **2. Componentes Condicionais**

```typescript
// Botão que se adapta à plataforma
function AdaptiveButton() {
  const { isMobile } = usePlatform();
  
  return (
    <Button 
      size={isMobile ? "lg" : "default"}
      className={isMobile ? "w-full" : ""}
    >
      {isMobile ? "Ação Mobile" : "Ação Web"}
    </Button>
  );
}
```

### **3. Estilos Condicionais**

```typescript
// CSS que muda baseado na plataforma
function ResponsiveCard() {
  const { isMobile } = usePlatform();
  
  return (
    <div className={`
      p-4 rounded-lg
      ${isMobile ? 'bg-blue-50' : 'bg-gray-50'}
      ${isMobile ? 'space-y-4' : 'space-y-2'}
    `}>
      Conteúdo adaptado
    </div>
  );
}
```

## 📱 **Exemplos Práticos**

### **Layout Responsivo**

```typescript
function TransactionForm() {
  const { isMobile } = usePlatform();
  
  return (
    <div className={`
      ${isMobile ? 'flex-col space-y-4' : 'flex-row space-x-4'}
    `}>
      <Input placeholder="Valor" />
      <Input placeholder="Destinatário" />
      <Button className={isMobile ? 'w-full' : ''}>
        Enviar
      </Button>
    </div>
  );
}
```

### **Navegação Mobile**

```typescript
function Navigation() {
  const { isMobile } = usePlatform();
  
  if (isMobile) {
    return <MobileBottomNavigation />;
  }
  
  return <DesktopSidebar />;
}
```

### **Funcionalidades Nativas**

```typescript
import { Camera } from '@capacitor/camera';

function QRScanner() {
  const { isMobile } = usePlatform();
  
  const scanQR = async () => {
    if (isMobile) {
      // Usar câmera nativa
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: 'uri'
      });
      return image;
    } else {
      // Usar scanner web
      return webQRScanner();
    }
  };
  
  return (
    <Button onClick={scanQR}>
      {isMobile ? "Escanear QR" : "Upload QR"}
    </Button>
  );
}
```

## 🔧 **Configurações Mobile**

### **Capacitor Config**

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  plugins: {
    StatusBar: {
      style: "dark",
      backgroundColor: "#000000",
    },
    Keyboard: {
      resize: "body",
      style: "dark",
    },
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },
};
```

### **Configurações de UI**

```typescript
// lib/mobile-config.ts
export const mobileConfig = {
  ui: {
    buttonSize: {
      mobile: 'lg',
      web: 'default'
    },
    spacing: {
      mobile: 'space-y-4',
      web: 'space-y-2'
    }
  }
};
```

## 🚀 **Plugins Úteis para Mobile**

### **Instalar Plugins**

```bash
# Câmera
npm install @capacitor/camera

# Notificações
npm install @capacitor/push-notifications

# Biometria
npm install @capacitor/biometric-auth

# Feedback háptico
npm install @capacitor/haptics

# Sistema de arquivos
npm install @capacitor/filesystem

# Geolocalização
npm install @capacitor/geolocation
```

### **Usar Plugins**

```typescript
import { Camera } from '@capacitor/camera';
import { Haptics } from '@capacitor/haptics';

function MobileFeatures() {
  const { isMobile } = usePlatform();
  
  const takePhoto = async () => {
    if (isMobile) {
      await Haptics.vibrate();
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: 'uri'
      });
      return photo;
    }
  };
  
  return (
    <Button onClick={takePhoto} disabled={!isMobile}>
      Tirar Foto
    </Button>
  );
}
```

## 📋 **Checklist de Implementação**

### **Para Cada Componente Mobile:**

- [ ] **Detectar plataforma** usando `usePlatform()`
- [ ] **Adaptar tamanhos** de botões e elementos
- [ ] **Implementar layouts** responsivos
- [ ] **Adicionar funcionalidades nativas** quando aplicável
- [ ] **Testar em ambas as plataformas** (web e mobile)
- [ ] **Otimizar performance** para mobile

### **Para Funcionalidades Nativas:**

- [ ] **Instalar plugin** necessário
- [ ] **Configurar permissões** no Android/iOS
- [ ] **Implementar fallback** para web
- [ ] **Tratar erros** adequadamente
- [ ] **Testar em dispositivo real**

## 🎨 **Padrões de Design Mobile**

### **Botões**
- Maiores no mobile (44px mínimo)
- Largura total em formulários
- Espaçamento adequado entre elementos

### **Formulários**
- Campos maiores
- Validação em tempo real
- Teclado otimizado

### **Navegação**
- Bottom navigation no mobile
- Sidebar no desktop
- Gestos touch-friendly

### **Modais**
- Fullscreen no mobile
- Bottom sheet quando apropriado
- Fácil fechamento com gestos

## 🔍 **Debugging Mobile**

### **Chrome DevTools**
```bash
# Conectar ao dispositivo
chrome://inspect/#devices
```

### **Live Reload**
```bash
npm run android:dev
```

### **Logs**
```typescript
import { Capacitor } from '@capacitor/core';

console.log('Platform:', Capacitor.getPlatform());
console.log('Is Native:', Capacitor.isNativePlatform());
```

## 📚 **Recursos Adicionais**

- [Documentação Capacitor](https://capacitorjs.com/docs/)
- [Plugins Capacitor](https://capacitorjs.com/docs/plugins)
- [Android Development](https://capacitorjs.com/docs/android)
- [iOS Development](https://capacitorjs.com/docs/ios)
