"use client";

import React from "react";
import { usePlatform } from "@/hooks/use-platform";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
  addTopMargin?: boolean;
  addSideMargin?: boolean;
}

export function MobileLayout({ 
  children, 
  className = "",
  addTopMargin = true,
  addSideMargin = true
}: MobileLayoutProps) {
  const { isMobile } = usePlatform();
  
  return (
    <div className={cn(
      // Margem superior apenas no mobile
      addTopMargin && isMobile && "mt-8",
      // Margem lateral apenas no mobile
      addSideMargin && isMobile && "mx-4",
      className
    )}>
      {children}
    </div>
  );
}

// Componente específico para páginas
export function PageLayout({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <MobileLayout 
      className={cn("min-h-screen", className)}
      addTopMargin={true}
      addSideMargin={true}
    >
      {children}
    </MobileLayout>
  );
}

// Componente para containers
export function ContainerLayout({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <MobileLayout 
      className={cn("container mx-auto px-4", className)}
      addTopMargin={true}
      addSideMargin={false}
    >
      {children}
    </MobileLayout>
  );
}
