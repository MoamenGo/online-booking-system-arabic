'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DASHBOARD_NAV } from '@/lib/constants';
import { getInitial } from '@/lib/utils';
import type { User } from '@/types';

// ===== تصميم لوحة التحكم =====
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    // else router.push('/login');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const Sidebar = () => (
    <aside className="flex flex-col bg-surface-container border-l border-outline-variant shadow-md h-full w-64 py-unit-lg px-unit-md gap-unit-sm">
      {/* الرأس */}
      <div className="flex flex-col items-center mb-unit-lg text-center">
        <div className="w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center text-headline-md font-bold mb-unit-sm">
          {user ? getInitial(user.name) : 'م'}
        </div>
        <h2 className="text-headline-md font-bold text-on-surface">
          {user?.ownedBusiness?.name ?? 'لوحة التحكم'}
        </h2>
        <p className="text-label-md text-on-surface-variant">{user?.name ?? 'إدارة المواعيد'}</p>
      </div>

      {/* زر حجز جديد */}
      <a href="/">
        <button className="w-full bg-primary hover:bg-on-primary-fixed-variant text-on-primary text-label-md font-semibold py-3 rounded-lg shadow-sm transition-colors mb-unit-md flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[20px]">add</span>
          حجز جديد
        </button>
      </a>

      {/* روابط التنقل */}
      <nav className="flex-1 flex flex-col gap-1">
        {DASHBOARD_NAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            {item.title}
          </a>
        ))}
      </nav>

      {/* تسجيل الخروج */}
      <div className="mt-auto pt-unit-md border-t border-outline-variant">
        <button
          onClick={handleLogout}
          className="nav-link w-full text-right"
        >
          <span className="material-symbols-outlined text-[22px]">logout</span>
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-row">
      {/* Sidebar للسطح المكتبي */}
      <div className="hidden md:flex flex-col fixed right-0 top-0 h-screen w-64 z-40">
        <Sidebar />
      </div>

      {/* Drawer للجوال */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="relative mr-auto w-64 h-full shadow-modal animate-slide-in">
            <Sidebar />
          </div>
        </div>
      )}

      {/* المحتوى الرئيسي */}
      <div className="flex-1 md:mr-64 flex flex-col min-h-screen">
        {/* الشريط العلوي */}
        <header className="bg-surface-container-lowest border-b border-outline-variant shadow-sm flex flex-row-reverse justify-between items-center w-full px-margin-desktop h-16 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-title-lg font-bold text-primary">نظام الحجز الذكي</span>
          </div>

          <div className="flex items-center gap-3">
            {/* قائمة الجوال */}
            <button
              className="md:hidden text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            <button className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-colors">
              <span className="material-symbols-outlined">help</span>
            </button>

            <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold cursor-pointer text-body-md">
              {user ? getInitial(user.name) : 'م'}
            </div>
          </div>
        </header>

        {/* محتوى الصفحة */}
        <main className="flex-1 p-margin-mobile md:p-margin-desktop overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
