import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Modal } from '../components/ui/Base';
import { 
  Wallet, Plus, Trash2, Search, Loader2, User, Phone, 
  FileText, Banknote, Calendar, Eye, Edit3, X, AlertCircle
} from 'lucide-react';
import { expensesAPI } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [modalType, setModalType] = useState(null); // 'add', 'edit', 'view', 'delete'
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    personName: '',
    amount: '',
    details: '',
    phone: '',
  });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await expensesAPI.getAll();
      setExpenses(res.data.data);
    } catch (err) {
      showToast('error', 'فشل تحميل المصروفات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleOpenModal = (type, expense = null) => {
    setModalType(type);
    if (expense) {
      setSelectedExpense(expense);
      if (type === 'edit') {
        setFormData({
          title: expense.title,
          personName: expense.personName,
          amount: expense.amount,
          details: expense.details,
          phone: expense.phone,
        });
      }
    } else {
      setFormData({ title: '', personName: '', amount: '', details: '', phone: '' });
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedExpense(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalType === 'add') {
        await expensesAPI.create(formData);
        showToast('success', 'تم تسجيل المصروف بنجاح');
      } else {
        await expensesAPI.update(selectedExpense._id, formData);
        showToast('success', 'تم تحديث المصروف بنجاح');
      }
      closeModal();
      fetchExpenses();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'فشل تنفيذ العملية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    setIsSubmitting(true);
    try {
      await expensesAPI.delete(selectedExpense._id);
      showToast('success', 'تم حذف المصروف بنجاح');
      closeModal();
      fetchExpenses();
    } catch (err) {
      showToast('error', 'فشل حذف المصروف');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmt = (n) => Number(n || 0).toLocaleString('ar-EG');

  const filteredExpenses = expenses.filter(exp => 
    exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.personName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalToday = expenses
    .filter(e => new Date(e.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">مصروفات المخزون</h1>
          <p className="text-gray-500 font-medium mt-1">تتبع المبالغ الخارجة من الخزينة ومصاريف البضائع</p>
        </div>
        <Button onClick={() => handleOpenModal('add')} className="sm:w-fit gap-3 h-14 shadow-xl shadow-primary-200/50 rounded-2xl font-black text-base px-8">
          <Plus className="w-5 h-5" />
          <span>إضافة مصروف جديد</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="bg-gradient-to-br from-primary-600 to-primary-800 border-none text-white p-8 rounded-[2.5rem] shadow-2xl shadow-primary-200/40 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            <p className="text-primary-100 text-[10px] font-black uppercase tracking-widest mb-3 opacity-60">إجمالي مصروفات اليوم</p>
            <h3 className="text-4xl font-black tabular-nums">{fmt(totalToday)} <span className="text-xs font-bold opacity-40">ج.م</span></h3>
         </Card>
         <Card className="bg-white p-8 rounded-[2.5rem] border-gray-100 shadow-xl shadow-gray-200/10">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3">إجمالي مصروفات المخزون</p>
            <h3 className="text-4xl font-black text-gray-900 tabular-nums">{fmt(expenses.reduce((s, e) => s + e.amount, 0))} <span className="text-xs font-bold opacity-30">ج.م</span></h3>
         </Card>
         <Card className="bg-white p-8 rounded-[2.5rem] border-gray-100 shadow-xl shadow-gray-200/10">
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-3">عدد العمليات المسجلة</p>
            <h3 className="text-4xl font-black text-gray-900 tabular-nums">{expenses.length} <span className="text-xs font-bold opacity-30">عملية</span></h3>
         </Card>
      </div>

      <Card className="rounded-[3rem] p-0 overflow-hidden border-gray-100/50 shadow-2xl shadow-gray-200/20 bg-white">
        <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">سجل المصروفات المجمع</h3>
          <div className="relative w-full md:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
            <input type="text" placeholder="ابحث بالعنوان أو الاسم..." 
              className="w-full pr-12 pl-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary-500/5 font-bold text-sm transition-all"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="min-h-[400px]">
          {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="w-10 h-10 text-primary-600 animate-spin" /></div>
          ) : (
            <Table headers={['المصروف', 'الاسم المستلم', 'المبلغ', 'التاريخ', 'الإجراءات']}>
              {filteredExpenses.map((exp) => (
                <tr key={exp._id} className="hover:bg-gray-50/20 transition-all group border-b border-gray-50/50">
                  <td className="px-8 py-7">
                    <div className="flex flex-col max-w-md">
                      <span className="font-black text-gray-900 text-lg line-clamp-1" title={exp.title}>{exp.title}</span>
                      <span className="text-[10px] text-gray-400 font-bold mt-0.5 line-clamp-1">{exp.details || 'لا توجد ملاحظات'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-700">{exp.personName || '—'}</span>
                        <span className="text-[10px] text-gray-400 font-bold mt-0.5">{exp.phone || 'بدون رقم'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <span className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black text-lg tabular-nums">
                      -{fmt(exp.amount)} <span className="text-[10px] opacity-60 ms-1 uppercase">ج.م</span>
                    </span>
                  </td>
                  <td className="px-8 py-7 text-gray-400 font-bold text-xs whitespace-nowrap">
                    {new Date(exp.createdAt).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleOpenModal('view', exp)} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm" title="عرض التفاصيل">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleOpenModal('edit', exp)} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-primary-600 hover:text-white transition-all shadow-sm" title="تعديل">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleOpenModal('delete', exp)} className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                   <td colSpan="5" className="py-24 text-center">
                     <div className="flex flex-col items-center gap-3 text-gray-300">
                       <Wallet className="w-16 h-16 opacity-20" />
                       <p className="font-black text-lg">لا توجد سجلات مطابقة للبحث</p>
                     </div>
                   </td>
                </tr>
              )}
            </Table>
          )}
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={modalType === 'add' || modalType === 'edit'} 
        onClose={closeModal}
        title={modalType === 'add' ? 'إضافة مصروف جديد' : 'تعديل بيانات المصروف'}
        className="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Title & Details */}
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ms-1">
                  <FileText className="w-3.5 h-3.5" />
                  بيان المصروف (التفاصيل الأساسية)
                </label>
                <textarea 
                  required 
                  rows={3}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary-500/5 font-black text-lg text-gray-900 transition-all placeholder:font-bold placeholder:text-gray-300"
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="اكتب هنا تفاصيل المصروف..." 
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ms-1 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  ملاحظات إضافية (اختياري)
                </label>
                <textarea 
                  rows={1}
                  className="w-full px-6 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-8 focus:ring-primary-500/5 font-bold text-sm"
                  value={formData.details} 
                  onChange={e => setFormData({...formData, details: e.target.value})} 
                  placeholder="أضف أي ملاحظات أخرى هنا..." 
                />
              </div>
            </div>

            {/* Right Column: Numbers & People */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ms-1 flex items-center gap-2">
                  <Banknote className="w-3.5 h-3.5" />
                  المبلغ المطلوب
                </label>
                <div className="relative">
                  <input type="number" required className="w-full pl-16 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-8 focus:ring-primary-500/5 font-black text-2xl text-primary-600 tabular-nums"
                    value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" />
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 font-bold text-xs uppercase tracking-widest">ج.م</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ms-1 flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    المستلم
                  </label>
                  <input className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-8 focus:ring-primary-500/5 font-bold"
                    value={formData.personName} onChange={e => setFormData({...formData, personName: e.target.value})} placeholder="اسم المستلم" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ms-1 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    الهاتف
                  </label>
                  <input className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-8 focus:ring-primary-500/5 font-mono text-center tracking-widest"
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="010XXXXXXXX" />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 flex items-center gap-3">
             <Button type="submit" disabled={isSubmitting} className="flex-1 h-14 rounded-xl font-black text-lg shadow-xl shadow-primary-200/50">
               {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (modalType === 'add' ? 'تأكيد وحفظ المصروف' : 'تحديث البيانات')}
             </Button>
             <Button type="button" onClick={closeModal} variant="secondary" className="px-6 h-14 rounded-xl font-bold text-gray-500">إلغاء</Button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal isOpen={modalType === 'view'} onClose={closeModal} title="تفاصيل المصروف المالي" className="max-w-4xl">
        {selectedExpense && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Financial Summary Small Card */}
              <div className="lg:col-span-1 p-6 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-[2rem] shadow-xl shadow-primary-200 relative overflow-hidden flex flex-col justify-center">
                <Banknote className="w-8 h-8 mb-4 opacity-40" />
                <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-70">المبلغ</p>
                <h2 className="text-3xl font-black tabular-nums">{fmt(selectedExpense.amount)} <span className="text-[10px] opacity-50">ج.م</span></h2>
              </div>

              {/* Main Info Column */}
              <div className="lg:col-span-2 p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex flex-col justify-center">
                <h4 className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <FileText className="w-3.5 h-3.5" />
                   بيان المصروف
                </h4>
                <p className="text-xl font-black text-gray-900 leading-snug line-clamp-3">{selectedExpense.title}</p>
              </div>

              {/* Recipient & Date Column */}
              <div className="lg:col-span-1 p-6 bg-gray-50/50 rounded-[2rem] border border-gray-100 flex flex-col justify-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-primary-600">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 leading-none mb-1">المستلم</p>
                    <p className="text-sm font-black text-gray-900 line-clamp-1">{selectedExpense.personName || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-primary-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 leading-none mb-1">بتاريخ</p>
                    <p className="text-sm font-black text-gray-900">{new Date(selectedExpense.createdAt).toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>
              </div>
            </div>

            {selectedExpense.details && (
              <div className="p-6 bg-white border border-gray-100 rounded-2xl">
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">ملاحظات إضافية</h4>
                 <p className="text-sm font-medium text-gray-600 leading-relaxed">{selectedExpense.details}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={closeModal} variant="secondary" className="px-10 h-12 rounded-xl font-black text-gray-500">إغلاق</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={modalType === 'delete'} onClose={closeModal} title="تأكيد الحذف">
        <div className="py-6 text-center space-y-8">
           <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-12 h-12" />
           </div>
           <div className="space-y-3 px-4">
              <h2 className="text-2xl font-black text-gray-900">هل أنت متأكد تماماً؟</h2>
              <p className="text-gray-500 font-bold leading-relaxed">
                أنت على وشك حذف سجل مصروف بقيمة <span className="text-red-600 tabular-nums">({fmt(selectedExpense?.amount)} ج.م)</span>.
                هذا الإجراء لا يمكن التراجع عنه وسيعود المبلغ لرصيد المبيعات.
              </p>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <Button onClick={closeModal} variant="secondary" className="h-14 rounded-2xl font-black">إلغاء</Button>
              <Button onClick={confirmDelete} disabled={isSubmitting} variant="danger" className="h-14 rounded-2xl font-black shadow-none">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'نعم، قم بالحذف'}
              </Button>
           </div>
        </div>
      </Modal>
    </div>
  );
}
