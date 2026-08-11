import SweetAlert from 'sweetalert2';

const Swal = SweetAlert.mixin({
  background: 'var(--color-surface)',
  color: 'var(--color-text)',
  customClass: {
    popup: 'ac-sw-popup',
    title: 'ac-sw-title',
    htmlContainer: 'ac-sw-content',
    actions: 'ac-sw-actions',
    icon: 'ac-sw-icon',
    confirmButton: 'ac-sw-confirm',
    cancelButton: 'ac-sw-cancel',
    denyButton: 'ac-sw-deny',
  },
  showClass: {
    popup: 'ac-sw-show',
  },
  hideClass: {
    popup: 'ac-sw-hide',
  },
});

export default Swal;