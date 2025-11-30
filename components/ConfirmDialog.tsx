import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-stone-900 border border-stone-700 rounded-xl w-full max-w-sm shadow-2xl scale-100">
        <div className="p-6">
          <div className="flex items-center gap-3 text-amber-500 mb-3">
             <AlertTriangle size={24} />
             <h3 className="text-lg font-bold text-white serif">{title}</h3>
          </div>
          <p className="text-stone-300 text-sm mb-6 leading-relaxed">
            {message}
          </p>
          <div className="flex gap-3 justify-end">
            <button 
              onClick={onCancel}
              className="px-4 py-2 rounded-lg bg-stone-800 text-stone-300 font-medium hover:bg-stone-700 transition-colors text-xs uppercase tracking-wider"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-red-900/50 border border-red-800 text-red-200 font-medium hover:bg-red-900 hover:text-white transition-colors text-xs uppercase tracking-wider"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;