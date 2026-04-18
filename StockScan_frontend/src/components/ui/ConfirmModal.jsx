import React from 'react';
import { Modal } from './Modal';
import { Button } from './Base';
import { AlertTriangle } from 'lucide-react';

export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'تأكيد الحذف', 
  message = 'هل أنت متأكد من رغبتك في حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء.',
  confirmText = 'تأكيد الحذف',
  cancelText = 'إلغاء'
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-6">
        <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-sm shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-sm text-red-900 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="px-6">
            {cancelText}
          </Button>
          <Button variant="danger" onClick={onConfirm} className="px-6">
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
