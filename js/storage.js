/**
 * storage.js — LocalStorage Manager & Data Utilities
 * Handles persistence, default demo transactions, data export/import, and theme preferences.
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'trackwise_transactions_v2',
  THEME: 'trackwise_theme_pref',
  FIRST_RUN: 'trackwise_has_visited_v2'
};

// Standard Predefined Categories with icons/emojis and types
const CATEGORIES = {
  income: [
    { id: 'Salary', name: 'Salary', icon: '💼' },
    { id: 'Freelance', name: 'Freelance & Consulting', icon: '💻' },
    { id: 'Investments', name: 'Investments & Dividends', icon: '📈' },
    { id: 'Gifts', name: 'Gifts & Grants', icon: '🎁' },
    { id: 'Rental Income', name: 'Rental Income', icon: '🏠' },
    { id: 'Other Income', name: 'Other Income', icon: '💰' }
  ],
  expense: [
    { id: 'Housing', name: 'Housing & Rent', icon: '🏡' },
    { id: 'Groceries', name: 'Groceries & Supermarket', icon: '🛒' },
    { id: 'Dining Out', name: 'Restaurants & Dining', icon: '🍽️' },
    { id: 'Utilities', name: 'Utilities & Bills', icon: '⚡' },
    { id: 'Transportation', name: 'Transportation & Fuel', icon: '🚗' },
    { id: 'Healthcare', name: 'Healthcare & Medical', icon: '🏥' },
    { id: 'Entertainment', name: 'Entertainment & Leisure', icon: '🎬' },
    { id: 'Shopping', name: 'Shopping & Electronics', icon: '🛍️' },
    { id: 'Education', name: 'Education & Courses', icon: '📚' },
    { id: 'Travel', name: 'Travel & Vacations', icon: '✈️' },
    { id: 'Other Expense', name: 'Other Expense', icon: '💳' }
  ]
};

// Initial realistic demo transactions in Indian Rupee (INR)
const DEMO_TRANSACTIONS = [
  {
    id: 'demo-1',
    type: 'income',
    amount: 75000.00,
    category: 'Salary',
    date: '2026-09-01',
    description: 'Monthly Software Engineer Salary'
  },
  {
    id: 'demo-2',
    type: 'expense',
    amount: 18000.00,
    category: 'Housing',
    date: '2026-09-02',
    description: 'Apartment Monthly Rent'
  },
  {
    id: 'demo-3',
    type: 'expense',
    amount: 4500.00,
    category: 'Groceries',
    date: '2026-09-02',
    description: 'Weekly Organic Grocery Run'
  },
  {
    id: 'demo-4',
    type: 'income',
    amount: 25000.00,
    category: 'Freelance',
    date: '2026-08-28',
    description: 'UI/UX Design Consultation project'
  },
  {
    id: 'demo-5',
    type: 'expense',
    amount: 2200.00,
    category: 'Utilities',
    date: '2026-08-25',
    description: 'High-speed Fiber Internet & Electricity Bill'
  },
  {
    id: 'demo-6',
    type: 'expense',
    amount: 1850.00,
    category: 'Dining Out',
    date: '2026-08-22',
    description: 'Dinner with family at Restaurant'
  },
  {
    id: 'demo-7',
    type: 'expense',
    amount: 3000.00,
    category: 'Transportation',
    date: '2026-08-18',
    description: 'Petrol & Metro Smart Card Recharge'
  },
  {
    id: 'demo-8',
    type: 'income',
    amount: 5500.00,
    category: 'Investments',
    date: '2026-08-15',
    description: 'Quarterly Mutual Fund & Stock Dividends'
  },
  {
    id: 'demo-9',
    type: 'expense',
    amount: 1499.00,
    category: 'Entertainment',
    date: '2026-08-10',
    description: 'Cinema Tickets & OTT Subscriptions'
  },
  {
    id: 'demo-10',
    type: 'expense',
    amount: 1250.00,
    category: 'Healthcare',
    date: '2026-08-04',
    description: 'Prescription Medicines & Health Supplements'
  }
];

const StorageService = {
  /**
   * Retrieves all transactions from localStorage.
   * Auto-seeds demo data on first visit for seamless evaluation.
   */
  getTransactions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) {
        // First run check
        const hasVisited = localStorage.getItem(STORAGE_KEYS.FIRST_RUN);
        if (!hasVisited) {
          this.saveTransactions(DEMO_TRANSACTIONS);
          localStorage.setItem(STORAGE_KEYS.FIRST_RUN, 'true');
          return [...DEMO_TRANSACTIONS];
        }
        return [];
      }
      return JSON.parse(data);
    } catch (err) {
      console.error('Failed to read transactions from LocalStorage:', err);
      return [];
    }
  },

  /**
   * Persists transactions array into localStorage.
   */
  saveTransactions(transactions) {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      return true;
    } catch (err) {
      console.error('Failed to save transactions to LocalStorage:', err);
      return false;
    }
  },

  /**
   * Seeds demo data on demand.
   */
  loadDemoData() {
    this.saveTransactions(DEMO_TRANSACTIONS);
    return [...DEMO_TRANSACTIONS];
  },

  /**
   * Clears all transaction data from localStorage.
   */
  clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      return true;
    } catch (err) {
      console.error('Failed to clear LocalStorage:', err);
      return false;
    }
  },

  /**
   * Theme preferences
   */
  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  },

  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  /**
   * Exports transaction list to downloadable CSV file.
   */
  exportToCSV(transactions) {
    if (!transactions || !transactions.length) {
      return false;
    }

    const headers = ['ID', 'Type', 'Amount', 'Category', 'Date', 'Description'];
    const rows = transactions.map(t => [
      `"${t.id}"`,
      `"${t.type}"`,
      Number(t.amount).toFixed(2),
      `"${t.category.replace(/"/g, '""')}"`,
      `"${t.date}"`,
      `"${t.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expense_tracker_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  }
};

// Expose globally
window.StorageService = StorageService;
window.CATEGORIES = CATEGORIES;
