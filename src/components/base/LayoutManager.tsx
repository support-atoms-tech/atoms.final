'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutProvider, useLayout } from '@/lib/providers/layout.provider';
import AppSidebar from '@/components/base/AppSidebar';
import VerticalToolbar from '@/components/custom/VerticalToolbar';
import HorizontalToolbar from '@/components/custom/HorizontalToolbar';
import Breadcrumb from '@/components/custom/Breadcrumb';
import { cn } from '@/lib/utils';
import { EditModeFloatingToggle } from '@/components/custom/BlockCanvas/components/EditModeToggle';
import { SidebarProvider } from '../ui/sidebar';

interface LayoutManagerProps {
  children: React.ReactNode;
}

/**
 * LayoutManager orchestrates the application layout with responsiveness and animations
 * while preserving the original UI appearance
 */
const LayoutManagerInternal = ({ children }: LayoutManagerProps) => {
  const {
    sidebarState,
    isMobile,
    isTablet,
    isDocumentPage,
    setCurrentPath
  } = useLayout();
  
  const pathname = usePathname();
  const isSidebarExpanded = sidebarState === 'expanded';
  
  // Update current path in layout context
  useEffect(() => {
    if (pathname) {
      setCurrentPath(pathname);
    }
  }, [pathname, setCurrentPath]);
  
  // Show vertical toolbar only when sidebar is collapsed and on desktop
  const showVerticalToolbar = !isMobile && !isTablet;
  
  // Show horizontal toolbar on mobile and tablet
  const showHorizontalToolbar = isMobile || isTablet;
  
  return (
    <SidebarProvider>
      {/* Sidebar */}
      <AppSidebar />
      
      {/* Main content area with animation */}
        {/* Content wrapper */}
        <div className={cn(
          "flex-1 p-4 md:p-6 lg:p-8 xl:p-16",
          isMobile && "pt-16" // Extra padding for mobile toolbar
        )}>
          {children}
        </div>
        
        {/* Floating edit button for document pages */}
        {isDocumentPage && !isMobile && (
          <EditModeFloatingToggle />
        )}
      
      {/* Vertical toolbar - only on desktop when sidebar is collapsed */}
      {showVerticalToolbar && (
        
        <VerticalToolbar />
      )}
      
      {/* Horizontal toolbar - only on mobile/tablet */}
      {showHorizontalToolbar && <HorizontalToolbar />}
    </SidebarProvider>
  );
};

const LayoutManager = ({ children }: LayoutManagerProps) => {
  return (
    <LayoutProvider>
      <LayoutManagerInternal>
        {children}
      </LayoutManagerInternal>

    </LayoutProvider>
  );
};

export default LayoutManager;