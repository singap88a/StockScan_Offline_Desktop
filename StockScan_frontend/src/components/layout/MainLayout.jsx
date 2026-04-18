import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Barcode, 
  ReceiptText, 
  RotateCcw, 
  BarChart3, 
  Users, 
  LogOut,
  Wallet,
} from 'lucide-react';
import { cn } from '../ui/Base';
import { useAuth } from '../../App';

const menuItems = [
  { icon: LayoutDashboard, label: 'لوحة القيادة', path: '/dashboard', roles: ['admin'] },
  { icon: Package, label: 'المنتجات', path: '/products', roles: ['admin'] },
  { icon: Barcode, label: 'مسح باركود', path: '/scan', roles: ['admin', 'cashier'] },
  { icon: ReceiptText, label: 'الفواتير', path: '/billing', roles: ['admin', 'cashier'] },
  { icon: RotateCcw, label: 'المرتجعات', path: '/returns', roles: ['admin'] },
  { icon: Wallet, label: 'مصروفات المخزون', path: '/expenses', roles: ['admin'] },
  { icon: BarChart3, label: 'التقارير', path: '/reports', roles: ['admin'] },
  { icon: Users, label: 'المستخدمين', path: '/users', roles: ['admin'] },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  
  const filteredItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <aside className="fixed top-0 right-0 w-64 h-full bg-white border-l border-gray-100 flex flex-col z-40 transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-gray-50">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center me-3">
          <Package className="text-white w-5 h-5" />
        </div>
        <span className="font-bold text-xl text-gray-800 tracking-tight">مخزونك</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              'flex items-center px-4 py-3 rounded-xl transition-all group',
              isActive 
                ? 'bg-primary-50 text-primary-600 shadow-sm shadow-primary-100/50' 
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
            )}
          >
            <item.icon className={cn(
              'w-5 h-5 me-3 transition-transform group-hover:scale-110',
            )} />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-50">
        <button 
          onClick={logout}
          className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors group"
        >
          <LogOut className="w-5 h-5 me-3 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">تسجيل الخروج</span>
        </button>
      </div>
    </aside>
  );
}

export function Navbar() {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 right-64 left-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 z-30">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-gray-800">بيانات المتجر</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pe-4 border-e border-gray-100">
          <div className="text-end">
            <p className="text-sm font-black text-gray-900 leading-none mb-1">{user?.name || 'مستخدم'}</p>
            <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block ${user?.role === 'admin' ? 'bg-primary-50 text-primary-600' : 'bg-green-50 text-green-600'}`}>
              {user?.role === 'admin' ? 'مدير المخزن والتنسيق' : 'كاشير مبيعات الميدان'}
            </div>
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg ${user?.role === 'admin' ? 'bg-gradient-to-br from-primary-500 to-primary-700' : 'bg-gradient-to-br from-green-500 to-green-700'}`}>
            {user?.name?.substring(0, 1) || 'م'}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button className="p-2.5 text-gray-400 hover:bg-gray-50 rounded-xl transition-all relative">
             <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-white"></div>
             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
             </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

export function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <Navbar />
      <main className="ms-64 pt-16 min-h-screen transition-all duration-300">
        <div className="p-8 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
