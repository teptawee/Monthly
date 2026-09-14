
// ============================================================
// INIT
// ============================================================
window.addEventListener('DOMContentLoaded', function() {
  initTheme();
  initDateInputs();
  initFab();
  initTabPersistence();
  loadInitialData();
});

function initDateInputs() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('expenseDate').value = today;
  document.getElementById('incomeDate').value = today;
}

// ====== Theme Toggle ======
function initTheme() {
  const saved = localStorage.getItem(APP_CONFIG.THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);

  document.getElementById('themeToggle').addEventListener('click', function() {
    const cur = document.documentElement.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(APP_CONFIG.THEME_KEY, next);
    updateThemeIcon(next);
  });
}
function updateThemeIcon(theme) {
  const icon = document.querySelector('#themeToggle i');
  icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// ====== Tab Persistence ======
function initTabPersistence() {
  const saved = sessionStorage.getItem(APP_CONFIG.TAB_KEY);
  if (saved) {
    const btn = document.querySelector(`[data-bs-target="#${saved}"]`);
    if (btn) new bootstrap.Tab(btn).show();
  }
  document.querySelectorAll('[data-bs-toggle="pill"]').forEach(el => {
    el.addEventListener('shown.bs.tab', e => {
      const target = e.target.getAttribute('data-bs-target').replace('#', '');
      sessionStorage.setItem(APP_CONFIG.TAB_KEY, target);
    });
  });
}

// ====== FAB Scroll Top ======
function initFab() {
  const fab = document.getElementById('fabTop');
  window.addEventListener('scroll', () => {
    fab.classList.toggle('show', window.scrollY > 200);
  }, { passive: true });
  fab.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ============================================================
// โหลดข้อมูลครั้งเดียวแบบขนาน (เร็วขึ้น)
// ============================================================
function loadInitialData() {
  showLoading('กำลังโหลดข้อมูล...');
  google.script.run
    .withSuccessHandler(function(data) {
      AppState.setupItems = data.setupItems || [];
      AppState.globalExpenses = data.expenses || [];
      AppState.globalIncomes = data.incomes || [];

      renderExpenseOptions(data.setupItems);
      renderIncomeOptions(data.incomeSetupItems);
      renderExpenseTables(AppState.globalExpenses);
      renderIncomeTable(AppState.globalIncomes);
      updateDashboard();

      hideLoading();
    })
    .withFailureHandler(function(err) {
      hideLoading();
      Swal.fire({ icon: 'error', title: 'โหลดข้อมูลไม่สำเร็จ', text: err.message });
    })
    .getInitialData();
}

// โหลดเฉพาะที่จำเป็น (หลังบันทึก)
function refreshAll() {
  google.script.run
    .withSuccessHandler(function(data) {
      AppState.setupItems = data.setupItems || [];
      AppState.globalExpenses = data.expenses || [];
      AppState.globalIncomes = data.incomes || [];

      renderExpenseOptions(AppState.setupItems);
      renderIncomeOptions(data.incomeSetupItems);
      renderExpenseTables(AppState.globalExpenses);
      renderIncomeTable(AppState.globalIncomes);
      updateDashboard();
    })
    .getInitialData();
}

// ============================================================
// Setup & Triggers
// ============================================================
function runSetup() {
  Swal.fire({ title: 'กำลังตั้งค่าระบบ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  google.script.run
    .withSuccessHandler(function(msg) {
      toast('success', msg);
      refreshAll();
    })
    .withFailureHandler(err => Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message }))
    .setupSystem();
}

function setupTrigger() {
  google.script.run
    .withSuccessHandler(msg => toast('success', msg))
    .withFailureHandler(err => Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.message }))
    .createMonthlyTrigger();
}

// ============================================================
// Datalist
// ============================================================
function renderExpenseOptions(items) {
  const dl = document.getElementById('expenseOptions');
  dl.innerHTML = '';
  (items || []).forEach(item => {
    const opt = document.createElement('option');
    opt.value = item[0];
    dl.appendChild(opt);
  });
}
function renderIncomeOptions(options) {
  const dl = document.getElementById('incomeOptions');
  dl.innerHTML = '';
  (options || []).forEach(o => {
    const opt = document.createElement('option');
    opt.value = o;
    dl.appendChild(opt);
  });
}

function autofillExpenseInfo() {
  const name = document.getElementById('expenseName').value.trim().toLowerCase();
  const found = AppState.setupItems.find(i => String(i[0]).trim().toLowerCase() === name);
  if (found) {
    if (found[1]) document.getElementById('expenseCategory').value = found[1];
    if (found[2] !== undefined && found[2] !== '') document.getElementById('expenseAmount').value = found[2];
  }
}

// ============================================================
// DASHBOARD
// ============================================================
function updateDashboard() {
  let totalInc = 0, totalExp = 0, paidExp = 0, pendingExp = 0;
  const categoryMap = {};

  AppState.globalIncomes.forEach(i => totalInc += Number(i.amount) || 0);
  AppState.globalExpenses.forEach(i => {
    const amt = Number(i.amount) || 0;
    totalExp += amt;
    if (i.status === 'จ่ายแล้ว') paidExp += amt; else pendingExp += amt;
    const cat = i.category || 'ทั่วไป';
    categoryMap[cat] = (categoryMap[cat] || 0) + amt;
  });

  const net = totalInc - totalExp;
  animateValue('dashIncome', totalInc);
  animateValue('dashExpense', totalExp);
  animateValue('dashPending', pendingExp);
  animateValue('dashNet', net);

  const netEl = document.getElementById('dashNet');
  netEl.style.color = net < 0 ? '#dc2626' : '#2563eb';

  renderCharts(totalInc, totalExp, paidExp, pendingExp, categoryMap);
}

function animateValue(id, val) {
  document.getElementById(id).textContent = formatNumber(val);
}

function renderCharts(incVal, expVal, paidVal, pendingVal, categoryMap) {
  const commonOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600 },
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
  };

  const c1 = document.getElementById('incVsExpChart').getContext('2d');
  if (AppState.charts.incVsExp) AppState.charts.incVsExp.destroy();
  AppState.charts.incVsExp = new Chart(c1, {
    type: 'doughnut',
    data: {
      labels: ['รายรับ', 'รายจ่าย'],
      datasets: [{ data: [incVal, expVal], backgroundColor: ['#16a34a', '#dc2626'], borderWidth: 0 }]
    },
    options: commonOpts
  });

  const c2 = document.getElementById('statusChart').getContext('2d');
  if (AppState.charts.status) AppState.charts.status.destroy();
  AppState.charts.status = new Chart(c2, {
    type: 'doughnut',
    data: {
      labels: ['จ่ายแล้ว', 'รอจ่าย'],
      datasets: [{ data: [paidVal, pendingVal], backgroundColor: ['#2563eb', '#d97706'], borderWidth: 0 }]
    },
    options: commonOpts
  });

  const c3 = document.getElementById('categoryChart').getContext('2d');
  if (AppState.charts.category) AppState.charts.category.destroy();
  AppState.charts.category = new Chart(c3, {
    type: 'bar',
    data: {
      labels: Object.keys(categoryMap),
      datasets: [{ label: 'ยอดเงิน', data: Object.values(categoryMap), backgroundColor: '#1e3a8a', borderRadius: 6 }]
    },
    options: {
      ...commonOpts,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 10 } } } }
    }
  });
}

// ============================================================
// EXPENSES
// ============================================================
function renderExpenseTables(expenses) {
  const pendingTbody = document.getElementById('pendingTableBody');
  const paidTbody    = document.getElementById('paidTableBody');
  const pendingMobile = document.getElementById('pendingMobileList');
  const paidMobile    = document.getElementById('paidMobileList');

  pendingTbody.innerHTML = paidTbody.innerHTML = '';
  pendingMobile.innerHTML = paidMobile.innerHTML = '';

  if (!expenses || expenses.length === 0) {
    const empty = '<tr><td colspan="5" class="text-center text-muted py-4">ไม่มีรายการ</td></tr>';
    pendingTbody.innerHTML = empty;
    paidTbody.innerHTML = empty;
    pendingMobile.innerHTML = '<div class="text-center text-muted py-4">ไม่มีรายการ</div>';
    paidMobile.innerHTML = '<div class="text-center text-muted py-4">ไม่มีรายการ</div>';
    return;
  }

  expenses.forEach(item => {
    const amount = Number(item.amount) || 0;
    const cat = item.category || 'ทั่วไป';
    const isPaid = item.status === 'จ่ายแล้ว';

    // Desktop row
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(item.date)}</td>
      <td class="fw-semibold">${escapeHtml(item.name)}</td>
      <td><span class="badge bg-light text-primary border">${escapeHtml(cat)}</span></td>
      <td class="text-end fw-bold ${isPaid ? 'text-success' : 'text-danger'}">${formatNumber(amount)}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-warning text-white me-1" onclick="editExpense('${item.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteExpenseItem('${item.id}')"><i class="fas fa-trash"></i></button>
      </td>`;

    // Mobile card
    const div = document.createElement('div');
    div.className = 'mobile-item';
    div.innerHTML = `
      <div class="row-1">
        <div>
          <div class="item-name">${escapeHtml(item.name)}</div>
          <div class="text-muted small mt-1"><i class="far fa-calendar me-1"></i>${escapeHtml(item.date)}</div>
        </div>
        <div class="item-amount expense">-${formatNumber(amount)}</div>
      </div>
      <div class="row-2 mt-2">
        <span class="item-badge">${escapeHtml(cat)}</span>
        <div class="item-actions">
          <button class="btn btn-sm btn-warning text-white" onclick="editExpense('${item.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteExpenseItem('${item.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;

    if (isPaid) { paidTbody.appendChild(tr); paidMobile.appendChild(div); }
    else       { pendingTbody.appendChild(tr); pendingMobile.appendChild(div); }
  });
}

// Submit Expense
document.getElementById('expenseForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const item = {
    id: document.getElementById('expenseId').value,
    date: document.getElementById('expenseDate').value,
    name: document.getElementById('expenseName').value.trim(),
    category: document.getElementById('expenseCategory').value,
    amount: document.getElementById('expenseAmount').value,
    status: document.getElementById('expenseStatus').value
  };
  Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  google.script.run
    .withSuccessHandler(function(msg) {
      toast('success', msg);
      resetExpenseForm();
      refreshAll();
    })
    .withFailureHandler(err => Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message }))
    .saveExpense(item);
});

function editExpense(id) {
  const item = AppState.globalExpenses.find(x => String(x.id) === String(id));
  if (!item) return;
  document.getElementById('expenseId').value = item.id;
  document.getElementById('expenseDate').value = item.date;
  document.getElementById('expenseName').value = item.name;
  document.getElementById('expenseCategory').value = item.category || 'ทั่วไป';
  document.getElementById('expenseAmount').value = item.amount;
  document.getElementById('expenseStatus').value = item.status;
  document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save me-1"></i>อัปเดต';
  document.getElementById('cancelBtn').style.display = 'block';
  new bootstrap.Tab(document.getElementById('pills-manage-tab')).show();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetExpenseForm() {
  document.getElementById('expenseForm').reset();
  document.getElementById('expenseId').value = '';
  document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('saveBtn').innerHTML = '<i class="fas fa-save me-1"></i>บันทึก';
  document.getElementById('cancelBtn').style.display = 'none';
}

function deleteExpenseItem(id) {
  Swal.fire({
    title: 'ยืนยันการลบ?', text: 'รายการนี้จะถูกลบถาวร',
    icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#dc2626', confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก'
  }).then(r => {
    if (r.isConfirmed) {
      google.script.run
        .withSuccessHandler(() => { toast('success', 'ลบสำเร็จ'); refreshAll(); })
        .deleteExpense(id);
    }
  });
}

// ============================================================
// INCOMES
// ============================================================
function renderIncomeTable(incomes) {
  const tbody = document.getElementById('incomeTableBody');
  const mobile = document.getElementById('incomeMobileList');
  tbody.innerHTML = mobile.innerHTML = '';

  if (!incomes || incomes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">ยังไม่มีรายการรายรับ</td></tr>';
    mobile.innerHTML = '<div class="text-center text-muted py-4">ยังไม่มีรายการรายรับ</div>';
    return;
  }

  incomes.forEach(item => {
    const amount = Number(item.amount) || 0;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(item.date)}</td>
      <td class="fw-semibold">${escapeHtml(item.source)}</td>
      <td class="text-end text-success fw-bold">+${formatNumber(amount)}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-warning text-white me-1" onclick="editIncome('${item.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteIncomeItem('${item.id}')"><i class="fas fa-trash"></i></button>
      </td>`;
    tbody.appendChild(tr);

    const div = document.createElement('div');
    div.className = 'mobile-item';
    div.innerHTML = `
      <div class="row-1">
        <div>
          <div class="item-name">${escapeHtml(item.source)}</div>
          <div class="text-muted small mt-1"><i class="far fa-calendar me-1"></i>${escapeHtml(item.date)}</div>
        </div>
        <div class="item-amount income">+${formatNumber(amount)}</div>
      </div>
      <div class="row-2 mt-2">
        <span class="item-badge">รายรับ</span>
        <div class="item-actions">
          <button class="btn btn-sm btn-warning text-white" onclick="editIncome('${item.id}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" onclick="deleteIncomeItem('${item.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
    mobile.appendChild(div);
  });
}

document.getElementById('incomeForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const item = {
    id: document.getElementById('incomeId').value,
    date: document.getElementById('incomeDate').value,
    source: document.getElementById('incomeSource').value.trim(),
    amount: document.getElementById('incomeAmount').value,
    category: 'รายรับทั่วไป'
  };
  Swal.fire({ title: 'กำลังบันทึก...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  google.script.run
    .withSuccessHandler(function(msg) {
      toast('success', msg);
      resetIncomeForm();
      refreshAll();
    })
    .withFailureHandler(err => Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message }))
    .saveIncome(item);
});

function editIncome(id) {
  const item = AppState.globalIncomes.find(x => String(x.id) === String(id));
  if (!item) return;
  document.getElementById('incomeId').value = item.id;
  document.getElementById('incomeDate').value = item.date;
  document.getElementById('incomeSource').value = item.source;
  document.getElementById('incomeAmount').value = item.amount;
  document.getElementById('saveIncomeBtn').innerHTML = '<i class="fas fa-save me-1"></i>อัปเดต';
  document.getElementById('cancelIncomeBtn').style.display = 'block';
  new bootstrap.Tab(document.getElementById('pills-income-tab')).show();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetIncomeForm() {
  document.getElementById('incomeForm').reset();
  document.getElementById('incomeId').value = '';
  document.getElementById('incomeDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('saveIncomeBtn').innerHTML = '<i class="fas fa-save me-1"></i>บันทึก';
  document.getElementById('cancelIncomeBtn').style.display = 'none';
}

function deleteIncomeItem(id) {
  Swal.fire({
    title: 'ยืนยันการลบ?', text: 'รายการนี้จะถูกลบถาวร',
    icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#dc2626', confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก'
  }).then(r => {
    if (r.isConfirmed) {
      google.script.run
        .withSuccessHandler(() => { toast('success', 'ลบสำเร็จ'); refreshAll(); })
        .deleteIncome(id);
    }
  });
}
