# Cloak Protocol - Mobile App

Este projeto agora suporta desenvolvimento mobile usando Capacitor, permitindo criar aplicações nativas para Android.

## Configuração do Ambiente

### Pré-requisitos

1. **Node.js** (versão 20.10.0 ou superior)
2. **Android Studio** com Android SDK
3. **Java Development Kit (JDK)** 11 ou superior

### Instalação do Android Studio

1. Baixe o Android Studio em: https://developer.android.com/studio
2. Instale o Android SDK através do Android Studio
3. Configure as variáveis de ambiente:
   ```bash
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

## Scripts Disponíveis

### Desenvolvimento Web
```bash
npm run dev          # Inicia o servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Inicia o servidor de produção
```

### Desenvolvimento Mobile
```bash
npm run build:mobile # Build + sincronização com Capacitor
npm run android      # Executa no dispositivo/emulador Android
npm run android:dev  # Executa com live reload
npm run android:build # Build completo para Android
npm run android:open # Abre o projeto no Android Studio
```

## Workflow de Desenvolvimento

### 1. Desenvolvimento Web
```bash
npm run dev
```
Desenvolva normalmente no navegador em `http://localhost:3000`

### 2. Teste Mobile
```bash
npm run build:mobile
npm run android
```

### 3. Desenvolvimento com Live Reload
```bash
npm run android:dev
```
Isso permite que você veja as mudanças em tempo real no dispositivo/emulador.

## Configuração do Projeto Android

O projeto Android foi criado em `android/` e contém:

- **App ID**: `com.cloakprotocol.app`
- **App Name**: `Cloak Protocol`
- **Web Directory**: `out` (build estático do Next.js)

## Plugins Capacitor Instalados

- **@capacitor/splash-screen**: Tela de splash personalizada
- **@capacitor/status-bar**: Controle da barra de status
- **@capacitor/keyboard**: Controle do teclado virtual

## Configurações Importantes

### Capacitor Config (`capacitor.config.ts`)
```typescript
{
  appId: 'com.cloakprotocol.app',
  appName: 'Cloak Protocol',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
}
```

### Next.js Config (`next.config.js`)
```javascript
{
  output: 'export',        // Exportação estática
  trailingSlash: true,     // URLs com trailing slash
  images: {
    unoptimized: true      // Imagens não otimizadas para mobile
  }
}
```

## Solução de Problemas

### Erro de Build
Se encontrar erros de build, verifique:
1. Se o Android SDK está instalado corretamente
2. Se as variáveis de ambiente estão configuradas
3. Se o dispositivo/emulador está conectado

### Live Reload não funciona
Certifique-se de que:
1. O dispositivo e o computador estão na mesma rede
2. O firewall não está bloqueando a conexão
3. Use `npm run android:dev` com a flag `--external`

### Problemas de Performance
Para melhorar a performance no mobile:
1. Otimize imagens
2. Use lazy loading
3. Minimize o bundle size
4. Configure service workers se necessário

## Próximos Passos

1. **Customização do App**: Edite `android/app/src/main/res/` para ícones e splash screen
2. **Plugins Adicionais**: Instale plugins específicos conforme necessário
3. **Build de Produção**: Configure signing para publicação na Play Store
4. **Testes**: Implemente testes automatizados para mobile

## Recursos Úteis

- [Documentação Capacitor](https://capacitorjs.com/docs/)
- [Guia Android Capacitor](https://capacitorjs.com/docs/android)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
