// Initialize variables and load data from local storage
let masterBills = [];
let payCycles = [];
let payCycleStart = new Date();
let payCycleFrequency = 'Fortnightly';
let payCycleIncome = 0;
let customFrequencySettings = null;

// Initialize Material Components - ensures proper component initialization
function initializeMaterialComponents() {
  // Initialize all select elements
  document.querySelectorAll('md-filled-select, md-outlined-select').forEach(select => {
    // Give elements time to render before trying to interact with them
    setTimeout(() => {
      // For selects that need programmatic initialization
      if (select.id === 'payCycleFrequency' && payCycleFrequency) {
        // Use the next microtask to ensure the component is ready
        Promise.resolve().then(() => {
          // Use querySelector to find the option with the appropriate value
          const option = select.querySelector(`md-select-option[value="${payCycleFrequency}"]`);
          if (option) {
            // Specifically set the 'selected' attribute
            select.querySelectorAll('md-select-option').forEach(opt => {
              opt.removeAttribute('selected');
            });
            option.setAttribute('selected', '');
          }
        });
      }
      
      // Setup change event listeners for selects
      select.addEventListener('change', (e) => {
        if (select.id === 'billFrequency' && select.value === 'Custom') {
          const dialog = document.getElementById('customFrequencyDialog');
          if (dialog) {
            dialog.show();
          }
        }
      });
    }, 200); // Short delay to ensure components are available
  });
  
  // Initialize all text fields
  document.querySelectorAll('md-filled-text-field, md-outlined-text-field').forEach(textField => {
    // Set initial values for specific fields
    setTimeout(() => {
      if (textField.id === 'payCycleStart' && localStorage.getItem('payCycleStart')) {
        textField.value = new Date(localStorage.getItem('payCycleStart')).toISOString().split('T')[0];
      } else if (textField.id === 'payCycleIncome' && localStorage.getItem('payCycleIncome')) {
        textField.value = parseFloat(localStorage.getItem('payCycleIncome'));
      }
    }, 200);
  });
  
  // Initialize dialog
  const customFrequencyDialog = document.getElementById('customFrequencyDialog');
  if (customFrequencyDialog) {
    // Make sure dialog is properly configured
    customFrequencyDialog.addEventListener('closed', (event) => {
      // Cleanup after dialog closes
      console.log('Dialog closed');
    });
    
    // Setup dialog buttons
    const cancelBtn = document.getElementById('cancelCustomFrequency');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        customFrequencyDialog.close();
      });
    }
    
    const saveBtn = document.getElementById('saveCustomFrequency');
    if (saveBtn) {
      saveBtn.addEventListener('click', handleSaveCustomFrequency);
    }
  }

  // Initialize snackbar
  const snackbar = document.getElementById('snackbar');
  if (snackbar) {
    // Set up close button
    const closeButton = document.getElementById('snackbar-close');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        snackbar.close();
      });
    }
  }
  
  // Setup buttons
  setupButtonListeners();
}

// Set up all button event listeners
function setupButtonListeners() {
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Set Pay Cycle button
  const setPayCycleBtn = document.getElementById('setPayCycleBtn');
  if (setPayCycleBtn) {
    setPayCycleBtn.addEventListener('click', setPayCycle);
  }
  
  // Add Bill button
  const addBillBtn = document.getElementById('addBillBtn');
  if (addBillBtn) {
    addBillBtn.addEventListener('click', addBill);
  }
  
  // Export Data button
  const exportDataBtn = document.getElementById('exportDataBtn');
  if (exportDataBtn) {
    exportDataBtn.addEventListener('click', exportData);
  }
  
  // Import Data button
  const importDataBtn = document.getElementById('importDataBtn');
  if (importDataBtn) {
    importDataBtn.addEventListener('click', triggerImportDialog);
  }
  
  // Toggle Master List button
  const toggleMasterListBtn = document.getElementById('toggleMasterList');
  if (toggleMasterListBtn) {
    toggleMasterListBtn.addEventListener('click', function() {
      const container = document.getElementById('masterListContainer');
      const isHidden = container.style.display === 'none';
      container.style.display = isHidden ? 'block' : 'none';
      
      // Update icon
      const iconElem = this.querySelector('md-icon');
      if (iconElem) {
        iconElem.textContent = isHidden ? 'visibility_off' : 'visibility';
      }
    });
  }
  
  // Toggle All Cycles button
  const toggleAllCyclesBtn = document.getElementById('toggleAllCycles');
  if (toggleAllCyclesBtn) {
    toggleAllCyclesBtn.addEventListener('click', function() {
      const allContents = document.querySelectorAll('.cycle-content');
      const allButtons = document.querySelectorAll('.cycle-toggle');
      const isCollapsed = toggleAllCyclesBtn.querySelector('md-icon').textContent === 'unfold_less';
      
      // Update all cycle contents
      allContents.forEach(content => {
        content.classList.toggle('hidden', isCollapsed);
      });
      
      // Update all toggle buttons
      allButtons.forEach(button => {
        const iconElem = button.querySelector('md-icon');
        if (iconElem) {
          iconElem.textContent = isCollapsed ? 'expand_more' : 'expand_less';
        }
        button.classList.toggle('collapsed', isCollapsed);
      });
      
      // Update the main toggle button
      const iconElem = toggleAllCyclesBtn.querySelector('md-icon');
      if (iconElem) {
        iconElem.textContent = isCollapsed ? 'unfold_more' : 'unfold_less';
      }
    });
  }
  
  // Import file input change handler
  const importFileInput = document.getElementById('importFileInput');
  if (importFileInput) {
    importFileInput.addEventListener('change', importData);
  }
  
  // Setup weekday buttons for custom frequency
  document.querySelectorAll('.weekday-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // Toggle selected state
      if (this.hasAttribute('selected')) {
        this.removeAttribute('selected');
      } else {
        this.setAttribute('selected', '');
      }
    });
  });
  
  // Setup custom frequency unit dropdown
  const customFrequencyUnit = document.getElementById('customFrequencyUnit');
  if (customFrequencyUnit) {
    customFrequencyUnit.addEventListener('change', () => {
      const weekdaySelector = document.getElementById('weekdaySelector');
      if (weekdaySelector) {
        weekdaySelector.style.display = customFrequencyUnit.value === 'weeks' ? 'block' : 'none';
      }
    });
  }
}

// Trigger file input dialog for import
function triggerImportDialog() {
  document.getElementById('importFileInput').click();
}

// Import data from a JSON file
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    try {
      // Parse the JSON data
      const importedData = JSON.parse(e.target.result);
      
      // Validate the data structure
      if (!importedData.billData) {
        throw new Error('Invalid data format: Missing bill data');
      }
      
      // Confirm import
      if (confirm('This will replace your current data. Are you sure you want to proceed?')) {
        // Store the imported data in localStorage
        if (importedData.payCycleStart) {
          localStorage.setItem('payCycleStart', importedData.payCycleStart);
        }
        
        if (importedData.payCycleFrequency) {
          localStorage.setItem('payCycleFrequency', importedData.payCycleFrequency);
        }
        
        if (importedData.payCycleIncome) {
          localStorage.setItem('payCycleIncome', importedData.payCycleIncome);
        }
        
        if (importedData.billData) {
          localStorage.setItem('billData', importedData.billData);
        }
        
        // Reload the page to apply changes
        showSnackbar('Data imported successfully! Reloading...');
        setTimeout(() => {
          location.reload();
        }, 1500);
      }
    } catch (error) {
      alert('Error importing data: ' + error.message);
      console.error('Import error:', error);
    }
  };
  
  reader.readAsText(file);
  
  // Clear the file input so the same file can be selected again
  event.target.value = '';
}

// Theme handling
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  
  // Update toggle button icon
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const iconElem = themeToggle.querySelector('md-icon');
    if (iconElem) {
      iconElem.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    }
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  
  // Update chart with new theme colors
  setTimeout(() => {
    if (window.financialChart) {
      window.financialChart.destroy();
    }
    window.financialChart = createFinancialChart();
  }, 200);
}

/**
 * Normalizes a date by removing time components
 * @param {Date} date - The date to normalize
 * @returns {Date} - Normalized date set to 12:00:00
 */
function normalizeDate(date) {
  const normalized = new Date(date);
  normalized.setHours(12, 0, 0, 0);
  return normalized;
}

/**
 * Creates a date object with consistent formatting from a string
 * @param {string} dateStr - Date string in format DD/MM/YYYY or YYYY-MM-DD
 * @returns {Date} - JavaScript Date object
 */
function parseFormattedDate(dateStr) {
  if (dateStr.includes('/')) {
    // Handle dates in the format DD/MM/YYYY
    const [day, month, year] = dateStr.split('/').map(Number);
    return normalizeDate(new Date(year, month - 1, day));
  } else {
    // Handle ISO format YYYY-MM-DD
    return normalizeDate(new Date(dateStr));
  }
}

/**
 * Gets the last day of a specific month
 * @param {number} year - The year
 * @param {number} month - The month (0-11)
 * @returns {number} - The last day of the month
 */
function getLastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Finds the next occurrence of a specific day of the week
 * @param {Date} date - Starting date
 * @param {number} dayOfWeek - Day of week (0-6, where 0 is Sunday)
 * @returns {Date} - Date of the next occurrence
 */
function getNextDayOfWeek(date, dayOfWeek) {
  const result = new Date(date);
  result.setDate(result.getDate() + (7 + dayOfWeek - result.getDay()) % 7);
  return normalizeDate(result);
}

/**
 * Advances a date by a specific number of days
 * @param {Date} date - The original date
 * @param {number} days - Number of days to add
 * @returns {Date} - The new date
 */
function advanceDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return normalizeDate(result);
}

/**
 * Advances a date by a specific number of weeks
 * @param {Date} date - The original date
 * @param {number} weeks - Number of weeks to add
 * @returns {Date} - The new date
 */
function advanceWeeks(date, weeks) {
  return advanceDays(date, weeks * 7);
}

/**
 * Advances a date by a specific number of years
 * @param {Date} date - The original date
 * @param {number} years - Number of years to add
 * @returns {Date} - The new date
 */
function advanceYears(date, years) {
  const result = new Date(date);
  
  // Store original values
  const originalDay = result.getDate();
  const originalMonth = result.getMonth();
  
  // Set the new year
  result.setFullYear(result.getFullYear() + years);
  
  // Handle Feb 29 in non-leap years
  if (originalMonth === 1 && originalDay === 29 && result.getMonth() !== 1) {
    result.setDate(28);
  }
  
  return normalizeDate(result);
}

/**
 * Formats a date as YYYY-MM-DD for consistent storage
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDateForStorage(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Determines if a date is within an inclusive date range
 * @param {Date} date - The date to check
 * @param {Date} startDate - Range start (inclusive)
 * @param {Date} endDate - Range end (inclusive)
 * @returns {boolean} - True if date is within range
 */
function isDateInRange(date, startDate, endDate) {
  const normalizedDate = normalizeDate(date);
  const normalizedStart = normalizeDate(startDate);
  const normalizedEnd = normalizeDate(endDate);
  
  return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
}

/**
 * Determines the date category for a bill based on its original date
 * @param {Date|string} originalDate - The original date of the bill
 * @returns {string} - The date category ('day28', 'day29', 'day30', 'day31', or 'normal')
 */
function determineDateCategory(originalDate) {
  // Ensure we have a Date object
  const date = (typeof originalDate === 'string') 
    ? new Date(originalDate) 
    : new Date(originalDate);
  
  const day = date.getDate();
  
  // Categorize based on day of month
  if (day === 31) {
    return 'day31';
  } else if (day === 30) {
    return 'day30';
  } else if (day === 29) {
    return 'day29';
  } else if (day === 28) {
    return 'day28';
  } else {
    return 'normal';
  }
}

/**
 * Advances a date by a specific number of months with dedicated handling for each date category
 * @param {Date} date - The date to advance
 * @param {number} months - Number of months to add
 * @param {string} category - The date category ('day28', 'day29', 'day30', 'day31', or 'normal')
 * @returns {Date} - The new date after advancing
 */
function advanceMonthsByCategory(date, months, category) {
  const originalDate = new Date(date);
  let targetYear = originalDate.getFullYear();
  let targetMonth = originalDate.getMonth() + months;
  
  // Adjust year based on target month
  targetYear += Math.floor(targetMonth / 12);
  targetMonth = targetMonth % 12;
  
  // Get the last day of the target month
  const targetLastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  
  let targetDay;
  
  // Apply category-specific rules
  switch (category) {
    case 'day31':
      // Day 31 bills always go to the last day of the month
      targetDay = targetLastDay;
      break;
      
    case 'day30':
      // Day 30 bills stay on 30th if possible, otherwise last day
      targetDay = (targetLastDay >= 30) ? 30 : targetLastDay;
      break;
      
    case 'day29':
      // Day 29 bills stay on 29th if possible, otherwise last day
      targetDay = (targetLastDay >= 29) ? 29 : targetLastDay;
      break;
      
    case 'day28':
      // Day 28 bills always stay on 28th
      targetDay = 28;
      break;
      
    case 'normal':
    default:
      // Normal bills keep their day unless it exceeds the month's length
      targetDay = Math.min(originalDate.getDate(), targetLastDay);
      break;
  }
  
  // Create new date with normalized time
  return normalizeDate(new Date(targetYear, targetMonth, targetDay));
}

/**
 * Assigns a date category to a bill and stores it
 * @param {Object} bill - The bill object
 */
function categorizeBill(bill) {
  // Only add category if it doesn't exist
  if (!bill.dateCategory) {
    const date = (typeof bill.date === 'string') 
      ? new Date(bill.date) 
      : new Date(bill.date);
    
    bill.dateCategory = determineDateCategory(date);
  }
  
  return bill;
}

/**
 * Calculates the next occurrence of a bill based on its frequency and date category
 * @param {Object} bill - The bill object (with dateCategory property)
 * @param {Date} currentDate - Current date to calculate from
 * @returns {Date} - Next occurrence date
 */
function calculateNextBillDate(bill, currentDate) {
  // Ensure the bill has a date category
  const categorizedBill = categorizeBill(bill);
  const current = new Date(currentDate);
  
  switch (categorizedBill.frequency) {
    case 'Monthly':
      return advanceMonthsByCategory(current, 1, categorizedBill.dateCategory);
      
    case 'Fortnightly':
      return advanceDays(current, 14);
      
    case 'Yearly':
      return advanceMonthsByCategory(current, 12, categorizedBill.dateCategory);
      
    case '6-Monthly':
      return advanceMonthsByCategory(current, 6, categorizedBill.dateCategory);
      
    case 'Custom':
      if (!categorizedBill.customFrequency) return null;
      
      const cf = categorizedBill.customFrequency;
      
      if (cf.unit === 'days') {
        return advanceDays(current, cf.value);
      } else if (cf.unit === 'weeks') {
        const nextDate = advanceWeeks(current, cf.value);
        
        // Handle specific days of week if specified
        if (cf.days && cf.days.length > 0) {
          // Find the next matching day of week
          for (let i = 0; i < 7; i++) {
            const checkDate = advanceDays(nextDate, i);
            if (cf.days.includes(checkDate.getDay())) {
              return checkDate;
            }
          }
        }
        
        return nextDate;
      } else if (cf.unit === 'months') {
        return advanceMonthsByCategory(current, cf.value, categorizedBill.dateCategory);
      } else if (cf.unit === 'years') {
        return advanceMonthsByCategory(current, cf.value * 12, categorizedBill.dateCategory);
      }
      
      return null;
      
    case 'Every 1 weeks on Mo':
      return getNextDayOfWeek(advanceDays(current, 1), 1); // 1 = Monday
      
    case 'One-Off':
      return null;
      
    default:
      console.warn(`Unknown frequency: ${categorizedBill.frequency}`);
      return null;
  }
}

/**
 * Generate pay cycles with bills assigned to their correct dates
 */
function generatePayCycles() {
  payCycles = [];
  let cycleStart = normalizeDate(new Date(payCycleStart));
  
  // Initialize master bills with categories
  masterBills.forEach(categorizeBill);
  
  // Generate pay cycles
  for (let i = 0; i < 29; i++) {
    let cycleEnd;
    
    // Set cycle end date based on frequency
    if (payCycleFrequency === 'Monthly') {
      // For monthly cycles, need to use the categorical approach
      const category = 'normal'; // Normal day handling for cycle dates
      cycleEnd = advanceMonthsByCategory(cycleStart, 1, category);
      // Adjust back by 1 day to not overlap with next cycle
      cycleEnd.setDate(cycleEnd.getDate() - 1);
    } else { // Fortnightly
      cycleEnd = new Date(cycleStart);
      cycleEnd.setDate(cycleStart.getDate() + 14 - 1); // -1 to avoid overlap
    }
    
    // Normalize the end date (remove time component)
    cycleEnd = normalizeDate(cycleEnd);
    
    let cycleBills = [];
    
    // Process each bill
    masterBills.forEach(bill => {
      // Ensure the bill has a category
      const categorizedBill = categorizeBill(bill);
      
      // Parse the original bill date with our consistent formatter
      let originalBillDate;
      
      // Check if the date is already in the right format (for bills from master list)
      if (typeof categorizedBill.date === 'string' && categorizedBill.date.includes('/')) {
        originalBillDate = parseFormattedDate(categorizedBill.date);
      } else {
        originalBillDate = normalizeDate(new Date(categorizedBill.date));
      }
      
      // For first cycle, start with the original date
      let currentBillDate = new Date(originalBillDate);
      
      // For subsequent cycles, find the right occurrence within this cycle
      if (i > 0) {
        // Start with the original date
        currentBillDate = new Date(originalBillDate);
        
        // Keep advancing the date until we reach or pass the cycle start
        while (currentBillDate < cycleStart) {
          // Use the categorical approach for calculating next date
          const nextDate = calculateNextBillDate(categorizedBill, currentBillDate);
          
          if (!nextDate) {
            // Handle one-off bills
            if (categorizedBill.frequency === 'One-Off') {
              // One-off bill should only appear in its specific cycle
              break;
            } else {
              // Unknown frequency or calculation error
              console.warn(`Could not calculate next date for bill: ${categorizedBill.name}`);
              break;
            }
          }
          
          currentBillDate = nextDate;
        }
      }
      
      // After finding the right occurrence for this cycle, check if it falls within the cycle
      // Use inclusive comparison for both start and end dates
      if (isDateInRange(currentBillDate, cycleStart, cycleEnd)) {
        // Convert to a format safe for storage with consistent timezone handling
        const formattedDate = formatDateForStorage(currentBillDate);
        
        cycleBills.push({
          ...categorizedBill,
          date: formattedDate,
          // Store original day for debugging
          _originalDay: originalBillDate.getDate()
        });
      }
      
      // For weekly or fortnightly bills, check for additional occurrences within this cycle
      if (categorizedBill.frequency === 'Fortnightly' || 
          categorizedBill.frequency === 'Every 1 weeks on Mo' || 
          (categorizedBill.frequency === 'Custom' && categorizedBill.customFrequency && categorizedBill.customFrequency.unit === 'weeks')) {
        
        // Use the categorical approach for calculating next date
        let nextDate = calculateNextBillDate(categorizedBill, currentBillDate);
        
        // Keep adding occurrences as long as they fall within this cycle
        while (nextDate && isDateInRange(nextDate, cycleStart, cycleEnd)) {
          const formattedNextDate = formatDateForStorage(nextDate);
          
          // Add this occurrence to the cycle
          cycleBills.push({
            ...categorizedBill,
            date: formattedNextDate,
            _originalDay: originalBillDate.getDate()
          });
          
          // Calculate the next occurrence using the categorical approach
          nextDate = calculateNextBillDate(categorizedBill, nextDate);
        }
      }
    });
    
    // Add this cycle to our pay cycles
    payCycles.push({
      cycleStart: cycleStart.toDateString(),
      cycleEnd: cycleEnd.toDateString(),
      bills: cycleBills,
      income: payCycleIncome
    });
    
    // Next cycle starts where this one ended plus one day
    cycleStart = advanceDays(cycleEnd, 1);
  }
  
  updatePayCycles();
}

// Function to create the financial chart
function createFinancialChart() {
  // If the financialChart element doesn't exist, return
  const chartElement = document.getElementById('financialChart');
  if (!chartElement) return null;
  
  const ctx = chartElement.getContext('2d');
  
  // Check if payCycles is empty
  if (!payCycles || payCycles.length === 0) {
    return null;
  }
  
  // Extract data from pay cycles
  const labels = payCycles.map((cycle, index) => `Cycle ${index + 1}`);
  const incomeData = payCycles.map(cycle => cycle.income);
  const expensesData = payCycles.map(cycle => cycle.bills.reduce((sum, bill) => sum + bill.amount, 0));
  const balanceData = payCycles.map((cycle, index) => 
    incomeData[index] - expensesData[index]
  );
  
  // Only show the first 12 cycles for better visibility
  const displayCount = Math.min(12, labels.length);
  
  // Get theme-based colors
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const gridColor = currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const textColor = currentTheme === 'dark' ? '#e9ecef' : '#1e2329';
  
  // Create chart
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.slice(0, displayCount),
      datasets: [
        {
          label: 'Income',
          data: incomeData.slice(0, displayCount),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        },
        {
          label: 'Expenses',
          data: expensesData.slice(0, displayCount),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1
        },
        {
          label: 'Balance',
          data: balanceData.slice(0, displayCount),
          type: 'line',
          fill: false,
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          tension: 0.1,
          pointBackgroundColor: function(context) {
            const index = context.dataIndex;
            const value = context.dataset.data[index];
            return value >= 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)';
          }
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Amount ($)',
            color: textColor
          },
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor
          }
        },
        x: {
          title: {
            display: true,
            text: 'Pay Cycles',
            color: textColor
          },
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: 'Financial Overview Across Pay Cycles',
          color: textColor,
          font: {
            size: 16
          }
        },
        legend: {
          labels: {
            color: textColor
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('en-US', { 
                  style: 'currency', 
                  currency: 'USD' 
                }).format(context.parsed.y);
              }
              return label;
            }
          }
        }
      }
    }
  });
  
  return chart;
}

// Handle save custom frequency action
function handleSaveCustomFrequency() {
  const valueField = document.getElementById('customFrequencyValue');
  const unitField = document.getElementById('customFrequencyUnit');
  
  const value = parseInt(valueField.value) || 1;
  const unit = unitField.value;
  
  let selectedDays = [];
  
  if (unit === 'weeks') {
    document.querySelectorAll('.weekday-btn[selected]').forEach(btn => {
      selectedDays.push(parseInt(btn.dataset.day));
    });
    if (selectedDays.length === 0) {
      // If no days selected, use the current day of the week
      selectedDays.push(new Date().getDay());
    }
  }
  
  customFrequencySettings = {
    value: value,
    unit: unit,
    days: selectedDays
  };
  
  // Get a descriptive text for the frequency dropdown
  let customText = `Custom: Every ${value} ${unit}`;
  if (unit === 'weeks' && selectedDays.length > 0) {
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    customText += ` on ${selectedDays.map(d => dayNames[d]).join(', ')}`;
  }
  
  // Update the custom option text
  const billFrequency = document.getElementById('billFrequency');
  if (billFrequency) {
    // Find and update the Custom option
    const options = billFrequency.querySelectorAll('md-select-option');
    options.forEach(option => {
      if (option.value === 'Custom') {
        const headline = option.querySelector('[slot="headline"]');
        if (headline) {
          headline.textContent = customText;
        }
      }
    });
  }
  
  // Close the dialog
  const dialog = document.getElementById('customFrequencyDialog');
  if (dialog) {
    dialog.close();
  }
}

// Show a temporary snackbar message
function showSnackbar(message) {
  const snackbar = document.getElementById('snackbar');
  if (!snackbar) return;
  
  // Set snackbar text
  const msgElement = document.getElementById('snackbar-message');
  if (msgElement) {
    msgElement.textContent = message;
  }
  
  // Show the snackbar
  snackbar.show();
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    snackbar.close();
  }, 3000);
}

// Add a new bill to the master list
function addBill() {
  const nameField = document.getElementById("billName");
  const amountField = document.getElementById("billAmount");
  const dateField = document.getElementById("billDate");
  const frequencyField = document.getElementById("billFrequency");
  const groupField = document.getElementById("billGroup");
  
  let name = nameField.value;
  let amount = parseFloat(amountField.value);
  let date = dateField.value;
  
  // Get values from Material components
  let frequency = frequencyField.value;
  let group = groupField.value;
  
  if (name && amount && date && frequency && group) {
    // For custom frequency, save the settings with the bill
    let billData = { name, amount, date, frequency, group };
    
    if (frequency === 'Custom' && customFrequencySettings) {
      billData.customFrequency = customFrequencySettings;
    }
    
    masterBills.push(billData);
    localStorage.setItem('billData', JSON.stringify(masterBills));
    
    // Clear form fields
    nameField.value = "";
    amountField.value = "";
    customFrequencySettings = null;
    
    updateMasterList();
    generatePayCycles();
    
    // Show success feedback
    showSnackbar("Bill added successfully!");
  } else {
    alert("Please fill in all fields");
  }
}

// Update the displayed master bill list
function updateMasterList() {
  let list = document.getElementById("masterList");
  list.innerHTML = "";
  
  masterBills.forEach((bill, index) => {
    // Create frequency description for display
    let frequencyDisplay = bill.frequency;
    if (bill.frequency === 'Custom' && bill.customFrequency) {
      const cf = bill.customFrequency;
      frequencyDisplay = `Every ${cf.value} ${cf.unit}`;
      if (cf.unit === 'weeks' && cf.days && cf.days.length > 0) {
        const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        frequencyDisplay += ` on ${cf.days.map(d => dayNames[d]).join(', ')}`;
      }
    }
    
    // Parse date safely regardless of format
    let billDate;
    if (typeof bill.date === 'string' && bill.date.includes('/')) {
      // Handle DD/MM/YYYY format
      const [day, month, year] = bill.date.split('/').map(Number);
      billDate = new Date(year, month - 1, day);
    } else {
      // Handle ISO format YYYY-MM-DD
      billDate = new Date(bill.date + 'T12:00:00Z');
    }
    
    // Create list item for Material Design list
    const listItem = document.createElement('div');
    listItem.className = 'custom-list-item';
    
    listItem.innerHTML = `
      <div class="bill-details">
        <strong>${bill.name}</strong>
        <div class="bill-subtext">${billDate.toLocaleDateString()} (${frequencyDisplay})</div>
      </div>
      <span class="bill-amount">$${bill.amount.toFixed(2)}</span>
    `;
    
    // Create delete button
    const deleteButton = document.createElement('md-icon-button');
    deleteButton.innerHTML = '<md-icon>delete</md-icon>';
    deleteButton.setAttribute('aria-label', 'Delete bill');
    
    deleteButton.addEventListener('click', function() {
      if (confirm(`Are you sure you want to delete "${bill.name}"?`)) {
        masterBills.splice(index, 1);
        localStorage.setItem('billData', JSON.stringify(masterBills));
        updateMasterList();
        generatePayCycles();
        showSnackbar("Bill deleted");
      }
    });
    
    listItem.appendChild(deleteButton);
    list.appendChild(listItem);
  });
}

// Set the pay cycle parameters
function setPayCycle() {
  const startField = document.getElementById('payCycleStart');
  const frequencyField = document.getElementById('payCycleFrequency');
  const incomeField = document.getElementById('payCycleIncome');
  
  let start = startField.value;
  let frequency = frequencyField.value;
  let income = parseFloat(incomeField.value);
  
  if (start && !isNaN(income)) {
    payCycleStart = new Date(start);
    payCycleFrequency = frequency;
    payCycleIncome = income;
    localStorage.setItem('payCycleStart', payCycleStart.toISOString());
    localStorage.setItem('payCycleFrequency', payCycleFrequency);
    localStorage.setItem('payCycleIncome', payCycleIncome.toString());
    generatePayCycles();
    showSnackbar("Pay cycle updated!");
  } else {
    alert("Please select a start date and enter valid income");
  }
}

// Update the displayed pay cycles
function updatePayCycles() {
  let cyclesDiv = document.getElementById("payCycles");
  cyclesDiv.innerHTML = "";
  
  // Add controls for past cycles
  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'pay-cycles-controls';
  
  const togglePastBtn = document.createElement('md-filled-tonal-button');
  togglePastBtn.id = 'togglePastCycles';
  togglePastBtn.innerHTML = `
    <md-icon slot="icon">visibility</md-icon>
    <span>Show Past Cycles</span>
  `;
  togglePastBtn.addEventListener('click', function() {
    const currentState = localStorage.getItem('showPastCycles') === 'true';
    togglePastPayCycles(!currentState);
  });
  
  controlsDiv.appendChild(togglePastBtn);
  cyclesDiv.appendChild(controlsDiv);
  
  payCycles.forEach((cycle, index) => {
    // Calculate financial details
    let total = cycle.bills.reduce((sum, bill) => sum + bill.amount, 0);
    let balance = cycle.income - total;
    let balanceClass = balance >= 0 ? 'positive-balance' : 'negative-balance';
    
    // Create pay cycle container
    let cycleContainer = document.createElement("div");
    cycleContainer.className = "pay-cycle";
    
    // Store cycle dates as data attributes for easy access
    cycleContainer.dataset.cycleStart = cycle.cycleStart;
    cycleContainer.dataset.cycleEnd = cycle.cycleEnd;
    
    // Create cycle header
    let cycleHeader = document.createElement("div");
    cycleHeader.className = "cycle-header";
    
    // Format dates nicely
    const startDate = new Date(cycle.cycleStart);
    const endDate = new Date(cycle.cycleEnd);
    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const formattedStartDate = startDate.toLocaleDateString(undefined, dateOptions);
    const formattedEndDate = endDate.toLocaleDateString(undefined, dateOptions);
    
    // Add content to header
    let headerContent = document.createElement("div");
    headerContent.innerHTML = `
      <h3>${index + 1} (${formattedStartDate} - ${formattedEndDate})</h3>
      <div class="financial-info">
        <p>Income: <span>${cycle.income.toFixed(2)}</span></p>
        <p>Expenses: <span>${total.toFixed(2)}</span></p>
        <p class="${balanceClass}">Balance: <span>${balance.toFixed(2)}</span></p>
      </div>
    `;
    
    // Add toggle button with Material icon
    let toggleButton = document.createElement("md-icon-button");
    toggleButton.className = "cycle-toggle";
    toggleButton.innerHTML = '<md-icon>expand_more</md-icon>';
    
    if (index !== 0) {
      toggleButton.classList.add("collapsed");
    }
    
    // Add elements to header
    cycleHeader.appendChild(headerContent);
    cycleHeader.appendChild(toggleButton);
    
    // Create cycle content
    let cycleContent = document.createElement("div");
    cycleContent.className = "cycle-content";
    if (index !== 0) {
      cycleContent.classList.add("hidden"); // Only first cycle open by default
    }
    
    // Group bills by their group
    let groupedBills = {};
    cycle.bills.forEach(bill => {
      if (!groupedBills[bill.group]) {
        groupedBills[bill.group] = [];
      }
      groupedBills[bill.group].push(bill);
    });
    
    // Create a list for each group
    for (let group in groupedBills) {
      let groupTotal = groupedBills[group].reduce((sum, bill) => sum + bill.amount, 0);
      
      let groupHeader = document.createElement("h4");
      groupHeader.innerHTML = `${group} <span>${groupTotal.toFixed(2)}</span>`;
      cycleContent.appendChild(groupHeader);
      
      let billsList = document.createElement("div");
      billsList.className = "bills-list";
      
      groupedBills[group].forEach(bill => {
        let billItem = document.createElement("div");
        billItem.className = "custom-list-item";
        
        const billDate = new Date(bill.date + 'T12:00:00Z');
        
        billItem.innerHTML = `
          <div class="bill-details">
            <strong>${bill.name}</strong>
            <div class="bill-subtext">${billDate.toLocaleDateString()}</div>
          </div>
          <span class="bill-amount">$${bill.amount.toFixed(2)}</span>
        `;
        billsList.appendChild(billItem);
      });
      
      cycleContent.appendChild(billsList);
    }
    
    // Add click handler to toggle button
    toggleButton.addEventListener('click', function(e) {
      e.stopPropagation(); // Prevent header click from triggering
      
      const isHidden = !cycleContent.classList.contains('hidden');
      cycleContent.classList.toggle('hidden');
      
      // Update toggle icon
      const iconElem = this.querySelector('md-icon');
      iconElem.textContent = isHidden ? 'expand_more' : 'expand_less';
      
      this.classList.toggle('collapsed');
    });
    
    // Add click handler to header
    cycleHeader.addEventListener('click', function() {
      const isHidden = !cycleContent.classList.contains('hidden');
      cycleContent.classList.toggle('hidden');
      
      // Update toggle icon
      const iconElem = toggleButton.querySelector('md-icon');
      iconElem.textContent = isHidden ? 'expand_more' : 'expand_less';
      
      toggleButton.classList.toggle('collapsed');
    });
    
    // Add elements to pay cycle container
    cycleContainer.appendChild(cycleHeader);
    cycleContainer.appendChild(cycleContent);
    
    // Add pay cycle to container
    cyclesDiv.appendChild(cycleContainer);
  });
  
  // Apply past cycle visibility based on saved preference
  const showPastCycles = localStorage.getItem('showPastCycles') === 'true';
  togglePastPayCycles(showPastCycles);
  
  // Update financial chart
  if (window.financialChart) {
    try {
      window.financialChart.destroy();
    } catch (error) {
      console.log("Chart couldn't be destroyed, creating a new one");
    }
  }
  
  // Wrap chart creation in a try-catch block
  try {
    window.financialChart = createFinancialChart();
  } catch (error) {
    console.error("Error creating chart:", error);
  }
}

// Export data to a JSON file
function exportData() {
  // Create data object with all stored information
  const exportData = {
    payCycleStart: localStorage.getItem('payCycleStart'),
    payCycleFrequency: localStorage.getItem('payCycleFrequency'),
    payCycleIncome: localStorage.getItem('payCycleIncome'),
    billData: localStorage.getItem('billData')
  };

  // Convert to JSON string
  const dataStr = JSON.stringify(exportData, null, 2);
  
  // Create a Blob with the data
  const blob = new Blob([dataStr], { type: 'application/json' });
  
  // Create a temporary link element
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  
  // Generate filename with current date
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  a.download = `bill_management_export_${dateStr}.json`;
  
  // Trigger download
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
  
  showSnackbar('Data exported successfully!');
}

/**
 * Toggle visibility of past pay cycles
 * @param {boolean} show - Whether to show or hide past pay cycles
 */
function togglePastPayCycles(show) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const payCyclesDiv = document.getElementById("payCycles");
  const payCycleElements = payCyclesDiv.querySelectorAll('.pay-cycle');
  
  // Track if we have past cycles
  let hasPastCycles = false;
  
  payCycleElements.forEach((cycleElement, index) => {
    // Get the cycle end date from the data attribute we'll add
    const cycleEndDateStr = cycleElement.dataset.cycleEnd;
    if (!cycleEndDateStr) return;
    
    const cycleEndDate = new Date(cycleEndDateStr);
    
    // If this cycle has ended (end date is before today)
    if (cycleEndDate < today) {
      hasPastCycles = true;
      cycleElement.style.display = show ? 'block' : 'none';
      // Add a visual indicator for past cycles when shown
      if (show) {
        cycleElement.classList.add('past-cycle');
        // Add animation class if needed
        cycleElement.classList.add('showing');
        // Remove animation class after animation completes
        setTimeout(() => {
          cycleElement.classList.remove('showing');
        }, 300);
      } else {
        cycleElement.classList.remove('past-cycle');
      }
    }
  });
  
  // Update button text based on current state
  const toggleBtn = document.getElementById('togglePastCycles');
  if (toggleBtn) {
    const iconElem = toggleBtn.querySelector('md-icon');
    
    if (show) {
      iconElem.textContent = 'visibility_off';
      toggleBtn.querySelector('span').textContent = 'Hide Past Cycles';
    } else {
      iconElem.textContent = 'visibility';
      toggleBtn.querySelector('span').textContent = 'Show Past Cycles';
    }
  }
  
  // Show/hide the button based on whether past cycles exist
  if (toggleBtn) {
    toggleBtn.style.display = hasPastCycles ? 'flex' : 'none';
  }
  
  // Save the current state
  localStorage.setItem('showPastCycles', show ? 'true' : 'false');
}

// Window load event handlers
window.onload = function() {
  // Initialize Material Components
  initializeMaterialComponents();
  
  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
  
  // Load saved data from local storage
  let storedData = localStorage.getItem('billData');
  if (storedData) {
    masterBills = JSON.parse(storedData);
  }
  
  updateMasterList();
  generatePayCycles();
  
  // Create financial chart after everything is loaded
  setTimeout(() => {
    window.financialChart = createFinancialChart();
  }, 500);
};

// Default to hiding past cycles on first load
document.addEventListener('DOMContentLoaded', function() {
  if (localStorage.getItem('showPastCycles') === null) {
    localStorage.setItem('showPastCycles', 'false');
  }
});