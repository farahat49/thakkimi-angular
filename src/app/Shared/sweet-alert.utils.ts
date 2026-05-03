import Swal from 'sweetalert2';
export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

/**
 * دالة اختيارية لإظهار رسالة تأكيد (حذف مثلاً)
 */
export const ConfirmDialog = (title: string, text: string) => {
  return Swal.fire({
    title: title,
    text: text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d4af37',
    cancelButtonColor: '#d33',
    confirmButtonText: 'نعم، قم بالتنفيذ',
    cancelButtonText: 'إلغاء'
  });
};