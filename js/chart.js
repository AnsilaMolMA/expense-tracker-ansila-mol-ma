/**
 * chart.js — Category Expense Data Visualization
 * Integrates Chart.js for responsive doughnut chart of expense categories.
 */

const ChartService = {
  chartInstance: null,

  // Palette of distinct, aesthetic colors for categories
  colors: [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ec4899', // pink
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#14b8a6', // teal
    '#6366f1', // indigo
    '#84cc16', // lime
    '#e11d48', // rose
    '#64748b'  // slate
  ],

  /**
   * Initializes or updates the category expense chart.
   * @param {Array} transactions
   */
  updateCategoryChart(transactions) {
    const canvas = document.getElementById('categoryChart');
    const emptyState = document.getElementById('chart-empty-state');
    const totalBadge = document.getElementById('chart-total-badge');

    if (!canvas) return;

    // Filter only expenses
    const expenses = transactions.filter(t => t.type === 'expense');

    if (expenses.length === 0) {
      if (this.chartInstance) {
        this.chartInstance.destroy();
        this.chartInstance = null;
      }
      canvas.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      if (totalBadge) totalBadge.textContent = 'Total: ₹0.00';
      return;
    }

    // Hide empty state, reveal canvas
    canvas.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');

    // Aggregate expenses by category
    const categoryTotals = {};
    let totalExpenseAmount = 0;

    expenses.forEach(t => {
      const amount = Number(t.amount) || 0;
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amount;
      totalExpenseAmount += amount;
    });

    if (totalBadge) {
      totalBadge.textContent = `Total: ₹${totalExpenseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Sort categories descending by amount
    const sortedCategories = Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1]);

    const labels = sortedCategories.map(item => item[0]);
    const dataValues = sortedCategories.map(item => item[1]);
    const backgroundColors = labels.map((_, i) => this.colors[i % this.colors.length]);

    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js library not available. Fallback visualization active.');
      return;
    }

    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#cbd5e1' : '#475569';
    const isMobile = window.innerWidth < 640;
    const legendPosition = isMobile ? 'bottom' : 'right';

    // If chart already exists, update data directly for smooth transitions
    if (this.chartInstance) {
      this.chartInstance.data.labels = labels;
      this.chartInstance.data.datasets[0].data = dataValues;
      this.chartInstance.data.datasets[0].backgroundColor = backgroundColors;
      this.chartInstance.options.plugins.legend.labels.color = textColor;
      this.chartInstance.options.plugins.legend.position = legendPosition;
      this.chartInstance.options.plugins.legend.labels.padding = isMobile ? 8 : 12;
      this.chartInstance.options.plugins.legend.labels.font.size = isMobile ? 10 : 11;
      this.chartInstance.update();
      return;
    }

    // Otherwise, create new Chart.js instance
    const ctx = canvas.getContext('2d');
    this.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: dataValues,
          backgroundColor: backgroundColors,
          borderWidth: 2,
          borderColor: isDarkMode ? '#141c2e' : '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: isMobile ? '60%' : '68%',
        layout: {
          padding: 6
        },
        plugins: {
          legend: {
            position: legendPosition,
            labels: {
              boxWidth: 10,
              padding: isMobile ? 8 : 12,
              color: textColor,
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: isMobile ? 10 : 11,
                weight: '600'
              }
            }
          },
          tooltip: {
            backgroundColor: isDarkMode ? '#1e293b' : '#0f172a',
            titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '700' },
            bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                const value = context.parsed || 0;
                const percentage = totalExpenseAmount > 0 
                  ? ((value / totalExpenseAmount) * 100).toFixed(1)
                  : 0;
                return ` ₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 400
        }
      }
    });

    // Auto-update legend position on window resize
    if (!this._resizeAttached) {
      this._resizeAttached = true;
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          if (this.chartInstance) {
            const mobileNow = window.innerWidth < 640;
            const newPos = mobileNow ? 'bottom' : 'right';
            if (this.chartInstance.options.plugins.legend.position !== newPos) {
              this.chartInstance.options.plugins.legend.position = newPos;
              this.chartInstance.options.plugins.legend.labels.padding = mobileNow ? 8 : 12;
              this.chartInstance.options.plugins.legend.labels.font.size = mobileNow ? 10 : 11;
              this.chartInstance.options.cutout = mobileNow ? '60%' : '68%';
              this.chartInstance.update();
            }
          }
        }, 200);
      });
    }
  },

  /**
   * Resets chart colors when theme toggles
   */
  updateTheme() {
    if (this.chartInstance) {
      const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
      const textColor = isDarkMode ? '#cbd5e1' : '#475569';
      this.chartInstance.data.datasets[0].borderColor = isDarkMode ? '#141c2e' : '#ffffff';
      this.chartInstance.options.plugins.legend.labels.color = textColor;
      this.chartInstance.update();
    }
  }
};

window.ChartService = ChartService;
