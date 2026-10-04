/**
 * SIMPLE CALCULATOR — CORE ENGINE & INTERACTION
 * Handles state, precise floating-point math, and full keyboard integration.
 */

class SimpleCalculator {
  constructor(historyElement, currentElement) {
    this.historyElement = historyElement;
    this.currentElement = currentElement;
    this.clear();
  }

  clear() {
    this.currentOperand = '0';
    this.previousOperand = '';
    this.operation = null;
    this.shouldResetScreen = false;
    this.updateDisplay();
  }

  delete() {
    if (this.shouldResetScreen) return;
    if (this.currentOperand === '0') return;

    if (this.currentOperand.length === 1 || (this.currentOperand.length === 2 && this.currentOperand.startsWith('-'))) {
      this.currentOperand = '0';
    } else {
      this.currentOperand = this.currentOperand.slice(0, -1);
    }
    this.updateDisplay();
  }

  appendNumber(number) {
    if (this.shouldResetScreen) {
      this.currentOperand = '';
      this.shouldResetScreen = false;
    }

    // Limit maximum length to 15 digits
    if (this.currentOperand.replace(/[-.]/g, '').length >= 15) return;

    // Handle initial zero replacement
    if (this.currentOperand === '0' && number !== '.') {
      this.currentOperand = number;
    } else {
      this.currentOperand += number;
    }
    this.updateDisplay();
  }

  appendDecimal() {
    if (this.shouldResetScreen) {
      this.currentOperand = '0';
      this.shouldResetScreen = false;
    }

    if (!this.currentOperand.includes('.')) {
      this.currentOperand += '.';
      this.updateDisplay();
    }
  }

  toggleSign() {
    if (this.currentOperand === '0') return;

    if (this.currentOperand.startsWith('-')) {
      this.currentOperand = this.currentOperand.slice(1);
    } else {
      this.currentOperand = '-' + this.currentOperand;
    }
    this.updateDisplay();
  }

  percent() {
    const current = parseFloat(this.currentOperand);
    if (isNaN(current)) return;

    // If there is an active operation (e.g. 100 + 10%), calculate percentage of previous operand
    if (this.previousOperand !== '' && this.operation) {
      const prev = parseFloat(this.previousOperand);
      this.currentOperand = this.formatResult((prev * current) / 100);
    } else {
      this.currentOperand = this.formatResult(current / 100);
    }
    this.updateDisplay();
  }

  chooseOperation(op) {
    if (this.currentOperand === 'Error' || this.currentOperand === 'Cannot divide by 0') {
      this.clear();
      return;
    }

    if (this.previousOperand !== '') {
      this.compute();
    }

    this.operation = op;
    this.previousOperand = this.currentOperand;
    this.shouldResetScreen = true;
    this.updateDisplay();
  }

  compute() {
    let result;
    const prev = parseFloat(this.previousOperand);
    const current = parseFloat(this.currentOperand);

    if (isNaN(prev) || isNaN(current)) return;

    switch (this.operation) {
      case '+':
        result = prev + current;
        break;
      case '-':
        result = prev - current;
        break;
      case '×':
      case '*':
        result = prev * current;
        break;
      case '÷':
      case '/':
        if (current === 0) {
          this.currentOperand = 'Cannot divide by 0';
          this.previousOperand = '';
          this.operation = null;
          this.shouldResetScreen = true;
          this.updateDisplay();
          return;
        }
        result = prev / current;
        break;
      default:
        return;
    }

    // Format clean representation
    this.historyElement.textContent = `${this.formatDisplayNumber(prev)} ${this.operation} ${this.formatDisplayNumber(current)} =`;
    this.currentOperand = this.formatResult(result);
    this.operation = null;
    this.previousOperand = '';
    this.shouldResetScreen = true;
    this.updateDisplay(true); // skip history overwrite
  }

  formatResult(num) {
    if (!isFinite(num)) return 'Error';

    // Round to 10 decimal places to eliminate floating point quirks like 0.1 + 0.2
    const precision = 10;
    const fixed = parseFloat(num.toFixed(precision));
    return fixed.toString();
  }

  formatDisplayNumber(numberStr) {
    if (typeof numberStr === 'number') numberStr = numberStr.toString();
    if (numberStr === 'Cannot divide by 0' || numberStr === 'Error') return numberStr;

    const parts = numberStr.split('.');
    const integerPart = parseFloat(parts[0]);
    const decimalPart = parts[1];

    let formattedInt = '';
    if (isNaN(integerPart)) {
      formattedInt = parts[0] === '-' ? '-' : '';
    } else {
      formattedInt = integerPart.toLocaleString('en-US');
    }

    if (decimalPart !== undefined) {
      return `${formattedInt}.${decimalPart}`;
    }
    return formattedInt;
  }

  updateDisplay(skipHistory = false) {
    if (this.currentOperand === 'Cannot divide by 0' || this.currentOperand === 'Error') {
      this.currentElement.textContent = this.currentOperand;
    } else {
      this.currentElement.textContent = this.formatDisplayNumber(this.currentOperand);
    }

    // Adjust font size dynamically to prevent overflow
    const length = this.currentElement.textContent.length;
    this.currentElement.classList.remove('shrink-small', 'shrink-xsmall');
    if (length > 12) {
      this.currentElement.classList.add('shrink-xsmall');
    } else if (length > 8) {
      this.currentElement.classList.add('shrink-small');
    }

    if (!skipHistory) {
      if (this.operation != null) {
        this.historyElement.textContent = `${this.formatDisplayNumber(this.previousOperand)} ${this.operation}`;
      } else {
        this.historyElement.textContent = '';
      }
    }
  }
}

/* --------------------------------------------------------------------------
   Initialization & Event Listeners
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const historyDisplay = document.getElementById('history-display');
  const currentDisplay = document.getElementById('current-display');
  const calculator = new SimpleCalculator(historyDisplay, currentDisplay);

  // Keypad click handlers
  const numberButtons = document.querySelectorAll('[data-number]');
  numberButtons.forEach(button => {
    button.addEventListener('click', () => {
      calculator.appendNumber(button.getAttribute('data-number'));
      animateButton(button);
    });
  });

  const operatorButtons = document.querySelectorAll('[data-operator]');
  operatorButtons.forEach(button => {
    button.addEventListener('click', () => {
      calculator.chooseOperation(button.getAttribute('data-operator'));
      animateButton(button);
    });
  });

  // Action Buttons
  const clearBtn = document.getElementById('key-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      calculator.clear();
      animateButton(clearBtn);
    });
  }

  const deleteBtn = document.getElementById('key-delete');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      calculator.delete();
      animateButton(deleteBtn);
    });
  }

  const percentBtn = document.getElementById('key-percent');
  if (percentBtn) {
    percentBtn.addEventListener('click', () => {
      calculator.percent();
      animateButton(percentBtn);
    });
  }

  const decimalBtn = document.getElementById('key-decimal');
  if (decimalBtn) {
    decimalBtn.addEventListener('click', () => {
      calculator.appendDecimal();
      animateButton(decimalBtn);
    });
  }

  const signBtn = document.getElementById('key-sign');
  if (signBtn) {
    signBtn.addEventListener('click', () => {
      calculator.toggleSign();
      animateButton(signBtn);
    });
  }

  const equalsBtn = document.getElementById('key-equals');
  if (equalsBtn) {
    equalsBtn.addEventListener('click', () => {
      calculator.compute();
      animateButton(equalsBtn);
    });
  }

  // Keyboard Support
  window.addEventListener('keydown', (e) => {
    // Numbers 0 - 9
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      calculator.appendNumber(e.key);
      highlightKey(`[data-number="${e.key}"]`);
    }

    // Decimal Point
    if (e.key === '.') {
      e.preventDefault();
      calculator.appendDecimal();
      highlightKey('#key-decimal');
    }

    // Addition
    if (e.key === '+') {
      e.preventDefault();
      calculator.chooseOperation('+');
      highlightKey('#key-add');
    }

    // Subtraction
    if (e.key === '-') {
      e.preventDefault();
      calculator.chooseOperation('-');
      highlightKey('#key-subtract');
    }

    // Multiplication (* or x)
    if (e.key === '*' || e.key.toLowerCase() === 'x') {
      e.preventDefault();
      calculator.chooseOperation('×');
      highlightKey('#key-multiply');
    }

    // Division (/)
    if (e.key === '/') {
      e.preventDefault();
      calculator.chooseOperation('÷');
      highlightKey('#key-divide');
    }

    // Equals (Enter or =)
    if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      calculator.compute();
      highlightKey('#key-equals');
    }

    // Delete / Backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      calculator.delete();
      highlightKey('#key-delete');
    }

    // Clear (Escape or c / C)
    if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
      e.preventDefault();
      calculator.clear();
      highlightKey('#key-clear');
    }

    // Percentage (%)
    if (e.key === '%') {
      e.preventDefault();
      calculator.percent();
      highlightKey('#key-percent');
    }
  });

  // Theme Toggle
  initThemeToggle();
});

/* Visual Feedback on button press */
function animateButton(btn) {
  if (!btn) return;
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 120);
}

function highlightKey(selector) {
  const btn = document.querySelector(selector);
  if (btn) {
    animateButton(btn);
  }
}

/* Theme Toggle (Dark / Light) */
function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (!toggleBtn) return;

  const savedTheme = localStorage.getItem('calc_theme') || 'dark';
  applyTheme(savedTheme);

  toggleBtn.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark-theme');
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
  });

  function applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
      localStorage.setItem('calc_theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
      localStorage.setItem('calc_theme', 'dark');
    }
  }
}
