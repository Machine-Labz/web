"use client";

import React from "react";
import { usePlatform } from "@/hooks/use-platform";
import { cn } from "@/lib/utils";

interface MobileTopMarginProps {
  children: React.ReactNode;
  className?: string;
  mobileMargin?: string;
}

export function MobileTopMargin({ 
  children, 
  className = "",
  mobileMargin = "mt-8" 
}: MobileTopMarginProps) {
  const { isMobile } = usePlatform();
  
  return (
    <div className={cn(
      isMobile ? mobileMargin : "",
      className
    )}>
      {children}
    </div>
  );
}

// Hook para obter classes de margem mobile
export function useMobileMargin() {
  const { isMobile } = usePlatform();
  
  return {
    topMargin: isMobile ? "mt-8" : "",
    bottomMargin: isMobile ? "mb-8" : "",
    sideMargin: isMobile ? "mx-4" : "",
    fullMargin: isMobile ? "mt-8 mb-8 mx-4" : "",
  };
}
