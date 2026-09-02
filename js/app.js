/**
 * app.js — Main Application Orchestrator & State Manager
 * Coordinates CRUD operations, filtering, sorting, data calculations, and event bindings.
 */

(function () {
  'use strict';

  // Application State
  const state = {
    transactions: [],
    filters: {
      type: 'all',
      category: 'all',
      month: 'all',
      search: ''
    },
    sortBy: 'date-desc',
    selectedMonthlyYear: null,
    lastDeletedTransaction: null
  };

  /**
   * Initializes the Application
   */
  function initApp() {
    // 1. Initialize UI components and theme
    UIService.init();

    // 2. Load transactions from localStorage
    state.transactions = StorageService.getTransactions();

    // 3. Bind all user event interactions
    bindEvents();

    // 4. Initial rendering
    refreshApp();
  }

  /**
   * Recalculates totals and refreshes all views
   */
  function refreshApp() {
    // Compute financial summaries on all transactions
    const totals = calculateFinancialTotals(state.transactions);
    UIService.renderKPIs(totals);

    // Update Category Expense Chart
    ChartService.updateCategoryChart(state.transactions);

    // Update Monthly Breakdown Summary
    UIService.renderMonthlySummary(state.transactions, state.selectedMonthlyYear);

    // Update filter dropdown options
    UIService.updateFilterDropdowns(state.transactions, state.filters.category, state.filters.month);

    // Render active filter chips
    UIService.renderActiveFiltersBar(state.filters);

    // Filter & sort transactions for the list view
    const filtered = getFilteredAndSortedTransactions();
    UIService.renderTransactions(filtered, state.transactions.length);
  }

  /**
   * Calculates KPI metrics (Balance, Total Income, Total Expense, Savings Rate)
   */
  function calculateFinancialTotals(transactions) {
    let income = 0;
    let expense = 0;
    let incomeItems = 0;
    let expenseItems = 0;

    transactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      if (t.type === 'income') {
        income += amount;
        incomeItems++;
      } else {
        expense += amount;
        expenseItems++;
      }
    });

    const balance = income - expense;
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;

    return {
      balance,
      income,
      expense,
      incomeItems,
      expenseItems,
      savingsRate
    };
  }

  /**
   * Filters and sorts transactions based on user criteria
   */
  function getFilteredAndSortedTransactions() {
    return state.transactions.filter(t => {
      // Filter by Type
      if (state.filters.type !== 'all' && t.type !== state.filters.type) {
        return false;
      }

      // Filter by Category
      if (state.filters.category !== 'all' && t.category !== state.filters.category) {
        return false;
      }

      // Filter by Month (format YYYY-MM)
      if (state.filters.month !== 'all' && (!t.date || !t.date.startsWith(state.filters.month))) {
        return false;
      }

      // Filter by Search Query (description or category)
      if (state.filters.search.trim() !== '') {
        const query = state.filters.search.toLowerCase();
        const descMatch = (t.description || '').toLowerCase().includes(query);
        const catMatch = (t.category || '').toLowerCase().includes(query);
        if (!descMatch && !catMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      switch (state.sortBy) {
        case 'date-asc':
          return new Date(a.date) - new Date(b.date);
        case 'amount-desc':
          return Number(b.amount) - Number(a.amount);
        case 'amount-asc':
          return Number(a.amount) - Number(b.amount);
        case 'date-desc':
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });
  }

  /**
   * Handles Form Submission (Add or Update)
   */
  function handleFormSubmit(e) {
    e.preventDefault();

    if (!UIService.validateForm()) {
      return;
    }

    const id = UIService.elements.txId.value.trim();
    const typeRadio = UIService.elements.txForm.querySelector('input[name="tx-type"]:checked');
    const type = typeRadio ? typeRadio.value : 'expense';
    const amount = parseFloat(UIService.elements.txAmount.value);
    const date = UIService.elements.txDate.value;
    const category = UIService.elements.txCategory.value;
    const description = UIService.elements.txDescription.value.trim();

    if (id) {
      // Edit existing transaction
      const index = state.transactions.findIndex(t => t.id === id);
      if (index !== -1) {
        state.transactions[index] = {
          ...state.transactions[index],
          type,
          amount,
          date,
          category,
          description
        };
        StorageService.saveTransactions(state.transactions);
        UIService.showToast('Transaction updated successfully', 'success');
      }
    } else {
      // Create new transaction
      const newTransaction = {
        id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
        type,
        amount,
        date,
        category,
        description
      };
      state.transactions.unshift(newTransaction);
      StorageService.saveTransactions(state.transactions);
      UIService.showToast('Transaction added successfully', 'success');
    }

    UIService.closeTransactionModal();
    refreshApp();
  }

  /**
   * Deletes a transaction with Undo notification
   */
  function deleteTransaction(id) {
    const index = state.transactions.findIndex(t => t.id === id);
    if (index === -1) return;

    const [deletedItem] = state.transactions.splice(index, 1);
    state.lastDeletedTransaction = { item: deletedItem, index };
    StorageService.saveTransactions(state.transactions);
    refreshApp();

    // Show toast with Undo action
    UIService.showToast('Transaction deleted', 'info', () => {
      if (state.lastDeletedTransaction) {
        state.transactions.splice(state.lastDeletedTransaction.index, 0, state.lastDeletedTransaction.item);
        StorageService.saveTransactions(state.transactions);
        refreshApp();
        UIService.showToast('Transaction restored', 'success');
        state.lastDeletedTransaction = null;
      }
    });
  }

  /**
   * Binds all DOM Event Listeners
   */
  function bindEvents() {
    // 1. Open Add Transaction Modal
    const openAddModal = () => UIService.openTransactionModal('add');
    document.getElementById('btn-open-modal').addEventListener('click', openAddModal);
    document.getElementById('btn-empty-add').addEventListener('click', openAddModal);

    // 2. Close Modal Buttons
    document.getElementById('btn-modal-close').addEventListener('click', () => UIService.closeTransactionModal());
    document.getElementById('btn-modal-cancel').addEventListener('click', () => UIService.closeTransactionModal());
    UIService.elements.txModal.addEventListener('click', (e) => {
      if (e.target === UIService.elements.txModal) {
        UIService.closeTransactionModal();
      }
    });

    // Delete Modal Cancel
    document.getElementById('btn-delete-cancel').addEventListener('click', () => UIService.closeDeleteModal());
    UIService.elements.deleteModal.addEventListener('click', (e) => {
      if (e.target === UIService.elements.deleteModal) {
        UIService.closeDeleteModal();
      }
    });

    // Keyboard Accessibility: Escape key closes active modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        UIService.closeTransactionModal();
        UIService.closeDeleteModal();
      }
    });

    // 3. Modal Transaction Type Selector
    const typeRadios = UIService.elements.txForm.querySelectorAll('input[name="tx-type"]');
    typeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        const type = e.target.value;
        UIService.updateSegmentedControlUI(type);
        UIService.populateCategorySelect(type);
      });
    });

    // 4. Modal Form Submit
    UIService.elements.txForm.addEventListener('submit', handleFormSubmit);

    // 5. Table & Mobile Card Event Delegation (Edit / Delete)
    const handleActionClick = (e) => {
      const button = e.target.closest('button[data-action]');
      if (!button) return;

      const action = button.dataset.action;
      const id = button.dataset.id;

      if (action === 'edit') {
        const tx = state.transactions.find(t => t.id === id);
        if (tx) {
          UIService.openTransactionModal('edit', tx);
        }
      } else if (action === 'delete') {
        UIService.openDeleteModal(id, (confirmedId) => {
          deleteTransaction(confirmedId);
        });
      }
    };

    UIService.elements.tableBody.addEventListener('click', handleActionClick);
    UIService.elements.mobileCardsList.addEventListener('click', handleActionClick);

    // 6. Type Filter Tabs (All / Income / Expense)
    const tabButtons = document.querySelectorAll('.type-tabs .tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filters.type = btn.dataset.typeFilter;
        refreshApp();
      });
    });

    // 7. Category Filter Dropdown
    UIService.elements.filterCategory.addEventListener('change', (e) => {
      state.filters.category = e.target.value;
      refreshApp();
    });

    // 8. Month Filter Dropdown
    UIService.elements.filterMonth.addEventListener('change', (e) => {
      state.filters.month = e.target.value;
      refreshApp();
    });

    // 9. Sort Dropdown
    UIService.elements.sortBy.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      refreshApp();
    });

    // 10. Search Input with real-time feedback
    let searchDebounce;
    UIService.elements.searchQuery.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      const val = e.target.value;
      UIService.elements.btnClearSearch.classList.toggle('hidden', val.length === 0);

      searchDebounce = setTimeout(() => {
        state.filters.search = val;
        refreshApp();
      }, 150);
    });

    // Clear Search Button
    UIService.elements.btnClearSearch.addEventListener('click', () => {
      UIService.elements.searchQuery.value = '';
      UIService.elements.btnClearSearch.classList.add('hidden');
      state.filters.search = '';
      refreshApp();
      UIService.elements.searchQuery.focus();
    });

    // 11. Reset All Filters Button
    document.getElementById('btn-reset-filters').addEventListener('click', resetFilters);
    document.getElementById('btn-clear-all-chips').addEventListener('click', resetFilters);

    // 12. Active Filter Chip Removal (Event delegation)
    UIService.elements.filterChipsList.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-remove-filter]');
      if (!removeBtn) return;

      const key = removeBtn.dataset.removeFilter;
      if (key === 'type') {
        state.filters.type = 'all';
        tabButtons.forEach(b => b.classList.toggle('active', b.dataset.typeFilter === 'all'));
      } else if (key === 'category') {
        state.filters.category = 'all';
        UIService.elements.filterCategory.value = 'all';
      } else if (key === 'month') {
        state.filters.month = 'all';
        UIService.elements.filterMonth.value = 'all';
      } else if (key === 'search') {
        state.filters.search = '';
        UIService.elements.searchQuery.value = '';
        UIService.elements.btnClearSearch.classList.add('hidden');
      }
      refreshApp();
    });

    // 13. Monthly Breakdown Year Selector
    UIService.elements.monthlyYearSelect.addEventListener('change', (e) => {
      state.selectedMonthlyYear = e.target.value;
      UIService.renderMonthlySummary(state.transactions, state.selectedMonthlyYear);
    });

    // 14. Theme Toggle Button
    UIService.elements.themeToggle.addEventListener('click', () => {
      UIService.toggleTheme();
    });

    // 15. Seed Demo Data Button
    document.getElementById('btn-seed-data').addEventListener('click', () => {
      state.transactions = StorageService.loadDemoData();
      resetFilters();
      refreshApp();
      UIService.showToast('Sample demo transactions loaded', 'success');
    });

    // 16. Export CSV Button
    document.getElementById('btn-export-csv').addEventListener('click', () => {
      const success = StorageService.exportToCSV(state.transactions);
      if (success) {
        UIService.showToast('Transactions exported to CSV', 'success');
      } else {
        UIService.showToast('No transactions to export', 'error');
      }
    });

    // 17. Clear All Data Button
    document.getElementById('btn-clear-all-data').addEventListener('click', () => {
      if (state.transactions.length === 0) {
        UIService.showToast('No transactions to clear', 'info');
        return;
      }
      if (confirm('Are you sure you want to clear all transactions from LocalStorage?')) {
        StorageService.clearAll();
        state.transactions = [];
        resetFilters();
        refreshApp();
        UIService.showToast('All transaction records cleared', 'info');
      }
    });
  }

  /**
   * Resets all search and filter controls to default
   */
  function resetFilters() {
    state.filters.type = 'all';
    state.filters.category = 'all';
    state.filters.month = 'all';
    state.filters.search = '';
    state.sortBy = 'date-desc';

    document.querySelectorAll('.type-tabs .tab-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.typeFilter === 'all');
    });
    UIService.elements.filterCategory.value = 'all';
    UIService.elements.filterMonth.value = 'all';
    UIService.elements.sortBy.value = 'date-desc';
    UIService.elements.searchQuery.value = '';
    UIService.elements.btnClearSearch.classList.add('hidden');
    refreshApp();
  }

  // Launch application when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
