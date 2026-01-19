import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { BackgroundBlobs } from '../../ui/BackgroundBlobs';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export function AdminLayout({ children, activeTab, onTabChange, onLogout }: AdminLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans">
      <BackgroundBlobs className="opacity-30 fixed" />
      
      {/* Sidebar - Desktop */}
      <AdminSidebar 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
        onLogout={onLogout}
      />

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50">
             <div className="h-full overflow-y-auto">
               <AdminSidebar 
                 activeTab={activeTab} 
                 onTabChange={(t) => { onTabChange(t); setIsMobileMenuOpen(false); }} 
                 onLogout={onLogout}
                 className="flex w-full h-full border-r-0" // Override hidden lg:flex and borders
               />
             </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen flex flex-col relative z-10">
        <AdminHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
