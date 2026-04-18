import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Input } from '../components/ui/Base';
import { Modal } from '../components/ui/Modal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import {
  UserPlus, Shield, Trash2, Edit2, User,
  ShieldCheck, Check, Loader2
} from 'lucide-react';
import { usersAPI } from '../lib/api';
import { useAuth } from '../App';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data.data);
    } catch (err) {
      setError('فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const formData = new FormData(e.target);
    const userData = {
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role'),
      password: formData.get('password') || undefined,
    };
    if (!userData.password && !editingUser) {
      setSaving(false);
      setError('كلمة المرور مطلوبة للمستخدم الجديد');
      return;
    }
    try {
      if (editingUser) {
        await usersAPI.update(editingUser._id, userData);
      } else {
        await usersAPI.create(userData);
      }
      setIsModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await usersAPI.delete(userToDelete._id);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'فشل الحذف');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">إدارة المستخدمين</h1>
          <p className="text-gray-500">إدارة صلاحيات الموظفين والكاشير في النظام</p>
        </div>
        <Button onClick={() => { setEditingUser(null); setError(''); setIsModalOpen(true); }} className="sm:w-fit gap-2 h-11">
          <UserPlus className="w-5 h-5" />
          <span>إضافة مستخدم جديد</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-primary-600 border-none text-white p-8">
            <ShieldCheck className="w-10 h-10 mb-6 opacity-80" />
            <h3 className="text-xl font-black mb-2">أمن النظام</h3>
            <p className="text-sm text-primary-100 leading-relaxed mb-6">يمكنك هنا تخصيص الصلاحيات لكل موظف لضمان أقصى درجات الحماية.</p>
            <div className="pt-6 border-t border-primary-500">
              <div className="flex justify-between items-center text-sm font-bold">
                <span>إجمالي المستخدمين</span>
                <span className="text-2xl font-black">{users.length}</span>
              </div>
            </div>
          </Card>

          <div className="p-6 bg-white rounded-3xl border border-gray-100 space-y-4">
            <h4 className="font-black text-gray-800 text-sm">الأدوار المتاحة</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <Shield className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs font-black text-blue-900">المسؤول (Admin)</p>
                  <p className="text-[10px] text-blue-700">دخول كامل للنظام</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                <User className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-xs font-black text-green-900">كاشير (Cashier)</p>
                  <p className="text-[10px] text-green-700">عمليات البيع فقط</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="lg:col-span-3">
          <Card className="p-0 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
              </div>
            ) : (
              <Table headers={['الموظف', 'البريد الإلكتروني', 'الدور', 'الحالة', 'الإجراءات']}>
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                          {u.name.substring(0, 2)}
                        </div>
                        <span className="font-bold text-gray-800 text-sm">{u.name}</span>
                        {u._id === currentUser?._id && (
                          <span className="text-[10px] bg-primary-50 text-primary-600 font-black px-2 py-0.5 rounded-full">أنت</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-500">{u.email}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${u.role === 'admin' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                        {u.role === 'admin' ? 'مسؤول' : 'كاشير'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`flex items-center gap-1.5 text-xs font-bold ${u.isActive ? 'text-green-500' : 'text-red-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {u.isActive ? 'نشط' : 'موقوف'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditingUser(u); setError(''); setIsModalOpen(true); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u._id !== currentUser?._id && (
                          <button onClick={() => { setUserToDelete(u); setIsDeleteModalOpen(true); }} className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingUser(null); }} title={editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="اسم الموظف بالكامل" name="name" defaultValue={editingUser?.name} placeholder="مثال: محمد أحمد علي" required />
          <Input label="البريد الإلكتروني" name="email" type="email" defaultValue={editingUser?.email} placeholder="name@company.com" required />
          <Input
            label={editingUser ? 'كلمة مرور جديدة (اتركها فارغة للإبقاء على الحالية)' : 'كلمة المرور *'}
            name="password" type="password" placeholder="••••••"
            required={!editingUser}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-gray-700">الدور الوظيفي</label>
            <select name="role" defaultValue={editingUser?.role || 'cashier'} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all">
              <option value="cashier">كاشير (صلاحيات محدودة)</option>
              <option value="admin">مسؤول (صلاحيات كاملة)</option>
            </select>
          </div>
          {error && <p className="text-xs text-red-500 font-bold bg-red-50 py-2 px-3 rounded-xl">{error}</p>}
          <div className="pt-6 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>إلغاء</Button>
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingUser ? <Check className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              <span>{editingUser ? 'حفظ التغييرات' : 'إنشاء المستخدم'}</span>
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }}
        onConfirm={confirmDelete}
        title="حذف المستخدم"
        message={`هل أنت متأكد من حذف المستخدم "${userToDelete?.name}"؟ سيؤدي ذلك إلى إزالة صلاحيات دخوله للنظام.`}
      />
    </div>
  );
}
