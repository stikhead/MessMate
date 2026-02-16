import { useEffect } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  // Auto-dismiss after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-bottom-5 fade-in duration-300 ${
      type === "success" 
        ? "bg-green-50 border-green-200 text-green-800" 
        : "bg-red-50 border-red-200 text-red-800"
    }`}>
      {/* Icon */}
      {type === "success" ? (
        <CheckCircle2 className="h-5 w-5 text-green-600" />
      ) : (
        <XCircle className="h-5 w-5 text-red-600" />
      )}

      {/* Message */}
      <p className="text-sm font-semibold pr-2">{message}</p>

      {/* Close Button */}
      <button 
        onClick={onClose}
        className={`p-1 rounded-full hover:bg-black/5 transition-colors ${
          type === "success" ? "text-green-600" : "text-red-600"
        }`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}