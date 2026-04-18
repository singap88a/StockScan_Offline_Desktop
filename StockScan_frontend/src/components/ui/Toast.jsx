import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ type, message, onClose }) => {
  const configs = {
    success: {
      icon: CheckCircle,
      color: 'text-green-500',
      bg: 'bg-green-50/90',
      border: 'border-green-100',
      accent: 'bg-green-500'
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-500',
      bg: 'bg-red-50/90',
      border: 'border-red-100',
      accent: 'bg-red-500'
    },
    info: {
      icon: Info,
      color: 'text-blue-500',
      bg: 'bg-blue-50/90',
      border: 'border-blue-100',
      accent: 'bg-blue-500'
    }
  };

  const config = configs[type] || configs.info;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden flex items-center gap-4 p-4 pr-6 rounded-2xl border ${config.bg} ${config.border} backdrop-blur-md shadow-xl shadow-gray-200/40 min-w-[320px] pointer-events-auto`}
    >
      {/* Accent Bar */}
      <div className={`absolute top-0 right-0 bottom-0 w-1.5 ${config.accent}`}></div>

      <div className={`p-2 rounded-xl bg-white shadow-sm ${config.color}`}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1">
        <p className="text-sm font-black text-gray-900 leading-tight">{message}</p>
      </div>

      <button 
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-black/5 text-gray-400 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress Line */}
      <motion.div 
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 4, ease: 'linear' }}
        className={`absolute bottom-0 left-0 h-0.5 ${config.accent} opacity-30`}
      />
    </motion.div>
  );
};

export default Toast;
