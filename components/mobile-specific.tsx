"use client";

import React from "react";
import { usePlatform, useMobileFeatures } from "@/hooks/use-platform";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Monitor, SmartphoneIcon, Apple } from "lucide-react";

interface MobileSpecificComponentProps {
  children?: React.ReactNode;
}

export function MobileSpecificComponent({
  children,
}: MobileSpecificComponentProps) {
  const platform = usePlatform();
  const mobileFeatures = useMobileFeatures();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {platform.isMobile ? (
            <Smartphone className="w-5 h-5" />
          ) : (
            <Monitor className="w-5 h-5" />
          )}
          Detecção de Plataforma
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações da Plataforma */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Plataforma Atual</h3>
            <Badge variant={platform.isMobile ? "default" : "secondary"}>
              {platform.platform.toUpperCase()}
            </Badge>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Tipo</h3>
            <Badge variant={platform.isNative ? "default" : "outline"}>
              {platform.isNative ? "Nativo" : "Web"}
            </Badge>
          </div>
        </div>

        {/* Funcionalidades Disponíveis */}
        <div>
          <h3 className="font-semibold mb-2">Funcionalidades Disponíveis</h3>
          <div className="flex flex-wrap gap-2">
            {mobileFeatures.canUseNativeFeatures && (
              <Badge variant="default">Recursos Nativos</Badge>
            )}
            {mobileFeatures.canUseBiometrics && (
              <Badge variant="default">Biometria</Badge>
            )}
            {mobileFeatures.canUseCamera && (
              <Badge variant="default">Câmera</Badge>
            )}
            {mobileFeatures.canUseNotifications && (
              <Badge variant="default">Notificações</Badge>
            )}
            {mobileFeatures.canUseHapticFeedback && (
              <Badge variant="default">Feedback Háptico</Badge>
            )}
            {!mobileFeatures.isMobile && (
              <Badge variant="outline">Apenas Web</Badge>
            )}
          </div>
        </div>

        {/* Botões Específicos por Plataforma */}
        <div>
          <h3 className="font-semibold mb-2">Ações Específicas</h3>
          <div className="flex flex-wrap gap-2">
            {platform.isAndroid && (
              <Button variant="outline" size="sm">
                <SmartphoneIcon className="w-4 h-4 mr-2" />
                Ação Android
              </Button>
            )}
            {platform.isIOS && (
              <Button variant="outline" size="sm">
                <Apple className="w-4 h-4 mr-2" />
                Ação iOS
              </Button>
            )}
            {platform.isWeb && (
              <Button variant="outline" size="sm">
                <Monitor className="w-4 h-4 mr-2" />
                Ação Web
              </Button>
            )}
            {platform.isMobile && (
              <Button variant="default" size="sm">
                <Smartphone className="w-4 h-4 mr-2" />
                Ação Mobile
              </Button>
            )}
          </div>
        </div>

        {/* Conteúdo Condicional */}
        {children && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Conteúdo Condicional</h3>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Exemplo de uso em componentes específicos
export function TransactionButton() {
  const { isMobile } = usePlatform();

  return (
    <Button
      size={isMobile ? "lg" : "default"}
      className={isMobile ? "w-full" : ""}
    >
      {isMobile ? "Enviar Transação (Mobile)" : "Enviar Transação"}
    </Button>
  );
}

export function WalletConnection() {
  const { isMobile, isAndroid, isIOS } = usePlatform();

  if (isMobile) {
    return (
      <div className="space-y-2">
        <Button className="w-full">
          {isAndroid ? "Conectar Wallet (Android)" : "Conectar Wallet (iOS)"}
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Use seu wallet mobile preferido
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button>Conectar Wallet (Web)</Button>
      <p className="text-sm text-muted-foreground text-center">
        Conecte usando extensão do navegador
      </p>
    </div>
  );
}
