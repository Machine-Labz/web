// Exemplo de como usar margem mobile em qualquer página

import { MobileLayout, PageLayout } from "@/components/mobile-layout";
import { MobileTopMargin } from "@/components/mobile-top-margin";
import { useMobileMargin } from "@/components/mobile-top-margin";

// Opção 1: Usando PageLayout (recomendado para páginas completas)
export function MyPage() {
  return (
    <PageLayout>
      <h1>Minha Página</h1>
      <p>Esta página tem margem automática no mobile</p>
    </PageLayout>
  );
}

// Opção 2: Usando MobileLayout com controle granular
export function MyComponent() {
  return (
    <MobileLayout addTopMargin={true} addSideMargin={false}>
      <h1>Meu Componente</h1>
      <p>Apenas margem superior no mobile</p>
    </MobileLayout>
  );
}

// Opção 3: Usando MobileTopMargin para elementos específicos
export function MyCard() {
  return (
    <MobileTopMargin mobileMargin="mt-12">
      <div className="p-4 bg-white rounded-lg shadow">
        <h2>Card com Margem Customizada</h2>
        <p>Margem de 12 unidades no mobile</p>
      </div>
    </MobileTopMargin>
  );
}

// Opção 4: Usando o hook para classes condicionais
export function MyFlexibleComponent() {
  const { topMargin } = useMobileMargin();
  
  return (
    <div className={`p-4 ${topMargin}`}>
      <h2>Componente Flexível</h2>
      <p>Margem aplicada via hook</p>
    </div>
  );
}

// Opção 5: Usando configuração mobile
import { getMobileConfig } from "@/lib/mobile-config";

export function MyConfiguredComponent() {
  const topMargin = getMobileConfig("web", "ui.margins.top");
  
  return (
    <div className={topMargin}>
      <h2>Componente Configurado</h2>
      <p>Margem baseada na configuração</p>
    </div>
  );
}
