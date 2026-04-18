import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../components/ui/Base';
import { Package, ArrowRight, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginStatus, setLoginStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'

  useEffect(() => {
    if (role === 'admin') {
      setEmail('');
      setPassword('');
    } else {
      setEmail('');
      setPassword('');
    }
    setError('');
    setLoginStatus('idle');
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLoginStatus('loading');
    setError('');

    try {
      const result = await login(email, password);
      if (result.success) {
        setLoginStatus('success');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setLoginStatus('error');
        setError(result.message || 'بيانات الدخول غير صحيحة');
      }
    } catch (err) {
      setLoginStatus('error');
      setError('فشل الاتصال بالسيرفر، تأكد من تشغيل الباكيند');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-200/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-200/40 rounded-full blur-3xl"></div>
      </div>

      <AnimatePresence mode="wait">
        {loginStatus === 'success' ? (
          <motion.div
            key="success-overlay"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="w-full max-w-[28rem] bg-white rounded-[2.5rem] shadow-2xl p-16 z-20 text-center space-y-8 border-4 border-green-500/20"
          >
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner ring-8 ring-green-50/50">
              <CheckCircle size={48} className="animate-bounce" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter">أهلاً بك مجدداً!</h2>
              <p className="text-gray-500 font-bold mt-2">جاري تجهيز لوحة التحكم الخاصة بك...</p>
            </div>
            <div className="pt-4">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="login-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-[28rem] bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/60 p-10 z-10 border border-gray-100/50"
          >
            <div className="flex flex-col items-center text-center mt-2 mb-10">
              <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-200 mb-6 transition-transform hover:scale-105 duration-500">
                <Package className="text-white w-8 h-8" />
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tighter">StockScan</h1>
              <p className="text-gray-500 font-medium text-sm">نظام إدارة المخازن والمبيعات الذكي</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-1.5 bg-gray-50 rounded-2xl flex items-center border border-gray-100/50">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setRole('admin')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all duration-300 ${
                    role === 'admin'
                      ? 'bg-white text-primary-600 shadow-md transform scale-[1.02]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  مسؤول نظام
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setRole('cashier')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all duration-300 ${
                    role === 'cashier'
                      ? 'bg-white text-primary-600 shadow-md transform scale-[1.02]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  كاشير مبيعات
                </button>
              </div>

              <div className="space-y-2">
                <Input
                  label="البريد الإلكتروني"
                  type="email"
                  placeholder="name@stockscan.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) {
                      setError('');
                      setLoginStatus('idle');
                    }
                  }}
                  className={`h-14 rounded-2xl font-bold bg-gray-50/50 transition-all duration-300 ${
                    error ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-100'
                  }`}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 pe-1">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) {
                        setError('');
                        setLoginStatus('idle');
                      }
                    }}
                    className={`w-full h-14 rounded-2xl font-black tracking-widest text-lg bg-gray-50/50 transition-all duration-300 px-4 pe-12 border focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none ${
                      error ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-100'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 left-0 px-4 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0, x: -10 }}
                      animate={{ opacity: 1, height: 'auto', x: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-xs text-red-500 font-bold px-4 py-3 bg-red-50 rounded-2xl border border-red-100 mt-4 flex items-center gap-3"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <Button
                className={`w-full h-15 text-lg font-black shadow-xl rounded-[1.5rem] mt-4 group transition-all duration-500 ${
                  loginStatus === 'error' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'shadow-primary-200/50'
                }`}
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري التحقق...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{loginStatus === 'error' ? 'إعادة المحاولة' : 'تأكيد الدخول'}</span>
                    <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 rotate-180 transition-transform" />
                  </div>
                )}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
