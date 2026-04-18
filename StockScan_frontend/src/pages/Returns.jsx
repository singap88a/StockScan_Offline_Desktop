import React, { useState, useEffect } from 'react';
import { Card, Button, Table } from '../components/ui/Base';
import {
  RotateCcw, Search, AlertCircle, CheckCircle,
  Package, ShieldCheck, Loader2, Calendar, Hash, DollarSign, Trash2
} from 'lucide-react';
import { returnsAPI, invoicesAPI } from '../lib/api';
import { useAuth } from '../App';
import { useToast } from '../context/ToastContext';

export default function Returns() {
  const { user } = useAuth();
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [returnStatus, setReturnStatus] = useState('idle');
  const [foundInvoice, setFoundInvoice] = useState(null);
  const [reason, setReason] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [todayStats, setTodayStats] = useState({ count: 0, totalRefund: 0 });
  const [allReturns, setAllReturns] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoadingHistory(true);
      const [statsRes, historyRes] = await Promise.all([
        returnsAPI.getTodayStats(),
        returnsAPI.getAll()
      ]);
      setTodayStats(statsRes.data.data);
      setAllReturns(historyRes.data.data);
    } catch (err) {
      console.error('Error fetching return data:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) return;
    setSearching(true);
    setError('');
    try {
      const res = await invoicesAPI.getAll({ search: invoiceNumber.trim(), limit: 1 });
      const found = res.data.data.find(
        inv => inv.invoiceNumber?.toLowerCase() === invoiceNumber.trim().toLowerCase()
      );
      if (found) {
        setFoundInvoice(found);
        setReturnStatus('found');
      } else {
        setError('لم يتم العثور على فاتورة برقم: ' + invoiceNumber);
      }
    } catch (err) {
      setError('حدث خطأ أثناء البحث');
    } finally {
      setSearching(false);
    }
  };

  const handleDeleteReturn = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه العملية؟ سيتم خصم الكمية من المخزن وتعديل الحسابات.')) return;
    try {
      await returnsAPI.delete(id);
      showToast('success', 'تم حذف عملية المرتجع وتحديث المخزون بنجاح');
      fetchData();
    } catch (err) {
      showToast('error', 'فشل في حذف العملية');
    }
  };

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('يرجى إدخال سبب الاسترجاع');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await returnsAPI.create({
        invoiceNumber: foundInvoice.invoiceNumber,
        quantity: foundInvoice.items?.[0]?.quantity || 1,
        reason,
      });
      setReturnStatus('confirmed');
      showToast('success', 'تم تسجيل عملية المرتجع بنجاح');
      fetchData(); // Refresh stats and history
    } catch (err) {
      setError(err.response?.data?.message || 'فشل تسجيل المرتجع');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setReturnStatus('idle');
    setFoundInvoice(null);
    setInvoiceNumber('');
    setReason('');
    setError('');
  };

  const targetProduct = foundInvoice?.items?.[0];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center text-orange-600 mb-6 shadow-xl shadow-orange-100/50">
          <RotateCcw className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">نظام المرتجعات الذكي</h1>
        <p className="text-gray-500 mt-2 font-medium">إدارة عمليات الاسترجاع وتحديث المخزون والميزانية تلقائياً</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {/* Search Card */}
          <Card className="p-8 rounded-[2.5rem] border-none shadow-2xl shadow-gray-200/50 bg-white overflow-visible">
            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
              <Search className="w-5 h-5 text-primary-600" />
              البحث عن عملية البيع الأصلية
            </h3>
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                <input
                  type="text"
                  placeholder="أدخل رقم الفاتورة (مثال: INV-66982048)"
                  className="w-full pr-14 pl-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-8 focus:ring-primary-500/5 focus:border-primary-400 outline-none transition-all font-bold text-sm"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
              <Button type="submit" className="px-10 h-14 rounded-2xl shadow-xl shadow-primary-200/50 font-black" disabled={searching}>
                {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'بدء البحث'}
              </Button>
            </form>
            {error && <p className="mt-4 text-sm text-red-500 font-bold bg-red-50 py-3 px-5 rounded-2xl border border-red-100">{error}</p>}
          </Card>

          {/* Result Area */}
          <div className="min-h-[200px]">
            {returnStatus === 'found' && foundInvoice && (
              <Card className="animate-in slide-in-from-top-4 duration-500 overflow-hidden p-0 rounded-[2.5rem] border-gray-100/50 shadow-2xl">
                <div className="p-10 space-y-10">
                  <div className="flex items-start justify-between pb-8 border-b border-gray-50">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 shadow-inner">
                        <Package className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">{targetProduct?.name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">المعرف: {foundInvoice.invoiceNumber}</span>
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          <span className="text-xs font-black text-primary-600 uppercase">قيد المعالجة</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">تاريخ العملية</p>
                      <p className="font-black text-gray-800 text-lg">{new Date(foundInvoice.createdAt).toLocaleDateString('ar-EG')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="p-6 bg-gray-50/50 rounded-2xl space-y-4 border border-gray-100/50">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-bold text-sm">السعر عند البيع:</span>
                          <span className="text-gray-900 font-black text-xl">{(targetProduct?.unitPrice || targetProduct?.price || 0).toFixed(2)} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-bold text-sm">الكمية المباعة:</span>
                          <span className="text-gray-900 font-black text-xl">{targetProduct?.quantity} قطعة</span>
                        </div>
                        <div className="pt-4 border-t border-gray-200/50 flex justify-between items-center">
                          <span className="text-primary-600 font-black">إجمالي المبلغ المراد رده:</span>
                          <span className="text-primary-600 font-black text-2xl tracking-tighter">{(foundInvoice.total || 0).toFixed(2)} ج.م</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ms-1">سبب الاسترجاع (إلزامي) *</label>
                        <textarea
                          className="w-full p-5 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary-500/5 focus:border-primary-400 min-h-[120px] text-sm font-bold transition-all"
                          placeholder="مثال: عيب صناعة، العميل تراجع عن الشراء..."
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button onClick={handleConfirm} disabled={submitting} className="flex-1 h-16 rounded-[1.5rem] shadow-2xl shadow-primary-200 font-black text-lg">
                      {submitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'تأكيد عملية الاسترجاع ورد المبلغ'}
                    </Button>
                    <Button variant="secondary" onClick={reset} className="px-10 h-16 rounded-[1.5rem] font-bold">إلغاء</Button>
                  </div>
                </div>
              </Card>
            )}

            {returnStatus === 'confirmed' && (
              <div className="p-16 text-center bg-white rounded-[3rem] border border-green-100 shadow-2xl shadow-green-100/20 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <CheckCircle className="w-14 h-14" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">تم الاسترجاع وتحديث الميزانية!</h2>
                <p className="text-gray-400 font-bold mb-10 max-w-[350px] mx-auto text-sm leading-relaxed">
                  تم حذف الفاتورة من السجلات النشطة، إعادة الكمية للمخزن، وخصم المبلغ من إجمالي مبيعات اليوم (Net Sales).
                </p>
                <Button onClick={reset} variant="secondary" className="px-14 h-14 rounded-2xl font-black border-gray-100">استرجاع فاتورة أخرى</Button>
              </div>
            )}
            
            {returnStatus === 'idle' && !searching && (
              <div className="animate-in fade-in slide-in-from-bottom-5">
                <div className="flex items-center justify-between px-2 mb-6">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                       <Calendar className="w-6 h-6 text-primary-600" />
                       سجل المرتجعات الأخير
                    </h2>
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-4 py-1.5 rounded-full">{allReturns.length} عملية</span>
                </div>
                 
                 <Card className="overflow-hidden p-0 rounded-[2.5rem] border-gray-100 shadow-xl bg-white">
                    {loadingHistory ? (
                       <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 text-primary-600 animate-spin" /></div>
                    ) : allReturns.length > 0 ? (
                       <Table headers={['المنتج', 'الفاتورة', 'المبلغ', 'التاريخ', 'السبب', 'إجراءات']}>
                          {allReturns.slice(0, 10).map((ret) => (
                             <tr key={ret._id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-8 py-5">
                                   <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center"><Package className="w-4 h-4 text-orange-600" /></div>
                                      <span className="font-black text-gray-800 text-sm">{ret.productName}</span>
                                   </div>
                                </td>
                                <td className="px-8 py-5 font-mono text-[10px] text-gray-400 font-bold">{ret.invoiceNumber}</td>
                                <td className="px-8 py-5 font-black text-red-500 text-sm">{ret.refundAmount?.toFixed(2)} ج.م</td>
                                <td className="px-8 py-5 text-sm font-bold text-gray-500">{new Date(ret.createdAt).toLocaleDateString('ar-EG')}</td>
                                <td className="px-8 py-5"><span className="text-[10px] font-black bg-gray-100 text-gray-500 px-3 py-1 rounded-lg">{ret.reason}</span></td>
                                <td className="px-8 py-5">
                                    {user.role === 'admin' && (
                                        <button 
                                            onClick={() => handleDeleteReturn(ret._id)}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                             </tr>
                          ))}
                       </Table>
                    ) : (
                       <div className="py-20 text-center text-gray-400 font-bold">لا توجد عمليات استرجاع مسجلة بعد</div>
                    )}
                 </Card>
              </div>
            )}
          </div>

          {/* Simplified section below search */}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <div className="p-8 bg-primary-600 rounded-[2.5rem] text-white space-y-6 shadow-2xl shadow-primary-200/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <p className="text-primary-100 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">إحصائيات المرتجعات اليوم</p>
            <div className="space-y-2">
                 <div className="flex items-baseline gap-2">
                    <h3 className="text-5xl font-black tracking-tighter">{todayStats.count}</h3>
                    <span className="text-sm font-bold opacity-60">عمليات</span>
                 </div>
                 <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: '40%' }}></div>
                 </div>
            </div>
            <div className="pt-4 border-t border-white/10">
               <p className="text-primary-100 text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">إجمالي المبالغ المردودة</p>
               <h4 className="text-2xl font-black tabular-nums">{todayStats.totalRefund?.toFixed(2)} <span className="text-xs">ج.م</span></h4>
            </div>
          </div>

          <Card className="p-8 rounded-[2rem] border-gray-100 bg-gray-50/30">
            <h4 className="font-black text-gray-900 border-b border-gray-200 pb-4 mb-4 flex items-center gap-2 text-xs uppercase tracking-widest">
              <ShieldCheck className="w-4 h-4 text-green-600" />
              سياسة الاسترجاع
            </h4>
            <ul className="space-y-4 text-[11px] text-gray-500 font-black leading-relaxed">
              <li className="flex gap-3"><CheckCircle className="w-4 h-4 text-gray-300 shrink-0" /> الاسترجاع متاح خلال 14 يوماً من تاريخ الفاتورة.</li>
              <li className="flex gap-3"><CheckCircle className="w-4 h-4 text-gray-300 shrink-0" /> يجب أن يكون المنتج بحالته الأصلية تماماً.</li>
              <li className="flex gap-3"><CheckCircle className="w-4 h-4 text-gray-300 shrink-0" /> يتم تحديث المخزون وضبط الميزانية فورياً.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
