export const ORDER_STATUS_CONFIG = {
  new: { label: 'طلب جديد', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  confirmed: { label: 'مؤكد', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  processing: { label: 'قيد التجهيز', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  shipped: { label: 'خرج للتوصيل', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  delivered: { label: 'مكتمل ومستلم', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  cancelled: { label: 'ملغي', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  returned: { label: 'مرتجع', color: 'bg-gray-100 text-gray-800 border-gray-200' },
};

export const PAYMENT_STATUS_CONFIG = {
  pending: { label: 'قيد الانتظار', color: 'bg-amber-100 text-amber-800' },
  paid: { label: 'مدفوع', color: 'bg-emerald-100 text-emerald-800' },
  failed: { label: 'فشل', color: 'bg-rose-100 text-rose-800' },
  refunded: { label: 'مسترجع', color: 'bg-gray-100 text-gray-800' },
};

export function formatDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-YE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatShortDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-YE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}
