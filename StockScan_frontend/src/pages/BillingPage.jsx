import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Input } from '../components/ui/Base';
import {
  Printer, CheckCircle, ArrowRight, Calendar, User, Search,
  Eye, CreditCard, Banknote, ArrowLeft, ShoppingCart, Wallet,
  UserCircle, Package, Phone, Tag, Info, Loader2, Trash2, Edit2, X
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { invoicesAPI, usersAPI } from '../lib/api';
import { useAuth } from '../App';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Invoice Paper ─────────────────────────────────────────────────────────────
// ─── Invoice Paper (Thermal Receipt Style) ───────────────────────────────────
const InvoicePaper = ({ invoice, isConfirmed }) => {
  const barcodeRef = React.useRef(null);

  React.useEffect(() => {
    if (invoice && barcodeRef.current) {
      window.JsBarcode(barcodeRef.current, invoice.invoiceNumber || invoice.id, {
        format: "CODE128",
        width: 1.2,
        height: 35,
        displayValue: true,
        fontSize: 10,
        margin: 5
      });
    }
  }, [invoice]);

  if (!invoice) return null;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-area, #printable-area * { visibility: visible; }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: flex;
            justify-content: center;
          }
          @page { size: auto; margin: 5mm; }
        }
      `}</style>
      <div className="bg-white flex justify-center py-10 print:py-0" id="printable-area">
        <div className="w-[480px] print:w-[100mm] bg-white border border-gray-100 print:border-none p-8 print:p-2 space-y-6 font-sans text-right" dir="rtl">
          
          {/* Header */}
          <div className="text-center border-b border-dashed border-gray-200 pb-4">
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter">StockScan</h2>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Digital Retail POS System</p>
            <div className="mt-3 space-y-0.5">
              <p className="text-[11px] font-black text-gray-800">فاتورة بيع</p>
              <p className="text-[10px] text-gray-500">رقم الفاتورة: {invoice.invoiceNumber || invoice.id}</p>
              <p className="text-[10px] text-gray-500">التاريخ: {new Date(invoice.createdAt || invoice.date).toLocaleString('ar-EG')}</p>
            </div>
          </div>

          {/* Info */}
          <div className="text-[10px] space-y-1 py-1 border-b border-dashed border-gray-100">
            <div className="flex justify-between">
              <span className="text-gray-400">العميل:</span>
              <span className="font-bold text-gray-800">{invoice.customer || 'عميل نقدي'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">الكاشير:</span>
              <span className="font-bold text-gray-800">{invoice.cashierName || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">طريقة الدفع:</span>
              <span className="font-bold text-gray-800">{invoice.paymentMethod === 'cash' ? 'نقدًا' : 'بطاقة إلكترونية'}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-2">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 text-right">
                  <th className="py-1 font-bold">المنتج</th>
                  <th className="py-1 font-bold text-center">الكمية</th>
                  <th className="py-1 font-bold text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="text-gray-800">
                    <td className="py-2 font-bold leading-tight">{item.name}</td>
                    <td className="py-2 text-center tabular-nums">{item.quantity}</td>
                    <td className="py-2 text-left font-black tabular-nums">{(item.total || (item.price * item.quantity))?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations */}
          <div className="border-t border-dashed border-gray-200 pt-3 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-500">السعر الأصلي (قبل الخصم):</span>
              <span className="tabular-nums">{invoice.subtotal?.toFixed(2)} ج.م</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>إجمالي الخصم التوفيري:</span>
                <span className="tabular-nums">-{invoice.discount?.toFixed(2)} ج.م</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-gray-900 border-t border-gray-100 pt-2 mt-2">
              <span>المطلوب سداده:</span>
              <span className="tabular-nums">{invoice.total?.toFixed(2)} ج.م</span>
            </div>
          </div>

          {/* Footer Barcode */}
          <div className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <svg ref={barcodeRef}></svg>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-900">شكرًا لزيارتكم!</p>
              <p className="text-[8px] text-gray-400 uppercase tracking-widest">StockScan POS Excellence</p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function BillingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [view, setView] = useState('list');
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [todayStats, setTodayStats] = useState({ count: 0, total: 0, pendingCount: 0 });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCashier, setSelectedCashier] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState(null);

  // Checkout state
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('عميل نقدي');
  const [customerPhone, setCustomerPhone] = useState('');
  const [manualDiscount, setManualDiscount] = useState(0);
  const [allUsers, setAllUsers] = useState([]);
  const [cashierId, setCashierId] = useState(user?._id || '');
  const { showToast } = useToast();
  const printableInvoiceRef = React.useRef(null);

  // Load invoices
  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const params = { 
        search: searchTerm, 
        limit: 50,
        status: selectedStatus || undefined,
        cashierId: selectedCashier !== 'all' ? selectedCashier : undefined
      };
      const res = await invoicesAPI.getAll(params);
      setInvoices(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchTodayStats = async () => {
    try {
      const res = await invoicesAPI.getTodayStats();
      setTodayStats(res.data.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchInvoices();
    fetchTodayStats();
  }, [searchTerm, selectedCashier, selectedStatus]);

  useEffect(() => {
    usersAPI.getAll().then(res => setAllUsers(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (location.state?.isCheckout && location.state?.product) {
      setCheckoutProduct(location.state.product);
      setCheckoutQuantity(location.state.quantity || 1);
      setView('checkout');
    }
  }, [location.state]);

  const calculateTotals = (product, quantity, manualDiscountVal = 0) => {
    if (!product) return { subtotal: 0, discount: 0, tax: 0, total: 0 };
    const subtotal = product.sellPrice * quantity;
    const baseDiscount = (product.discount || 0) * quantity;
    
    // finalDiscount combines product's fixed discount and the optional manual negotiation discount.
    const finalDiscount = baseDiscount + Number(manualDiscountVal);
    const total = Math.max(0, subtotal - finalDiscount);
    
    return { subtotal, discount: finalDiscount, tax: 0, total };
  };

  const handleConfirmCheckout = async () => {
    setSubmitting(true);
    const selectedCashier = allUsers.find(u => u._id === cashierId);
    const totals = calculateTotals(checkoutProduct, checkoutQuantity, manualDiscount);
    try {
      const res = await invoicesAPI.create({
        customer: customerName || 'عميل نقدي',
        customerPhone,
        items: [{ productId: checkoutProduct._id, name: checkoutProduct.name, quantity: checkoutQuantity }],
        discount: totals.discount,
        paymentMethod,
        cashierId: cashierId || user?._id,
        cashierName: selectedCashier?.name || user?.name,
      });
      setSelectedInvoice(res.data.data);
      setIsConfirmed(true);
      setView('details');
      fetchTodayStats();
      showToast('success', 'تم إصدار الفاتورة بنجاح');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'فشل إنشاء الفاتورة');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    try {
      await invoicesAPI.delete(invoiceToDelete._id);
      setIsDeleteModalOpen(false);
      setInvoiceToDelete(null);
      fetchInvoices();
      fetchTodayStats();
      showToast('success', 'تم حذف الفاتورة وتحديث المخزون');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'فشل حذف الفاتورة');
    }
  };

  const handleUpdateInvoice = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      customer: formData.get('customer'),
      customerPhone: formData.get('customerPhone'),
      status: formData.get('status'),
    };
    try {
      await invoicesAPI.update(invoiceToEdit._id, data);
      setIsEditModalOpen(false);
      setInvoiceToEdit(null);
      fetchInvoices();
      showToast('success', 'تم تحديث بيانات الفاتورة');
    } catch (err) {
      showToast('error', err.response?.data?.message || 'فشل التعديل');
    }
  };

  const handlePrintInvoice = () => {
    if (!printableInvoiceRef.current) {
      showToast('error', 'لا يمكن العثور على الفاتورة للطباعة');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      showToast('error', 'المتصفح منع نافذة الطباعة. اسمح بالنوافذ المنبثقة.');
      return;
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <!doctype html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Invoice Print</title>
          ${styles}
          <style>
            body {
              margin: 0;
              background: #fff !important;
            }
            .print-container {
              width: 100%;
              margin: 0 auto;
            }
            @page {
              size: auto;
              margin: 5mm;
            }
          </style>
        </head>
        <body>
          <div class="print-container">${printableInvoiceRef.current.innerHTML}</div>
        </body>
      </html>
    `);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

  // ──── VIEWS ────────────────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">سجل الفواتير</h1>
            <p className="text-gray-500 font-medium mt-1">عرض وإدارة جميع الفواتير والمبيعات السابقة</p>
          </div>
          <Button onClick={() => navigate('/scan')} className="sm:w-fit gap-3 h-14 shadow-xl shadow-primary-200/50 rounded-2xl font-black text-base px-8">
            <ArrowRight className="w-5 h-5 rotate-180" />
            <span>عملية بيع جديدة</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="bg-primary-600 border-none text-white p-8 relative overflow-hidden rounded-[2.5rem] shadow-2xl shadow-primary-200/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl opacity-60"></div>
            <div className="relative z-10">
              <p className="text-primary-100 text-xs font-black uppercase tracking-[0.2em] mb-3 opacity-60">
                {user.role === 'admin' ? 'إجمالي مبيعات المتجر اليوم' : 'إجمالي مبيعاتك اليوم'}
              </p>
              <h3 className="text-4xl font-black tracking-tighter">{(todayStats.total || 0).toFixed(2)} <span className="text-sm font-bold opacity-40">ج.م</span></h3>
              {!loadingInvoices && todayStats.refundTotal > 0 && (
                <p className="text-[10px] mt-2 font-bold text-white/60">صافي المبيعات: {(todayStats.netTotal || 0).toFixed(2)} ج.م</p>
              )}
            </div>
          </Card>
          <Card className="bg-white p-8 rounded-[2.5rem] border-gray-100/50 shadow-xl shadow-gray-200/10">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">فواتير اليوم</p>
            <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{todayStats.count}</h3>
          </Card>
          <Card className="bg-white p-8 rounded-[2.5rem] border-gray-100/50 shadow-xl shadow-gray-200/10">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">إجمالي المرتجعات اليوم</p>
            <h3 className="text-4xl font-black text-orange-600 tracking-tighter">{(todayStats.refundTotal || 0).toFixed(2)} <span className="text-xs opacity-40">ج.م</span></h3>
          </Card>
        </div>

        <Card className="overflow-hidden p-0 rounded-[2.5rem] border-gray-100/50 shadow-2xl shadow-gray-200/20 bg-white">
          <div className="p-8 pb-0 flex flex-col md:flex-row gap-6 mb-8 items-end">
            <div className="relative flex-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ms-1">البحث في السجلات</p>
              <div className="relative">
                <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-primary-400 w-5 h-5" />
                <input type="text" placeholder="ابحث بالمعرف، العميل، أو الهاتف..."
                  className="w-full pr-14 pl-6 py-4 bg-gray-50/50 border border-gray-100/50 rounded-2xl focus:ring-8 focus:ring-primary-500/5 focus:border-primary-400 outline-none transition-all font-bold text-sm"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>

            <div className="w-full md:w-48">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ms-1">حالة الفاتورة</p>
              <select 
                className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100/50 rounded-2xl outline-none focus:ring-8 focus:ring-primary-500/5 font-bold text-sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="">جميع النشطة</option>
                <option value="paid">مدفوعة</option>
                <option value="pending">معلقة</option>
                <option value="returned">مرتجعة</option>
                <option value="cancelled">ملغاة</option>
              </select>
            </div>
            
            {user.role === 'admin' && (
              <div className="w-full md:w-56">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ms-1">فلترة حسب الموظف</p>
                <select 
                  className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100/50 rounded-2xl outline-none focus:ring-8 focus:ring-primary-500/5 font-bold text-sm"
                  value={selectedCashier}
                  onChange={(e) => setSelectedCashier(e.target.value)}
                >
                  <option value="all">الكل (الموظفين)</option>
                  {allUsers.map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loadingInvoices ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-10 h-10 text-primary-600 animate-spin" /></div>
          ) : (
            <Table headers={[
              'المعرف', 
              'التاريخ', 
              'اسم المنتج', 
              'الحالة',
              'الإجمالي',
              'الإجراءات'
            ]}>
              {invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-gray-50/30 transition-all group">
                  <td className="px-8 py-6 font-mono text-xs text-gray-400 font-bold group-hover:text-primary-600 transition-colors uppercase tracking-widest">{inv.invoiceNumber}</td>
                  <td className="px-8 py-6 text-sm text-gray-500 font-bold">{new Date(inv.createdAt).toLocaleDateString('ar-EG')}</td>
                  
                  {/* Product Name */}
                  <td className="px-8 py-6 text-sm font-black text-gray-800">
                    {inv.items[0]?.name || '---'}
                    {inv.items.length > 1 && <span className="text-[10px] ms-1 text-primary-400">(+{inv.items.length - 1} أخرى)</span>}
                  </td>

                  {/* Status Badge */}
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      inv.status === 'paid' ? 'bg-green-50 text-green-600' :
                      inv.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                      inv.status === 'returned' ? 'bg-orange-50 text-orange-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {inv.status === 'paid' ? 'مدفوعة' : 
                       inv.status === 'pending' ? 'معلقة' : 
                       inv.status === 'returned' ? 'مرتجعة' : 'ملغاة'}
                    </span>
                  </td>

                  {/* Total Amount */}
                  <td className="px-8 py-6 font-black text-gray-900 text-base">{inv.total?.toFixed(2)} <span className="text-[10px] opacity-40">ج.م</span></td>

                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setSelectedInvoice(inv); setIsConfirmed(inv.status === 'paid'); setView('details'); }}
                        className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-primary-600 hover:text-white transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {user.role === 'admin' && (
                        <>
                          <button onClick={() => { setInvoiceToEdit(inv); setIsEditModalOpen(true); }}
                            className="p-3 bg-gray-50 text-gray-500 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setInvoiceToDelete(inv); setIsDeleteModalOpen(true); }}
                            className="p-3 bg-gray-50 text-red-400 rounded-xl hover:bg-red-600 hover:text-white transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {isDeleteModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl space-y-8 text-center">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto">
                  <Trash2 className="w-10 h-10" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-gray-900">حذف الفاتورة وإعادة البضاعة؟</h3>
                  <p className="text-gray-500 font-bold text-sm px-4">سيتم حذف الفاتورة نهائياً وإعادة الكميات المباعة إلى رصيد المخزن (Restock) بشكل آلي.</p>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 h-14 bg-gray-100 text-gray-600 rounded-2xl font-black transition-all hover:bg-gray-200">إلغاء</button>
                  <button onClick={handleDeleteInvoice} className="flex-1 h-14 bg-red-500 text-white rounded-2xl font-black transition-all hover:bg-red-600 shadow-lg shadow-red-200">تأكيد الحذف</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Edit Modal */}
        <AnimatePresence>
          {isEditModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl space-y-8 relative">
                <button onClick={() => setIsEditModalOpen(false)} className="absolute top-8 left-8 text-gray-300 hover:text-gray-900 transition-colors"><X className="w-6 h-6" /></button>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Edit2 className="w-6 h-6" /></div>
                  <h3 className="text-2xl font-black text-gray-900">تعديل بيانات الفاتورة</h3>
                </div>
                <form onSubmit={handleUpdateInvoice} className="space-y-6">
                  <Input label="اسم العميل" name="customer" defaultValue={invoiceToEdit?.customer} required className="h-14 rounded-2xl font-bold bg-gray-50" />
                  <Input label="رقم الهاتف" name="customerPhone" defaultValue={invoiceToEdit?.customerPhone} className="h-14 rounded-2xl font-bold bg-gray-50" />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ms-1">حالة الفاتورة</label>
                    <select name="status" defaultValue={invoiceToEdit?.status} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 font-bold">
                      <option value="paid">مدفوعة (Paid)</option>
                      <option value="pending">معلقة (Pending)</option>
                      <option value="cancelled">ملغاة (Cancelled)</option>
                    </select>
                  </div>
                  <Button type="submit" className="w-full h-15 rounded-2xl font-black text-lg shadow-xl shadow-blue-200">حفظ التغييرات</Button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (view === 'checkout' && checkoutProduct) {
    const totals = calculateTotals(checkoutProduct, checkoutQuantity);
    return (
      <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-20">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/scan')} className="flex items-center gap-3 text-gray-400 hover:text-gray-900 font-black transition-all group px-4 py-2 hover:bg-gray-100 rounded-2xl">
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 rotate-180 transition-transform" />
            <span>تعديل المنتج</span>
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter">مراجعة الفاتورة</h1>
            <p className="text-gray-500 font-bold mt-1 text-sm">أدخل بيانات العميل والموظف للتأكيد</p>
          </div>
          <div className="w-32"></div>
        </div>

        <Card className="p-0 border-none shadow-2xl relative overflow-hidden bg-white rounded-[3rem] shadow-gray-200/50">
          <div className="p-12 space-y-12">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-50 rounded-[1.5rem] flex items-center justify-center text-primary-600 shadow-inner">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900">بيانات العملية الحالية</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Order Review Stage</p>
                </div>
              </div>
              <span className="px-5 py-2 bg-yellow-50 text-yellow-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-yellow-100">بانتظار التأكيد</span>
            </div>

            {/* Product */}
            <div className="bg-gray-50/50 border border-gray-100/50 rounded-[2.5rem] p-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
              <div className="flex items-start gap-8">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-gray-300 shadow-sm border border-gray-100/30 shrink-0">
                  <Package className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-3xl font-black text-gray-900 leading-none">{checkoutProduct.name}</h4>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-white rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100/50">{checkoutProduct.color} - {checkoutProduct.size}</span>
                    <span className="text-xs text-primary-600 font-black">×{checkoutQuantity} قطعة</span>
                  </div>
                </div>
              </div>
              <div className="text-start md:text-end space-y-2 px-4 border-r md:border-r-0 md:border-l border-gray-200">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">المبلغ الإجمالي</p>
                <p className="text-4xl font-black text-primary-600 tabular-nums tracking-tighter">
                  {totals.total.toFixed(2)}<span className="text-xs font-bold ms-1 opacity-30">ج.م</span>
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
              {/* Customer */}
              <div className="space-y-8">
                <div className="flex items-center gap-2 px-2">
                  <UserCircle className="w-4 h-4 text-primary-600" />
                  <h3 className="font-black text-gray-900 uppercase tracking-wider text-xs">بيانات العميل</h3>
                </div>
                <div className="px-2 space-y-6">
                  <Input label="اسم العميل" placeholder="اسم العميل (اختياري)" value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-14 rounded-2xl font-bold bg-gray-50 border-gray-100" />
                  <Input label="رقم الهاتف" placeholder="010XXXXXXXX" value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-14 rounded-2xl font-mono text-center text-xl tracking-widest placeholder:tracking-normal placeholder:font-sans placeholder:text-sm shadow-inner bg-gray-50 border-gray-100" />
                  <div className="p-5 bg-blue-50/30 rounded-2xl border border-blue-100/20 flex gap-4">
                    <Info className="w-5 h-5 text-blue-600 shrink-0" />
                    <p className="text-xs text-blue-700 font-medium leading-relaxed">سيتم ربط هذه العملية بالبيانات المدخلة ليسهل استرجاعها من سجل الفواتير.</p>
                  </div>
                </div>
              </div>

              {/* Payment + Cashier */}
              <div className="space-y-8">
                <div className="flex items-center gap-2 px-2">
                  <Wallet className="w-4 h-4 text-primary-600" />
                  <h3 className="font-black text-gray-900 uppercase tracking-wider text-xs">طريقة السداد والموظف</h3>
                </div>
                <div className="space-y-6 px-2">
                  <div className="grid grid-cols-2 gap-4">
                    {['cash', 'card'].map(method => (
                      <button key={method} onClick={() => setPaymentMethod(method)}
                        className={`flex items-center justify-center gap-3 h-14 rounded-2xl border-2 font-black text-xs transition-all ${paymentMethod === method ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-200' : 'bg-white text-gray-400 border-gray-50 hover:border-gray-100'}`}>
                        {method === 'cash' ? <Banknote className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                        {method === 'cash' ? 'نقدي' : 'كارت'}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4">الكاشير القائم بالعملية</p>
                    <div className="grid grid-cols-2 gap-3">
                      {allUsers.filter(u => u.isActive).map(u => (
                        <button key={u._id} onClick={() => setCashierId(u._id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${cashierId === u._id ? 'bg-primary-50 border-primary-600/30 text-primary-900' : 'bg-gray-50/50 border-transparent text-gray-500 hover:bg-gray-100'}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white ${cashierId === u._id ? 'bg-primary-600 shadow-lg shadow-primary-200' : 'bg-gray-300'}`}>
                            {u.name.substring(0, 1)}
                          </div>
                          <span className="text-xs font-black">{u.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Manual Discount Field */}
                  <div className="pt-4">
                    <div className="flex items-center gap-2 px-1 mb-3">
                      <Tag className="w-4 h-4 text-orange-500" />
                      <h3 className="font-black text-gray-900 uppercase tracking-wider text-xs">خصم إضافي (اختياري)</h3>
                    </div>
                    <div className="relative">
                      <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400 text-sm">ج.م</span>
                      <input 
                        type="number" 
                        placeholder="0.00"
                        className="w-full pl-14 pr-6 py-4 bg-orange-50/30 border border-orange-100 rounded-2xl outline-none focus:ring-8 focus:ring-orange-500/5 font-black text-xl text-orange-600 tabular-nums transition-all"
                        value={manualDiscount || ''}
                        onChange={(e) => setManualDiscount(Number(e.target.value))}
                      />
                    </div>
                    <p className="text-[10px] text-orange-400 font-bold mt-2 px-1">سيتم خصم هذا المبلغ فوراً من الإجمالي النهائي للفاتورة.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-10 border-t border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-gray-400 font-black tracking-widest uppercase mb-1">المبلغ النهائي للمطالبة</p>
                <p className="text-3xl font-black text-gray-900 tabular-nums tracking-tighter">
                  {calculateTotals(checkoutProduct, checkoutQuantity, manualDiscount).total.toFixed(2)}<span className="text-xs ms-1 opacity-20">ج.م</span>
                </p>
              </div>
              <Button onClick={handleConfirmCheckout} disabled={submitting} className="h-16 px-12 rounded-3xl font-black text-xl shadow-2xl shadow-primary-200 transition-all hover:scale-105 active:scale-95">
                {submitting ? <span className="flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin" />جاري الإصدار...</span> : 'تأكيد وإصدار الفاتورة'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Details View
  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000 pb-20">
      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => setView('list')} className="flex items-center gap-3 text-gray-400 hover:text-gray-900 font-black transition-all group px-4 py-2 hover:bg-gray-100 rounded-2xl">
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <span>العودة للسجل</span>
        </button>
        <div className="text-center">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">الفاتورة الرسمية</h1>
          <p className="text-gray-500 font-bold mt-1 text-sm">تفاصيل المعاملة وبيانات السداد</p>
        </div>
        <div className="min-w-[120px]"></div>
      </div>

      <Card className="p-0 border-none shadow-2xl relative overflow-hidden bg-white rounded-[4rem] shadow-gray-300/40">
        <div ref={printableInvoiceRef} id="printable-invoice">
          <InvoicePaper invoice={selectedInvoice} isConfirmed={isConfirmed} />
        </div>
      </Card>

      <div className="fixed left-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 print:hidden z-50">
        <div className="bg-gray-900/90 backdrop-blur-md p-3 rounded-[2.5rem] shadow-2xl flex flex-col gap-3 border border-white/10 group">
          <button 
            onClick={handlePrintInvoice} 
            className="w-16 h-16 bg-primary-600 text-white rounded-full flex flex-col items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg shadow-primary-600/20 group/btn"
            title="طباعة الفاتورة"
          >
            <Printer className="w-6 h-6" />
            <span className="text-[8px] font-black mt-1 uppercase">Print</span>
          </button>
          
          <div className="w-full h-px bg-white/10"></div>
          
          <button 
            onClick={() => setView('list')} 
            className="w-14 h-14 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full flex items-center justify-center transition-all"
            title="العودة للسجل"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => navigate('/scan')} 
            className="w-14 h-14 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full flex items-center justify-center transition-all"
            title="بيع جديد"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
