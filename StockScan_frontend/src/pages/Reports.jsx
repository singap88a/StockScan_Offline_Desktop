import React, { useState, useEffect } from 'react';
import { Card, Button, Table } from '../components/ui/Base';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Calendar, Download, TrendingUp, DollarSign, ShoppingCart, ArrowUpRight, Loader2, Search, Package, RotateCcw, FileText, Users, Wallet } from 'lucide-react';
import { dashboardAPI } from '../lib/api';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Reports() {
  const [timeRange, setTimeRange] = useState('monthly');
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [monthlyRes, categoryRes, statsRes, dailyRes] = await Promise.all([
          dashboardAPI.getMonthlySales(),
          dashboardAPI.getCategorySales(),
          dashboardAPI.getStats(),
          dashboardAPI.getDailyStats(),
        ]);
        setSalesData(monthlyRes.data.data);
        setCategoryData(categoryRes.data.data);
        setStats(statsRes.data.data);
        setDailyStats(dailyRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fmt = (n) => (n ?? 0).toLocaleString('ar-EG');

  const totalSales = salesData.reduce((s, d) => s + d.total, 0);
  const topCat = categoryData.sort((a, b) => b.value - a.value)[0];

  return (
    <div className="space-y-10 px-6 lg:px-12 py-8 animate-in fade-in slide-in-from-bottom-5 duration-1000">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">التقارير المالية</h1>
          <p className="text-gray-500 font-bold mt-2 text-lg">تحليل شامل لحركة المبيعات، المخزون، والمصروفات</p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" className="flex items-center gap-3 px-8 h-14 bg-white border border-gray-100 rounded-2xl font-black text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
            <Download className="w-5 h-5" />
            تصدير التقرير (Excel)
          </Button>
        </div>
      </div>

      {/* Balanced Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: 'مبيعات المتجر', 
            value: fmt(stats?.totalStoreSales ?? 0), 
            icon: TrendingUp, 
            color: 'bg-indigo-50/50 text-indigo-700 border-indigo-100/50',
            unit: 'ج.م'
          },
          { 
            title: 'مبـيعات اليـوم', 
            value: fmt(stats?.todaySales ?? 0), 
            icon: ShoppingCart, 
            color: 'bg-blue-50/50 text-blue-700 border-blue-100/50',
            unit: 'ج.م'
          },
          { 
            title: 'مرتجعات اليوم', 
            value: fmt(stats?.todayRefunds ?? 0), 
            icon: RotateCcw, 
            color: 'bg-rose-50/50 text-rose-700 border-rose-100/50',
            unit: 'ج.م'
          },
          { 
            title: 'إجمالي المنتجات', 
            value: stats?.totalProducts ?? 0, 
            icon: Package, 
            color: 'bg-sky-50/50 text-sky-700 border-sky-100/50',
            unit: 'صنف'
          },
          { 
            title: 'إجمالي الفواتير', 
            value: stats?.totalInvoicesCount ?? 0, 
            icon: FileText, 
            color: 'bg-emerald-50/50 text-emerald-700 border-emerald-100/50',
            unit: 'فاتورة'
          },
          { 
            title: 'إجمالي المصروفات', 
            value: fmt(stats?.totalExpensesAmt ?? 0), 
            icon: Wallet, 
            color: 'bg-amber-50/50 text-amber-700 border-amber-100/50',
            unit: 'ج.م'
          },
          { 
            title: 'المستخدمين', 
            value: stats?.totalUsers ?? 0, 
            icon: Users, 
            color: 'bg-violet-50/50 text-violet-700 border-violet-100/50',
            unit: 'مستخدم'
          },
        ].map((item, i) => (
          <Card key={i} className={`${item.color} border-2 p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-auto min-h-[160px] group`}>
            <div className="flex items-center justify-between">
              <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-50 text-inherit group-hover:rotate-12 transition-transform">
                <item.icon className="w-5 h-5" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest opacity-60">{item.title}</p>
            </div>
            <div>
              {loading ? (
                <div className="h-8 w-24 bg-current/10 rounded animate-pulse" />
              ) : (
                <div className="flex flex-col gap-1">
                  <h3 className="text-3xl font-black tabular-nums tracking-tighter">
                    {item.value}
                  </h3>
                  <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{item.unit}</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card title="نمو المبيعات (نصف سنوي - صافي)" className="lg:col-span-2">
          <div className="w-full mt-6" style={{ height: '350px' }}>
            {loading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary-600 animate-spin" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 700 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#f3f4f6', radius: 10 }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }} formatter={(v) => [`${v} ج.م`, 'الصافي']} />
                  <Bar dataKey="total" fill="#3b82f6" radius={[10, 10, 0, 0]} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Pie Chart */}
        <Card title="توزيع الفئات">
          <div className="w-full mt-2" style={{ height: '300px' }}>
            {loading ? (
              <div className="h-full flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary-600 animate-spin" /></div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {!loading && (
            <div className="mt-8 space-y-4 pt-4 border-t border-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-500">أكثر فئة مبيعاً</span>
                <span className="text-sm font-black text-primary-600">{topCat?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-500">إجمالي المنتجات</span>
                <span className="text-sm font-black text-gray-800">{stats?.totalProducts ?? 0} منتج</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Daily History Table */}
      <Card className="rounded-[2rem] border-none shadow-2xl shadow-gray-200/40 p-0 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gray-50/30">
          <div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight">سجل المعاملات اليومي</h3>
            <p className="text-gray-500 text-sm font-medium mt-1">تتبع أداء المحل يوماً بيوم بالتفصيل</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
            <input 
              type="text" 
              placeholder="ابحث بالتاريخ (مثال: 2026-04-15)" 
              className="w-full pr-12 pl-6 py-3 bg-white border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary-500/5 outline-none font-bold text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="min-h-[300px]">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 text-primary-600 animate-spin" /></div>
          ) : (
            <Table headers={['التاريخ', 'عدد الفواتير', 'صافي المبيعات', 'صافي الربح']}>
              {dailyStats
                .filter(day => day.date.includes(searchTerm))
                .map((day, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5 font-black text-gray-900">{day.date}</td>
                  <td className="px-8 py-5 text-gray-600 font-bold">{day.count} عملية</td>
                  <td className="px-8 py-5 font-black text-primary-600">{fmt(day.sales)} ج.م</td>
                  <td className="px-8 py-5 font-black text-green-600">{fmt(day.profit)} ج.م</td>
                </tr>
              ))}
              {dailyStats.filter(day => day.date.includes(searchTerm)).length === 0 && (
                <tr>
                   <td colSpan="4" className="py-20 text-center text-gray-400 font-bold">لا توجد بيانات تطابق بحثك</td>
                </tr>
              )}
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
