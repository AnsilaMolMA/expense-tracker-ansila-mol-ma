# TrackWise — Personal Expense Tracker Web Application

> A modern, responsive, zero-dependency personal expense tracker web application built with vanilla HTML5, CSS3, and JavaScript. Featuring real-time financial metrics, interactive data visualizations, multi-criteria filtering, inline form validation, and browser LocalStorage persistence.

---

## 📋 Features Checklist

### Core Requirements
- [x] **Add Income & Expense Transactions**: Seamless modal form capturing Type (Income/Expense), Amount, Category, Date, and Description.
- [x] **Edit & Delete Transactions**: Dedicated edit workflow with pre-populated form values; delete flow with confirmation modal and **Undo** toast banner.
- [x] **Financial Overview & Metrics**: Real-time calculation of:
  - **Net Current Balance** with dynamic surplus/deficit status badges.
  - **Total Income** and transaction count.
  - **Total Expenses** and transaction count.
  - **Savings Rate (%)** indicator and progress gauge.
- [x] **Comprehensive Filtering & Sorting**:
  - Filter by Type: *All*, *Income*, or *Expense* with tabbed switches.
  - Filter by Category: Dropdown dynamically reflecting available transaction categories.
  - Filter by Month: Multi-month historical breakdown.
  - Real-time Search: Live debounced search querying descriptions and categories.
  - Sorting: By Date (Newest/Oldest) and Amount (Highest/Lowest).
  - Active filter chips with one-click individual or global reset.
- [x] **LocalStorage Persistence**:
  - Automatically loads and saves all transactions in browser storage.
  - Pre-seeded realistic demo dataset on first visit for instant review.
  - On-demand "Demo Data" button and "Clear All Data" action.
  - **Export to CSV** utility for offline spreadsheet analysis.
- [x] **Responsive Mobile & Desktop Design**:
  - Fluid desktop layout featuring side-by-side analytics and data tables.
  - Dedicated mobile card view for screens under 768px with touch-friendly tap targets.
  - Dark Mode and Light Mode with saved user preference.

### Optional Bonus Features
- [x] **Interactive Category-wise Expense Chart**: Doughnut chart visualizing expense distributions by category with percentage tooltips (powered by Chart.js).
- [x] **Monthly Expense Summary**: Calendar year breakdown displaying total income, expenses, and net balance month-by-month.
- [x] **Robust Form Validation**: Real-time error messages for empty inputs, negative or zero amounts, character count limits, and invalid dates.

---

## 🚀 How to Run the Application

Because this application is built with standard vanilla web technologies (HTML, CSS, JavaScript), it requires **no build tools, compilers, or package installations**.

### Method 1: Direct File Open (Easiest)
1. Navigate to the project directory:
   ```bash
   expense-tracker-ansila-mol-ma/
   ```
2. Double-click **`index.html`** or right-click and select **Open with Google Chrome** (or Edge / Firefox / Safari).

### Method 2: Using Python Simple HTTP Server
If you have Python installed:
```bash
# In the project directory:
python -m http.server 8000
```
Open your browser at `http://localhost:8000`.

### Method 3: Using VS Code Live Server
1. Open the project folder in Visual Studio Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.

### Method 4: Using Node.js / npx
```bash
npx serve .
```

---

## 📂 Project Structure

```
expense-tracker-ansila-mol-ma/
├── index.html              # Semantic HTML5 markup, accessible modal dialogs, dashboard layout
├── css/
│   └── styles.css          # CSS custom variables, light & dark theme, responsive grid/flexbox, transitions
├── js/
│   ├── storage.js          # LocalStorage CRUD, demo dataset seeder, CSV exporter, theme persistence
│   ├── chart.js            # Chart.js doughnut chart integration and theme color coordinator
│   ├── ui.js               # DOM rendering, modal manager, validation messages, toast notifications
│   └── app.js              # State manager, event listeners, sorting, filtering, and summary calculations
├── README.md               # Project documentation and submission instructions
└── .gitignore              # Ignored files (OS, IDE, logs)
```

---

## 💡 Technical Design Highlights

- **Separation of Concerns**: Modular JavaScript design divides data persistence (`storage.js`), visualization (`chart.js`), DOM rendering/validation (`ui.js`), and business logic (`app.js`).
- **Zero-Flicker Persistence**: Storage calls happen synchronously before UI updates so state is always consistent.
- **Micro-Interactions**: Features CSS transitions for buttons, card elevation on hover, modal backdrop blurs, and animated toast alerts.
- **Accessible & Safe**: Uses proper `aria-*` tags, HTML escaping to prevent XSS, keyboard navigation (`Escape` key to close modals), and high-contrast color palettes.
