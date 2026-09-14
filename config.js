// ====== ค่าคงที่ระบบ ======
const APP_CONFIG = {
  CURRENCY: 'บาท',
  LOCALE: 'th-TH',
  DATE_FORMAT: 'yyyy-MM-dd',
  TAB_KEY: 'activeTab',
  THEME_KEY: 'appTheme'
};

const CATEGORIES = [
  'ค่าที่พักและสาธารณูปโภค',
  'ค่าโทรศัพท์และอินเทอร์เน็ต',
  'ค่าบัตรเครดิตและผ่อนชำระ',
  'ครอบครัวและเงินออม',
  'ค่าใช้จ่ายส่วนตัว / ช้อปปิ้ง',
  'ทั่วไป'
];

// ====== State กลาง ======
const AppState = {
  setupItems: [],
  globalExpenses: [],
  globalIncomes: [],
  charts: { incVsExp: null, status: null, category: null }
};

// ====== Helper ======
function formatNumber(n) {
  return (Number(n) || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 });
}

function formatCurrency(n) {
  return formatNumber(n) + ' ' + APP_CONFIG.CURRENCY;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Toast แจ้งเตือนมุมขวาล่าง
function toast(icon, title) {
  Swal.fire({
    toast: true, position: 'bottom-end',
    icon: icon, title: title,
    showConfirmButton: false, timer: 2200, timerProgressBar: true
  });
}

// Loading
function showLoading(text) {
  const el = document.getElementById('loadingOverlay');
  const p = el.querySelector('p');
  if (p && text) p.textContent = text;
  el.classList.remove('hide');
}
function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hide');
}
