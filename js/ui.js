/**
 * ui.js — User Interface Controller & DOM Renderer
 * Handles rendering, modals, toast alerts, form validation, and responsive transitions.
 */

const UIService = {
  // DOM Elements cache
  elements: {},

  init() {
    this.elements = {
      // Modals
      txModal: document.getElementById('transaction-modal'),
      txForm: document.getElementById('transaction-form'),
      txModalTitle: document.getElementById('modal-title'),
      txModalSubtitle: document.getElementById('modal-subtitle'),
      txModalSubmitBtn: document.getElementById('btn-modal-submit'),
      deleteModal: document.getElementById('delete-modal'),
      btnDeleteConfirm: document.getElementById('btn-delete-confirm'),
      btnDeleteCancel: document.getElementById('btn-delete-cancel'),

      // Inputs
      txId: document.getElementById('tx-id'),
      txAmount: document.getElementById('tx-amount'),
      txDate: document.getElementById('tx-date'),
      txCategory: document.getElementById('tx-category'),
      txDescription: document.getElementById('tx-description'),
      descCharCount: document.getElementById('desc-char-count'),

      // Error fields
      amountError: document.getElementById('amount-error'),
      dateError: document.getElementById('date-error'),
      categoryError: document.getElementById('category-error'),
      descriptionError: document.getElementById('description-error'),

      // Summary KPIs
      netBalance: document.getElementById('net-balance'),
      balanceBadge: document.getElementById('balance-status-badge'),
      totalIncome: document.getElementById('total-income'),
      totalExpense: document.getElementById('total-expense'),
      incomeCount: document.getElementById('income-count'),
      expenseCount: document.getElementById('expense-count'),
      savingsRate: document.getElementById('savings-rate'),
      savingsProgress: document.getElementById('savings-progress'),
      savingsSubtext: document.getElementById('savings-subtext'),

      // Transactions display
      tableBody: document.getElementById('transactions-table-body'),
      mobileCardsList: document.getElementById('mobile-cards-list'),
      emptyState: document.getElementById('empty-state'),
      emptyHeading: document.getElementById('empty-state-heading'),
      emptyText: document.getElementById('empty-state-text'),
      txCountPill: document.getElementById('transactions-count-pill'),
      footerStats: document.getElementById('footer-stats'),

      // Filters
      searchQuery: document.getElementById('search-query'),
      btnClearSearch: document.getElementById('btn-clear-search'),
      filterCategory: document.getElementById('filter-category'),
      filterMonth: document.getElementById('filter-month'),
      sortBy: document.getElementById('sort-by'),
      activeFiltersBar: document.getElementById('active-filters-bar'),
      filterChipsList: document.getElementById('filter-chips-list'),

      // Monthly Summary
      monthlyYearSelect: document.getElementById('monthly-year-select'),
      monthlySummaryList: document.getElementById('monthly-summary-list'),

      // Toasts
      toastContainer: document.getElementById('toast-container'),

      // Theme
      themeToggle: document.getElementById('theme-toggle')
    };

    this.bindValidationListeners();
    this.initTheme();
  },

  /**
   * Currency formatter utility
   */
  formatCurrency(num) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(num) || 0);
  },

  /**
   * Date formatter (e.g. "Sep 02, 2026")
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  },

  /**
   * Renders the 4 Financial KPI Summary Cards
   */
  renderKPIs(totals) {
    const { balance, income, expense, incomeItems, expenseItems, savingsRate } = totals;

    // Balance
    this.elements.netBalance.textContent = this.formatCurrency(balance);
    if (balance > 0) {
      this.elements.balanceBadge.textContent = 'Surplus';
      this.elements.balanceBadge.className = 'badge badge-positive';
    } else if (balance < 0) {
      this.elements.balanceBadge.textContent = 'Deficit';
      this.elements.balanceBadge.className = 'badge badge-negative';
    } else {
      this.elements.balanceBadge.textContent = 'Balanced';
      this.elements.balanceBadge.className = 'badge badge-neutral';
    }

    // Income
    this.elements.totalIncome.textContent = this.formatCurrency(income);
    this.elements.incomeCount.textContent = `${incomeItems} item${incomeItems === 1 ? '' : 's'}`;

    // Expense
    this.elements.totalExpense.textContent = this.formatCurrency(expense);
    this.elements.expenseCount.textContent = `${expenseItems} item${expenseItems === 1 ? '' : 's'}`;

    // Savings Rate
    this.elements.savingsRate.textContent = `${savingsRate.toFixed(1)}%`;
    const clampedRate = Math.max(0, Math.min(100, savingsRate));
    this.elements.savingsProgress.style.width = `${clampedRate}%`;

    if (income === 0) {
      this.elements.savingsSubtext.textContent = 'No income recorded';
    } else if (savingsRate < 0) {
      this.elements.savingsSubtext.textContent = 'Spending exceeded earnings';
    } else {
      this.elements.savingsSubtext.textContent = `${clampedRate.toFixed(0)}% of earnings saved`;
    }
  },

  /**
   * Renders the Transactions Table (Desktop) and Mobile Cards
   */
  renderTransactions(transactions, totalCount) {
    const count = transactions.length;
    this.elements.txCountPill.textContent = count;
    this.elements.footerStats.textContent = `Showing ${count} of ${totalCount} transaction${totalCount === 1 ? '' : 's'}`;

    // Empty state check
    if (count === 0) {
      this.elements.tableBody.innerHTML = '';
      this.elements.mobileCardsList.innerHTML = '';
      this.elements.emptyState.classList.remove('hidden');

      if (totalCount === 0) {
        this.elements.emptyHeading.textContent = 'No transactions yet';
        this.elements.emptyText.textContent = 'Click "Add Transaction" or load "Demo Data" to get started.';
      } else {
        this.elements.emptyHeading.textContent = 'No matching transactions';
        this.elements.emptyText.textContent = 'Try adjusting your search query or filter selections.';
      }
      return;
    }

    this.elements.emptyState.classList.add('hidden');

    // Generate Desktop Table Rows
    const tableHtml = transactions.map(t => {
      const isIncome = t.type === 'income';
      const sign = isIncome ? '+' : '-';
      const typeClass = isIncome ? 'type-pill-income' : 'type-pill-expense';
      const amountClass = isIncome ? 'amount-income' : 'amount-expense';

      return `
        <tr data-id="${t.id}">
          <td class="td-date">${this.formatDate(t.date)}</td>
          <td class="td-desc" title="${this.escapeHtml(t.description)}">${this.escapeHtml(t.description)}</td>
          <td class="td-category">
            <span class="category-tag">${this.escapeHtml(t.category)}</span>
          </td>
          <td class="td-type">
            <span class="type-pill ${typeClass}">${isIncome ? 'Income' : 'Expense'}</span>
          </td>
          <td class="td-amount ${amountClass}">${sign}${this.formatCurrency(t.amount)}</td>
          <td class="td-actions">
            <div class="action-buttons">
              <button class="btn-action btn-action-edit" data-action="edit" data-id="${t.id}" title="Edit transaction" aria-label="Edit transaction">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="btn-action btn-action-delete" data-action="delete" data-id="${t.id}" title="Delete transaction" aria-label="Delete transaction">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    this.elements.tableBody.innerHTML = tableHtml;

    // Generate Mobile Cards View
    const mobileHtml = transactions.map(t => {
      const isIncome = t.type === 'income';
      const sign = isIncome ? '+' : '-';
      const typeClass = isIncome ? 'type-pill-income' : 'type-pill-expense';
      const amountClass = isIncome ? 'amount-income' : 'amount-expense';

      return `
        <div class="mobile-card" data-id="${t.id}">
          <div class="mobile-card-header">
            <div>
              <div class="mobile-card-title">${this.escapeHtml(t.description)}</div>
              <div class="mobile-card-date">${this.formatDate(t.date)}</div>
            </div>
            <span class="type-pill ${typeClass}">${isIncome ? 'Income' : 'Expense'}</span>
          </div>
          <div class="mobile-card-body">
            <span class="category-tag">${this.escapeHtml(t.category)}</span>
            <span class="mobile-card-amount ${amountClass}">${sign}${this.formatCurrency(t.amount)}</span>
          </div>
          <div class="mobile-card-footer">
            <span class="card-subtext">ID: ${t.id.slice(-6)}</span>
            <div class="action-buttons">
              <button class="btn-action btn-action-edit" data-action="edit" data-id="${t.id}" title="Edit transaction">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="btn-action btn-action-delete" data-action="delete" data-id="${t.id}" title="Delete transaction">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.elements.mobileCardsList.innerHTML = mobileHtml;
  },

  /**
   * Renders the Monthly Expense Summary List (Bonus)
   */
  renderMonthlySummary(transactions, selectedYear = null) {
    if (!this.elements.monthlySummaryList) return;

    // Extract all unique years
    const yearsSet = new Set();
    transactions.forEach(t => {
      if (t.date) {
        yearsSet.add(t.date.split('-')[0]);
      }
    });

    const years = Array.from(yearsSet).sort((a, b) => b - a);
    const activeYear = selectedYear || years[0] || new Date().getFullYear().toString();

    // Populate Year selector
    this.elements.monthlyYearSelect.innerHTML = years.length > 0 
      ? years.map(y => `<option value="${y}" ${y === activeYear ? 'selected' : ''}>${y}</option>`).join('')
      : `<option value="${new Date().getFullYear()}">${new Date().getFullYear()}</option>`;

    // Group transactions by month for the active year
    const monthlyData = {};
    for (let m = 1; m <= 12; m++) {
      const monthKey = `${activeYear}-${String(m).padStart(2, '0')}`;
      monthlyData[monthKey] = { income: 0, expense: 0, count: 0 };
    }

    transactions.forEach(t => {
      if (t.date && t.date.startsWith(activeYear)) {
        const monthKey = t.date.slice(0, 7);
        if (monthlyData[monthKey]) {
          const amt = Number(t.amount) || 0;
          if (t.type === 'income') {
            monthlyData[monthKey].income += amt;
          } else {
            monthlyData[monthKey].expense += amt;
          }
          monthlyData[monthKey].count++;
        }
      }
    });

    // Filter to months that either have activity or are current/recent
    const activeMonths = Object.entries(monthlyData)
      .filter(([_, data]) => data.count > 0)
      .sort((a, b) => b[0].localeCompare(a[0]));

    if (activeMonths.length === 0) {
      this.elements.monthlySummaryList.innerHTML = `
        <div class="empty-state" style="padding: 2rem 1rem;">
          <p class="empty-desc">No transaction data recorded for ${activeYear}.</p>
        </div>
      `;
      return;
    }

    const html = activeMonths.map(([monthKey, data]) => {
      const [y, m] = monthKey.split('-');
      const monthName = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long' });
      const net = data.income - data.expense;
      const netClass = net >= 0 ? 'badge-positive' : 'badge-negative';

      return `
        <div class="monthly-row">
          <div class="monthly-month">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span>${monthName}</span>
          </div>
          <div class="monthly-meta">
            <span class="monthly-income">+${this.formatCurrency(data.income)}</span>
            <span class="monthly-expense">-${this.formatCurrency(data.expense)}</span>
            <span class="monthly-net badge ${netClass}">Net: ${this.formatCurrency(net)}</span>
          </div>
        </div>
      `;
    }).join('');

    this.elements.monthlySummaryList.innerHTML = html;
  },

  /**
   * Populates filter dropdowns based on available transactions
   */
  updateFilterDropdowns(transactions, currentCategory = 'all', currentMonth = 'all') {
    // Unique categories
    const categoriesSet = new Set(transactions.map(t => t.category).filter(Boolean));
    const categories = Array.from(categoriesSet).sort();

    let categoryOptions = '<option value="all">All Categories</option>';
    categories.forEach(cat => {
      categoryOptions += `<option value="${this.escapeHtml(cat)}" ${cat === currentCategory ? 'selected' : ''}>${this.escapeHtml(cat)}</option>`;
    });
    this.elements.filterCategory.innerHTML = categoryOptions;

    // Unique months
    const monthsSet = new Set(transactions.map(t => t.date ? t.date.slice(0, 7) : null).filter(Boolean));
    const months = Array.from(monthsSet).sort((a, b) => b.localeCompare(a));

    let monthOptions = '<option value="all">All Months</option>';
    months.forEach(m => {
      const [year, month] = m.split('-');
      const label = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthOptions += `<option value="${m}" ${m === currentMonth ? 'selected' : ''}>${label}</option>`;
    });
    this.elements.filterMonth.innerHTML = monthOptions;
  },

  /**
   * Renders active filter indicator chips
   */
  renderActiveFiltersBar(filters) {
    const chips = [];

    if (filters.type && filters.type !== 'all') {
      chips.push({ key: 'type', label: `Type: ${filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}` });
    }
    if (filters.category && filters.category !== 'all') {
      chips.push({ key: 'category', label: `Category: ${filters.category}` });
    }
    if (filters.month && filters.month !== 'all') {
      const [y, m] = filters.month.split('-');
      const label = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      chips.push({ key: 'month', label: `Month: ${label}` });
    }
    if (filters.search && filters.search.trim() !== '') {
      chips.push({ key: 'search', label: `Query: "${filters.search}"` });
    }

    if (chips.length > 0) {
      this.elements.activeFiltersBar.classList.remove('hidden');
      this.elements.filterChipsList.innerHTML = chips.map(c => `
        <span class="filter-chip">
          ${this.escapeHtml(c.label)}
          <span class="chip-remove" data-remove-filter="${c.key}" role="button" aria-label="Remove filter">&times;</span>
        </span>
      `).join('');
    } else {
      this.elements.activeFiltersBar.classList.add('hidden');
      this.elements.filterChipsList.innerHTML = '';
    }
  },

  /**
   * Populates categories in the Add/Edit Modal based on Income/Expense type
   */
  populateCategorySelect(type, selectedCategory = '') {
    const list = CATEGORIES[type] || [];
    this.elements.txCategory.innerHTML = list.map(c => `
      <option value="${c.name}" ${c.name === selectedCategory ? 'selected' : ''}>
        ${c.icon} ${c.name}
      </option>
    `).join('');
  },

  /**
   * Opens the Add/Edit Transaction Modal
   */
  openTransactionModal(mode = 'add', transaction = null) {
    this.clearValidationErrors();
    this.elements.txForm.reset();

    if (mode === 'edit' && transaction) {
      this.elements.txModalTitle.textContent = 'Edit Transaction';
      this.elements.txModalSubtitle.textContent = 'Update transaction details';
      this.elements.txModalSubmitBtn.textContent = 'Update Transaction';
      this.elements.txId.value = transaction.id;

      // Type radio
      const radio = this.elements.txForm.querySelector(`input[name="tx-type"][value="${transaction.type}"]`);
      if (radio) {
        radio.checked = true;
        this.updateSegmentedControlUI(transaction.type);
      }

      this.populateCategorySelect(transaction.type, transaction.category);
      this.elements.txAmount.value = transaction.amount;
      this.elements.txDate.value = transaction.date;
      this.elements.txDescription.value = transaction.description;
      this.elements.descCharCount.textContent = `${transaction.description.length}/80`;
    } else {
      this.elements.txModalTitle.textContent = 'Add Transaction';
      this.elements.txModalSubtitle.textContent = 'Log a new income or expense entry';
      this.elements.txModalSubmitBtn.textContent = 'Save Transaction';
      this.elements.txId.value = '';

      // Default type is expense
      const expenseRadio = this.elements.txForm.querySelector('input[name="tx-type"][value="expense"]');
      if (expenseRadio) expenseRadio.checked = true;
      this.updateSegmentedControlUI('expense');

      this.populateCategorySelect('expense');

      // Default date to today
      const today = new Date().toISOString().slice(0, 10);
      this.elements.txDate.value = today;
      this.elements.descCharCount.textContent = '0/80';
    }

    this.elements.txModal.classList.add('active');
    this.elements.txModal.setAttribute('aria-hidden', 'false');
    setTimeout(() => this.elements.txAmount.focus(), 150);
  },

  closeTransactionModal() {
    this.elements.txModal.classList.remove('active');
    this.elements.txModal.setAttribute('aria-hidden', 'true');
    this.clearValidationErrors();
  },

  /**
   * Delete confirmation modal
   */
  openDeleteModal(id, onConfirm) {
    this.elements.deleteModal.classList.add('active');
    this.elements.deleteModal.setAttribute('aria-hidden', 'false');

    // Remove any prior listeners
    const newConfirm = this.elements.btnDeleteConfirm.cloneNode(true);
    this.elements.btnDeleteConfirm.parentNode.replaceChild(newConfirm, this.elements.btnDeleteConfirm);
    this.elements.btnDeleteConfirm = newConfirm;

    this.elements.btnDeleteConfirm.addEventListener('click', () => {
      this.closeDeleteModal();
      onConfirm(id);
    });
  },

  closeDeleteModal() {
    this.elements.deleteModal.classList.remove('active');
    this.elements.deleteModal.setAttribute('aria-hidden', 'true');
  },

  /**
   * Updates visual highlight on segmented control for Income/Expense
   */
  updateSegmentedControlUI(type) {
    const expenseSegment = document.querySelector('.type-segment.expense-segment');
    const incomeSegment = document.querySelector('.type-segment.income-segment');

    if (type === 'income') {
      incomeSegment.classList.add('active');
      expenseSegment.classList.remove('active');
    } else {
      expenseSegment.classList.add('active');
      incomeSegment.classList.remove('active');
    }
  },

  /**
   * Form validation with real-time feedback
   */
  validateForm() {
    let isValid = true;
    this.clearValidationErrors();

    // 1. Amount
    const amountVal = parseFloat(this.elements.txAmount.value);
    if (!this.elements.txAmount.value.trim()) {
      this.setFieldError(this.elements.txAmount, this.elements.amountError, 'Please enter a valid amount.');
      isValid = false;
    } else if (isNaN(amountVal) || amountVal <= 0) {
      this.setFieldError(this.elements.txAmount, this.elements.amountError, 'Amount must be greater than $0.00.');
      isValid = false;
    } else if (amountVal > 10000000) {
      this.setFieldError(this.elements.txAmount, this.elements.amountError, 'Amount exceeds maximum limit ($10,000,000).');
      isValid = false;
    }

    // 2. Date
    if (!this.elements.txDate.value) {
      this.setFieldError(this.elements.txDate, this.elements.dateError, 'Please select a date.');
      isValid = false;
    }

    // 3. Category
    if (!this.elements.txCategory.value) {
      this.setFieldError(this.elements.txCategory, this.elements.categoryError, 'Please select a category.');
      isValid = false;
    }

    // 4. Description
    const descVal = this.elements.txDescription.value.trim();
    if (!descVal) {
      this.setFieldError(this.elements.txDescription, this.elements.descriptionError, 'Please enter a description.');
      isValid = false;
    } else if (descVal.length < 2) {
      this.setFieldError(this.elements.txDescription, this.elements.descriptionError, 'Description must be at least 2 characters.');
      isValid = false;
    }

    return isValid;
  },

  setFieldError(inputEl, errorEl, message) {
    inputEl.classList.add('is-invalid');
    if (errorEl) errorEl.textContent = message;
  },

  clearValidationErrors() {
    [this.elements.txAmount, this.elements.txDate, this.elements.txCategory, this.elements.txDescription].forEach(el => {
      if (el) el.classList.remove('is-invalid');
    });
    [this.elements.amountError, this.elements.dateError, this.elements.categoryError, this.elements.descriptionError].forEach(el => {
      if (el) el.textContent = '';
    });
  },

  bindValidationListeners() {
    this.elements.txAmount.addEventListener('input', () => {
      this.elements.txAmount.classList.remove('is-invalid');
      this.elements.amountError.textContent = '';
    });

    this.elements.txDate.addEventListener('input', () => {
      this.elements.txDate.classList.remove('is-invalid');
      this.elements.dateError.textContent = '';
    });

    this.elements.txCategory.addEventListener('change', () => {
      this.elements.txCategory.classList.remove('is-invalid');
      this.elements.categoryError.textContent = '';
    });

    this.elements.txDescription.addEventListener('input', (e) => {
      this.elements.txDescription.classList.remove('is-invalid');
      this.elements.descriptionError.textContent = '';
      this.elements.descCharCount.textContent = `${e.target.value.length}/80`;
    });
  },

  /**
   * Toast notification banners
   */
  showToast(message, type = 'success', undoCallback = null) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `
        <svg class="toast-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>`;
    } else if (type === 'error') {
      iconSvg = `
        <svg class="toast-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>`;
    } else {
      iconSvg = `
        <svg class="toast-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`;
    }

    let undoBtnHtml = '';
    if (undoCallback) {
      undoBtnHtml = `<button class="toast-undo-btn">Undo</button>`;
    }

    toast.innerHTML = `
      <div class="toast-content">
        ${iconSvg}
        <span>${this.escapeHtml(message)}</span>
      </div>
      ${undoBtnHtml}
    `;

    if (undoCallback) {
      const undoBtn = toast.querySelector('.toast-undo-btn');
      undoBtn.addEventListener('click', () => {
        undoCallback();
        toast.remove();
      });
    }

    this.elements.toastContainer.appendChild(toast);

    // Auto dismiss after 3.8 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => toast.remove(), 200);
    }, 3800);
  },

  /**
   * Theme initialization & toggling
   */
  initTheme() {
    const savedTheme = StorageService.getTheme();
    document.documentElement.setAttribute('data-theme', savedTheme);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    StorageService.setTheme(newTheme);
    ChartService.updateTheme();
    this.showToast(`Switched to ${newTheme} mode`, 'info');
  },

  /**
   * Security helper: HTML entity escape
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

window.UIService = UIService;
