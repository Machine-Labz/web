"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlatform } from "@/hooks/use-platform";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, ArrowRight, Loader } from "lucide-react";

interface MobileRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
  showRedirectMessage?: boolean;
}

export function MobileRedirect({
  children,
  redirectTo = "/transaction",
  showRedirectMessage = true,
}: MobileRedirectProps) {
  const { isMobile } = usePlatform();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setIsRedirecting(true);

      // Pequeno delay para mostrar a mensagem de redirecionamento
      const timer = setTimeout(() => {
        router.replace(redirectTo);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isMobile, router, redirectTo]);

  // Se for mobile, mostrar tela de redirecionamento
  if (isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <Smartphone className="w-16 h-16 text-primary" />
                <Loader className="w-6 h-6 text-primary animate-spin absolute -top-1 -right-1" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Cloak Protocol</h2>
              <p className="text-muted-foreground">
                Otimizado para dispositivos móveis
              </p>
            </div>

            {showRedirectMessage && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="w-4 h-4 animate-pulse" />
                  <span>Redirecionando para a aplicação...</span>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    🚀 Recursos Mobile
                  </h3>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Wallets nativos (Phantom Mobile, Solflare)</li>
                    <li>• Interface otimizada para touch</li>
                    <li>• Transações privadas em segundos</li>
                    <li>• Margens automáticas para melhor UX</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se não for mobile, mostrar conteúdo normal
  return <>{children}</>;
}

// Hook para verificar se deve redirecionar
export function useMobileRedirect(redirectTo: string = "/transaction") {
  const { isMobile } = usePlatform();
  const router = useRouter();

  const redirectIfMobile = () => {
    if (isMobile) {
      router.replace(redirectTo);
    }
  };

  return { redirectIfMobile, isMobile };
}

// Componente para mostrar informações sobre o redirecionamento mobile
export function MobileRedirectInfo() {
  const { isMobile } = usePlatform();

  if (!isMobile) {
    return (
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Versão Mobile Disponível
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Acesse via dispositivo móvel para uma experiência otimizada com
          wallets nativos.
        </p>
      </div>
    );
  }

  return null;
}
