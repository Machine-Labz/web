# 🔧 Mobile Wallet Adapter - Troubleshooting Guide

## Problemas Comuns e Soluções

### 1. **Problema: Solflare abre mas nada acontece**

**Causa Principal**: Incompatibilidade de rede/cluster entre o dApp e a wallet mobile.

**Solução**:
- ✅ **Verificar rede na wallet**: Certifique-se que o Solflare Mobile está na mesma rede que o dApp
- ✅ **Verificar rede no dApp**: Confirme se `NEXT_PUBLIC_SOLANA_RPC_URL` está configurado corretamente
- ✅ **Sincronizar redes**: Se o dApp usa `devnet`, o Solflare Mobile também deve estar em `devnet`

### 2. **Problema: Wallet não é detectada**

**Causas Possíveis**:
- Browser incompatível (apenas Chrome Android suportado)
- Wallet não instalada
- Permissões insuficientes

**Soluções**:
- ✅ **Usar Chrome Android**: Firefox, Opera, Brave não suportam MWA
- ✅ **Instalar Solflare Mobile**: Baixar da Google Play Store
- ✅ **Verificar permissões**: Permitir conexões locais no Chrome

### 3. **Problema: Conexão falha silenciosamente**

**Solução**: Seguir as diretrizes de UX do Mobile Wallet Adapter:

```typescript
// ✅ CORRETO - Seguir diretrizes MWA
const handleConnect = async () => {
  if (wallet?.adapter?.name === SolanaMobileWalletAdapterWalletName) {
    // Se MWA já selecionado, conectar diretamente
    await connect();
  } else {
    // Se MWA não selecionado, selecionar primeiro
    select(SolanaMobileWalletAdapterWalletName);
  }
};
```

### 4. **Problema: Rede incorreta**

**Detecção Automática Implementada**:
```typescript
const getNetworkFromRpc = (rpcUrl: string) => {
  if (rpcUrl.includes('devnet')) return WalletAdapterNetwork.Devnet;
  if (rpcUrl.includes('testnet')) return WalletAdapterNetwork.Testnet;
  return WalletAdapterNetwork.Mainnet;
};
```

## 🔍 Debug Tools Implementados

### 1. **MobileWalletDebug Component**
- Mostra status da plataforma (Mobile/Web)
- Lista wallets disponíveis
- Exibe status de conexão
- Fornece ações de debug

### 2. **Informações de Ambiente**
- User Agent do browser
- RPC URL configurada
- Plataforma detectada
- Status do Mobile Wallet Adapter

## 📱 Checklist de Verificação

### Para o Usuário:
- [ ] Usando Chrome Android (não Firefox/Opera/Brave)
- [ ] Solflare Mobile instalado e atualizado
- [ ] Solflare Mobile na mesma rede que o dApp
- [ ] Permissões de conexão local habilitadas

### Para o Desenvolvedor:
- [ ] `NEXT_PUBLIC_SOLANA_RPC_URL` configurado corretamente
- [ ] Mobile Wallet Adapter configurado com rede correta
- [ ] Seguindo diretrizes de UX do MWA
- [ ] Usando `select()` antes de `connect()` quando necessário

## 🚨 Erros Específicos

### "Wallet not found"
- **Causa**: Solflare Mobile não instalado
- **Solução**: Instalar Solflare Mobile da Google Play Store

### "Network mismatch"
- **Causa**: dApp em devnet, Solflare em mainnet (ou vice-versa)
- **Solução**: Sincronizar redes em ambos

### "Connection timeout"
- **Causa**: Permissões insuficientes ou browser incompatível
- **Solução**: Usar Chrome Android com permissões completas

## 🔧 Configurações Recomendadas

### Environment Variables:
```bash
# Para desenvolvimento
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Para produção
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### Mobile Wallet Adapter Config:
```typescript
new SolanaMobileWalletAdapter({
  addressSelector: createDefaultAddressSelector(),
  appIdentity: {
    name: "Cloak Protocol",
    uri: "https://cloakprotocol.com",
    icon: "/favicon.svg",
  },
  authorizationResultCache: createDefaultAuthorizationResultCache(),
  cluster: network, // Detectado automaticamente
  onWalletNotFound: () => {
    console.log("Mobile wallet not found");
    return Promise.resolve();
  },
})
```

## 📞 Suporte

Se os problemas persistirem:
1. Verificar logs do console no Chrome DevTools
2. Usar o componente `MobileWalletDebug` para diagnóstico
3. Confirmar compatibilidade de browser e wallet
4. Verificar configurações de rede em ambos os lados
