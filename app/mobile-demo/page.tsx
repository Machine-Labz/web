"use client";

import React from "react";
import {
  MobileSpecificComponent,
  TransactionButton,
  WalletConnection,
} from "@/components/mobile-specific";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePlatform } from "@/hooks/use-platform";
import { MobileLayout, PageLayout } from "@/components/mobile-layout";
import { MobileTopMargin } from "@/components/mobile-top-margin";
import {
  MobileWalletButton,
  MobileWalletInfo,
} from "@/components/mobile-wallet-button";
import { MobileWalletDetector } from "@/components/mobile-wallet-provider";

export default function MobileDemoPage() {
  const platform = usePlatform();

  return (
    <PageLayout>
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Mobile-Specific Features</h1>
          <p className="text-lg text-muted-foreground">
            Demonstração de funcionalidades específicas para mobile usando
            Capacitor
          </p>
          <Badge
            variant={platform.isMobile ? "default" : "secondary"}
            className="text-lg px-4 py-2"
          >
            Executando em: {platform.platform.toUpperCase()}
          </Badge>
        </div>

        {/* Demonstração de Margem Mobile */}
        <Card>
          <CardHeader>
            <CardTitle>Margem Mobile Automática</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Este card tem margem superior automática quando executado no
              mobile
            </p>
            <MobileTopMargin>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-2">
                  Conteúdo com Margem Mobile
                </h4>
                <p className="text-sm">
                  Este conteúdo tem margem superior adicional no mobile
                </p>
              </div>
            </MobileTopMargin>
          </CardContent>
        </Card>

        {/* Mobile Wallet Adapter */}
        <Card>
          <CardHeader>
            <CardTitle>Mobile Wallet Adapter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MobileWalletDetector />
            <MobileWalletInfo />
            <MobileWalletButton
              className="w-full"
              onConnect={() => console.log("Mobile wallet connected")}
              onDisconnect={() => console.log("Mobile wallet disconnected")}
            />
          </CardContent>
        </Card>

        {/* Componente Principal */}
        <MobileSpecificComponent>
          <div className="space-y-4">
            <h4 className="font-semibold">Exemplos de Uso:</h4>
            <div className="space-y-2">
              <p className="text-sm">
                • <strong>Botões maiores</strong> no mobile para melhor
                usabilidade
              </p>
              <p className="text-sm">
                • <strong>Layouts responsivos</strong> adaptados para touch
              </p>
              <p className="text-sm">
                • <strong>Funcionalidades nativas</strong> como câmera e
                notificações
              </p>
              <p className="text-sm">
                • <strong>Navegação otimizada</strong> para dispositivos móveis
              </p>
            </div>
          </div>
        </MobileSpecificComponent>

        {/* Exemplos de Componentes Específicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Botão de Transação</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionButton />
              <p className="text-sm text-muted-foreground mt-2">
                Este botão se adapta automaticamente ao tamanho da tela
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conexão de Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <WalletConnection />
              <p className="text-sm text-muted-foreground mt-2">
                Interface adaptada para cada plataforma
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Exemplos de CSS Condicional */}
        <Card>
          <CardHeader>
            <CardTitle>Estilos Condicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`p-4 rounded-lg border ${
                platform.isMobile
                  ? "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
                  : "bg-gray-50 border-gray-200 dark:bg-gray-950/20 dark:border-gray-800"
              }`}
            >
              <h4 className="font-semibold mb-2">
                {platform.isMobile ? "Estilo Mobile" : "Estilo Web"}
              </h4>
              <p className="text-sm">
                Este card muda de cor baseado na plataforma detectada
              </p>
            </div>

            <div
              className={`grid gap-4 ${
                platform.isMobile ? "grid-cols-1" : "grid-cols-3"
              }`}
            >
              <div className="p-3 bg-muted rounded">Item 1</div>
              <div className="p-3 bg-muted rounded">Item 2</div>
              <div className="p-3 bg-muted rounded">Item 3</div>
            </div>
          </CardContent>
        </Card>

        {/* Código de Exemplo */}
        <Card>
          <CardHeader>
            <CardTitle>Como Implementar</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              {`// 1. Importar o hook
import { usePlatform } from '@/hooks/use-platform';

// 2. Usar no componente
function MyComponent() {
  const { isMobile, isAndroid, isIOS } = usePlatform();
  
  return (
    <div>
      {isMobile ? (
        <Button className="w-full">Mobile Button</Button>
      ) : (
        <Button>Web Button</Button>
      )}
    </div>
  );
}`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
