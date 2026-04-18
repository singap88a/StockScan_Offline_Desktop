import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Base';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import {
  Package, TrendingUp, Calendar, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Loader2, RotateCcw, Info, DollarSign, ShoppingCart
} from 'lucide-react';
import { dashboardAPI, productsAPI } from '../lib/api';


const StatCard = ({ title, value, icon: Icon, trend, color, loading }) => (
  <Card className="hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className={`p-3 rounded-2xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span>{Math.abs(trend)}%</span>
        </div>
      )}
    </div>
    <div className="mt-4">
      <p className="text-gray-500 text-sm">{title}</p>
      {loading ? (
        <div className="h-8 w-24 bg-gray-100 rounded-lg animate-pulse mt-1" />
      ) : (
        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
      )}
    </div>
  </Card>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
      const [statsRes, weeklyRes, topRes, lowStockRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getWeeklySales(),
          dashboardAPI.getTopProducts(),
          productsAPI.getLowStock(),
        ]);
        setStats(statsRes.data.data);
        setChartData(weeklyRes.data.data);
        setTopProducts(topRes.data.data);
        setLowStockProducts(lowStockRes.data.data.slice(0, 5));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const fmt = (n) => n?.toLocaleString('ar-EG') ?? '0';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">نظرة عامة</h1>
        <p className="text-gray-500">متابعة أداء المتجر والمبيعات اليومية</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard title="إجمالي المنتجات" value={fmt(stats?.totalProducts)} icon={Package} color="bg-primary-600" loading={loading} />
        <StatCard title="مبيعات المتجر" value={`${fmt(Math.round(stats?.totalStoreSales ?? 0))} ج.م`} icon={TrendingUp} color="bg-purple-600" loading={loading} />
        <StatCard 
          title="مبيعات اليوم" 
          value={`${fmt(Math.round(stats?.todaySales ?? 0))} ج.م`} 
          icon={ShoppingCart} 
          color="bg-green-600" 
          loading={loading} 
        />
        <StatCard title="مرتجعات اليوم" value={`${fmt(Math.round(stats?.todayRefunds ?? 0))} ج.م`} icon={RotateCcw} color="bg-orange-600" loading={loading} />
        <StatCard 
          title="مصروفات اليوم" 
          value={`${fmt(Math.round(stats?.todayExpensesAmt ?? 0))} ج.م`} 
          icon={DollarSign} 
          color="bg-rose-500" 
          loading={loading} 
        />
        <StatCard 
          title="مصروفات المخزون (الكل)" 
          value={`${fmt(Math.round(stats?.totalExpensesAmt ?? 0))} ج.م`} 
          icon={DollarSign} 
          color="bg-rose-700" 
          loading={loading} 
        />
      </div>

      {/* Today's comprehensive stats stacked vertically */}
      {!loading && (
        <Card className="bg-white p-6 rounded-[2.5rem] border border-primary-100 shadow-xl shadow-primary-50 mt-2">
          <h3 className="font-black text-gray-900 mb-5 flex items-center gap-3">
             <div className="p-2 bg-primary-100 text-primary-600 rounded-xl"><ShoppingCart className="w-5 h-5"/></div>
             حسابات وصافي اليوم
          </h3>
          <div className="space-y-4">
             <div className="flex justify-between font-bold text-gray-600 pb-3 border-b border-gray-100">
               <span>إجمالي مبيعات اليوم (قبل خصم المرتجعات والمصروفات)</span>
               <span className="text-gray-900">{fmt(Math.round(stats?.todaySales ?? 0))} ج.م</span>
             </div>
             <div className="flex justify-between font-bold text-red-500 pb-3 border-b border-gray-100">
               <span>مرتجعات اليوم (-)</span>
               <span>{fmt(Math.round(stats?.todayRefunds ?? 0))} ج.م</span>
             </div>
             <div className="flex justify-between font-bold text-rose-500 pb-3 border-b border-gray-100">
               <span>مصروفات اليوم (-)</span>
               <span>{fmt(Math.round(stats?.todayExpensesAmt ?? 0))} ج.م</span>
             </div>
             <div className="flex justify-between font-black text-xl text-primary-600 bg-primary-50 p-4 rounded-xl">
               <span>صافي مبيعات اليوم (النهائي المتواجد الآن بالخزينة)</span>
               <span>{fmt(Math.round(stats?.todayNetSales ?? 0))} ج.م</span>
             </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <Card title="إحصائيات المبيعات الأسبوعية (صافي)" className="lg:col-span-2">
          <div className="w-full mt-4" style={{ height: '300px' }}>
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} formatter={(v) => [`${v} ج.م`, 'صافي المبيعات']} />
                  <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Top Products */}
        <Card title="المنتجات الأكثر مبيعاً">
          <div className="space-y-4 mt-4">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))
            ) : topProducts.length > 0 ? topProducts.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Package className="text-gray-400 w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{p.name}</h4>
                    <p className="text-xs text-gray-500">بيعت {p.totalSold} مرة</p>
                  </div>
                </div>
                <p className="font-bold text-primary-600 text-sm">{fmt(Math.round(p.revenue))} ج.م</p>
              </div>
            )) : (
              <p className="text-center text-gray-400 text-sm py-8">لا توجد مبيعات بعد</p>
            )}
          </div>
        </Card>
      </div>

      {/* Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="حالة المخزون — منتجات على وشك النفاد">
          <div className="space-y-5 pt-2">
            {loading ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded-xl animate-pulse" />)
            ) : lowStockProducts.length > 0 ? lowStockProducts.map(product => (
              <div key={product._id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-gray-700">{product.name}</span>
                  <span className="text-red-500 font-bold">{product.quantity} قطع</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min((product.quantity / 20) * 100, 100)}%` }}></div>
                </div>
              </div>
            )) : (
              <p className="text-center text-green-600 font-bold text-sm py-4">✅ المخزون في حالة جيدة</p>
            )}
          </div>
        </Card>

        {/* Today Stats */}
        <Card title="إحصائيات اليوم">
          <div className="space-y-4 mt-4">
            {[
              { label: 'فواتير اليوم', value: stats?.todayInvoicesCount ?? 0, color: 'text-primary-600' },
              { label: 'عمليات استرجاع اليوم', value: stats?.todayReturnsCount ?? 0, color: 'text-orange-600' },
              { label: 'المستخدمون النشطون', value: stats?.totalUsers ?? 0, color: 'text-blue-600' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                <span className="font-bold text-gray-600 text-sm">{item.label}</span>
                {loading ? (
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
                ) : (
                  <span className={`text-2xl font-black ${item.color}`}>{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
