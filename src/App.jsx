import React, { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';

// Exact categories matching the spreadsheet rows with dedicated vibrant dark-mode colors
const CATEGORIES = [
  { id: 'meals', name: '餐費', emoji: '🍔', color: '#f97316' },
  { id: 'coffee', name: '咖啡飲料', emoji: '☕', color: '#d97706' },
  { id: 'beauty', name: '衣服鞋子美容保養', emoji: '🛍️', color: '#ec4899' },
  { id: 'transport', name: '運輸交通', emoji: '🚗', color: '#3b82f6' },
  { id: 'household', name: '居家生活用品', emoji: '🏠', color: '#10b981' },
  { id: 'medical', name: '醫療/保健', emoji: '💊', color: '#ef4444' },
  { id: 'fitness', name: '健身運動/按摩', emoji: '🏋️', color: '#8b5cf6' },
  { id: 'entertainment', name: '休閒娛樂', emoji: '🎬', color: '#06b6d4' },
  { id: 'digital', name: '3C/電子產品', emoji: '💻', color: '#6366f1' },
  { id: 'charity', name: '公益', emoji: '❤️', color: '#f43f5e' },
  { id: 'others', name: '其他', emoji: '➕', color: '#94a3b8' }
];

const FALLBACK_CATEGORY = {
  id: 'unmatched',
  name: '其他',
  emoji: '💰',
  color: '#94a3b8'
};

const getCategoryMeta = (categoryName) => {
  return CATEGORIES.find(c => c.name === categoryName) || {
    ...FALLBACK_CATEGORY,
    name: categoryName || '其他'
  };
};

// Date conversion helpers between API (yyyy/MM/dd) and HTML input (yyyy-MM-dd)
const apiDateToInputDate = (apiDate) => {
  if (!apiDate) return '';
  return apiDate.replace(/\//g, '-');
};

const inputDateToApiDate = (inputDate) => {
  if (!inputDate) return '';
  return inputDate.replace(/-/g, '/');
};

// Shared amount input validator/cleaner
const sanitizeAmount = (val) => {
  if (/^[0-9]*\.?[0-9]*$/.test(val) && val.length <= 10) {
    if (val === '') {
      return '0';
    } else if (val.startsWith('0') && val.length > 1 && val[1] !== '.') {
      const stripped = val.replace(/^0+/, '');
      return stripped || '0';
    }
    return val;
  }
  return null;
};

// Reusable category selection grid
function CategoryPicker({ categories, selectedCategory, onSelectCategory, disabled }) {
  return (
    <div className="category-grid">
      {categories.map((cat) => (
        <div 
          key={cat.id} 
          className={`category-card ${selectedCategory === cat.name ? 'active' : ''} ${disabled ? 'card-disabled' : ''}`}
          onClick={() => !disabled && onSelectCategory(cat.name)}
        >
          <span className="category-emoji">{cat.emoji}</span>
          <span className="category-name">{cat.name}</span>
        </div>
      ))}
    </div>
  );
}

function ExpenseDonutChart({ breakdown, totalAmount, activeCategory, onSelectCategory }) {
  const size = 180;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2; // 81
  const circumference = 2 * Math.PI * radius; // ~508.938

  const activeItem = breakdown.find((item) => item.name === activeCategory);

  let accumulatedPercent = 0;

  return (
    <div className="donut-chart-container">
      <div className="donut-chart-svg-wrapper">
        <svg 
          width={size} 
          height={size} 
          viewBox={`0 0 ${size} ${size}`} 
          className="donut-chart-svg"
        >
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Slices */}
          {breakdown.map((item) => {
            const strokeDash = (item.percentage / 100) * circumference;
            const gap = breakdown.length > 1 ? 2.5 : 0;
            const visibleDash = Math.max(0.5, strokeDash - gap);
            const offset = (accumulatedPercent / 100) * circumference;
            accumulatedPercent += item.percentage;

            const isSelected = activeCategory === item.name;
            const isDimmed = activeCategory && !isSelected;

            return (
              <circle
                key={item.name}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={isSelected ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${visibleDash} ${circumference - visibleDash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className={`donut-segment ${isSelected ? 'active' : ''} ${isDimmed ? 'dimmed' : ''}`}
                onClick={() => onSelectCategory(isSelected ? null : item.name)}
                style={{
                  transformOrigin: '50% 50%',
                  transform: 'rotate(-90deg)',
                  transition: 'all 0.25s ease',
                  cursor: 'pointer'
                }}
              />
            );
          })}
        </svg>

        {/* Center Content */}
        <div 
          className={`donut-center-content ${activeCategory ? 'has-active' : ''}`}
          onClick={() => activeCategory && onSelectCategory(null)}
          title={activeCategory ? "點擊以清除選取" : undefined}
          style={{ cursor: activeCategory ? 'pointer' : 'default' }}
        >
          {activeItem ? (
            <>
              <span className="donut-center-emoji">{activeItem.emoji}</span>
              <span className="donut-center-name">{activeItem.name}</span>
              <span className="donut-center-amount">
                ${activeItem.amount.toLocaleString('zh-TW', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              <span className="donut-center-percentage">
                {activeItem.percentageFormatted}%
              </span>
            </>
          ) : (
            <>
              <span className="donut-center-label">本月支出 Total</span>
              <span className="donut-center-amount">
                ${totalAmount.toLocaleString('zh-TW', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              <span className="donut-center-count">
                {breakdown.length} 個分類
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CategoryBreakdownList({ breakdown, activeCategory, onSelectCategory }) {
  return (
    <div className="category-breakdown-list">
      {breakdown.map((item) => {
        const isSelected = activeCategory === item.name;
        return (
          <div
            key={item.name}
            className={`breakdown-item ${isSelected ? 'active' : ''}`}
            onClick={() => onSelectCategory(isSelected ? null : item.name)}
          >
            <div className="breakdown-item-main">
              <div className="breakdown-item-left">
                <span className="breakdown-color-dot" style={{ backgroundColor: item.color }} />
                <span className="breakdown-emoji">{item.emoji}</span>
                <span className="breakdown-name">{item.name}</span>
                <span className="breakdown-count">({item.count}筆)</span>
              </div>
              <div className="breakdown-item-right">
                <span className="breakdown-amount">
                  ${item.amount.toLocaleString('zh-TW', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span 
                  className="breakdown-percentage" 
                  style={{ 
                    color: item.color,
                    borderColor: `${item.color}40`,
                    background: `${item.color}15`
                  }}
                >
                  {item.percentageFormatted}%
                </span>
              </div>
            </div>
            {/* Progress Bar Track */}
            <div className="breakdown-progress-track">
              <div
                className="breakdown-progress-fill"
                style={{
                  width: `${Math.min(100, Math.max(2, item.percentage))}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function App() {
  // Config state (saved in localStorage)
  const [gasUrl, setGasUrl] = useState(() => localStorage.getItem('sheeto_gas_url') || '');
  const [passcode, setPasscode] = useState(() => localStorage.getItem('sheeto_passcode') || '');
  const [showSettings, setShowSettings] = useState(() => {
    const savedUrl = localStorage.getItem('sheeto_gas_url') || '';
    const savedPasscode = localStorage.getItem('sheeto_passcode') || '';
    return !savedUrl || !savedPasscode;
  });

  // Form states
  const [amount, setAmount] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [dateMode, setDateMode] = useState('today'); // 'today', 'yesterday', 'custom'
  const [customDate, setCustomDate] = useState('');
  const [remarks, setRemarks] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }
  const [mutating, setMutating] = useState(false); // Mutation in-flight lock
  const [editingTx, setEditingTx] = useState(null); // Active transaction being edited
  const [confirmDeleteTx, setConfirmDeleteTx] = useState(null); // Transaction pending delete confirmation

  // Monthly transactions list states
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  });
  const [transactions, setTransactions] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [activeTab, setActiveTab] = useState('log'); // 'log' | 'history'
  const [activeCategory, setActiveCategory] = useState(null); // Selected category filter/highlight

  // Reset category filter when switching months
  useEffect(() => {
    setActiveCategory(null);
  }, [selectedMonth]);

  // Aggregate category breakdown and total monthly spending
  const { totalExpense, categoryBreakdown } = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { totalExpense: 0, categoryBreakdown: [] };
    }

    const map = {};
    let total = 0;

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      total += amt;
      const catName = tx.category || '其他';
      if (!map[catName]) {
        const meta = getCategoryMeta(catName);
        map[catName] = {
          name: catName,
          emoji: meta.emoji,
          color: meta.color,
          amount: 0,
          count: 0
        };
      }
      map[catName].amount += amt;
      map[catName].count += 1;
    });

    const breakdown = Object.values(map)
      .map((item) => ({
        ...item,
        percentage: total > 0 ? (item.amount / total) * 100 : 0,
        percentageFormatted: total > 0 ? ((item.amount / total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.amount - a.amount);

    return { totalExpense: total, categoryBreakdown: breakdown };
  }, [transactions]);

  // Ref to hold the active fetch request's AbortController
  const fetchControllerRef = useRef(null);

  // Ref to keep track of the latest selectedMonth for async callbacks (stale closure prevention)
  const selectedMonthRef = useRef(selectedMonth);
  useEffect(() => {
    selectedMonthRef.current = selectedMonth;
  }, [selectedMonth]);

  // Set default custom date to today in yyyy-MM-dd format on mount
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setCustomDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Save config function
  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('sheeto_gas_url', gasUrl.trim());
    localStorage.setItem('sheeto_passcode', passcode.trim());
    setShowSettings(false);
    showToast('success', '設定已儲存！');
  };

  // Show status notification toast
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Fetch transactions for the specified month
  const fetchTransactions = async (monthToFetch) => {
    if (!gasUrl || !passcode) {
      setTransactions([]);
      return;
    }

    // Abort the previous active request if any
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }

    // Create a new AbortController for this request
    const controller = new AbortController();
    fetchControllerRef.current = controller;
    const signal = controller.signal;
    
    setListLoading(true);
    setFetchError(null);
    
    try {
      const url = `${gasUrl}?action=getTransactions&month=${monthToFetch}&passcode=${encodeURIComponent(passcode)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: signal
      });
      
      const result = await response.json();
      if (!signal.aborted) {
        if (result.success) {
          setTransactions(result.transactions || []);
        } else {
          setFetchError(result.error || '無法取得明細資料');
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        setFetchError('連線失敗，請確認網路或連線設定！');
      }
    } finally {
      if (!signal.aborted) {
        setListLoading(false);
        if (fetchControllerRef.current === controller) {
          fetchControllerRef.current = null;
        }
      }
    }
  };

  // Effect to load transactions automatically
  useEffect(() => {
    if (gasUrl && passcode) {
      fetchTransactions(selectedMonth);
    } else {
      setTransactions([]);
    }
    
    return () => {
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort();
      }
    };
  }, [selectedMonth, gasUrl, passcode]);

  // Handle native input change with validation
  const handleInputChange = (e) => {
    const sanitized = sanitizeAmount(e.target.value);
    if (sanitized !== null) {
      setAmount(sanitized);
    }
  };

  // Handle amount change inside Edit Modal
  const handleEditAmountChange = (e) => {
    const sanitized = sanitizeAmount(e.target.value);
    if (sanitized !== null) {
      setEditingTx(prev => prev ? ({ ...prev, amount: sanitized }) : null);
    }
  };

  // Helper to post requests to Google Apps Script Web App
  const postToGas = async (payload) => {
    const response = await fetch(gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify({ ...payload, passcode })
    });
    return response.json();
  };

  // Open Edit Modal for a clicked transaction row
  const handleOpenEditModal = (tx) => {
    if (mutating) return;
    if (!Number.isInteger(tx.rowIndex)) {
      showToast('error', '後端版本過舊，請重新部署 GAS 後再試');
      return;
    }
    setEditingTx({
      rowIndex: tx.rowIndex,
      original: {
        date: tx.date,
        category: tx.category,
        amount: tx.amount,
        remarks: tx.remarks || ''
      },
      amount: String(tx.amount),
      category: tx.category,
      date: apiDateToInputDate(tx.date),
      remarks: tx.remarks || ''
    });
  };

  // Handle transaction update
  const handleUpdateTransaction = async () => {
    if (mutating || !editingTx) return;

    const numericAmount = parseFloat(editingTx.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showToast('error', '請輸入有效的金額！');
      return;
    }
    if (!editingTx.category) {
      showToast('error', '請選擇消費分類！');
      return;
    }
    if (!editingTx.date || !editingTx.date.startsWith('2026-')) {
      showToast('error', '請選擇 2026 年的有效日期！');
      return;
    }

    setMutating(true);

    const updatedApiDate = inputDateToApiDate(editingTx.date);
    const payload = {
      action: 'updateTransaction',
      rowIndex: editingTx.rowIndex,
      original: editingTx.original,
      date: updatedApiDate,
      category: editingTx.category,
      amount: numericAmount,
      remarks: (editingTx.remarks || '').trim()
    };

    try {
      const result = await postToGas(payload);

      if (result.code === 'CONFLICT') {
        setEditingTx(null);
        showToast('error', result.error || '資料已變動，已重新整理，請再試一次');
        await fetchTransactions(selectedMonthRef.current);
      } else if (result.success) {
        setEditingTx(null);
        const destinationMonth = editingTx.date.substring(0, 7);
        if (destinationMonth !== selectedMonthRef.current) {
          showToast('success', `已更新，並移至 ${destinationMonth}`);
        } else {
          showToast('success', `記帳已更新：$${numericAmount} [${editingTx.category}]`);
        }
        await fetchTransactions(selectedMonthRef.current);
      } else {
        showToast('error', `更新失敗：${result.error || '請重試'}`);
      }
    } catch (err) {
      console.error(err);
      showToast('error', '連線失敗，請確認 API 網址或密碼是否正確！');
    } finally {
      setMutating(false);
    }
  };

  // Handle transaction delete
  const handleDeleteTransaction = async () => {
    if (mutating || !confirmDeleteTx) return;

    setMutating(true);

    const payload = {
      action: 'deleteTransaction',
      rowIndex: confirmDeleteTx.rowIndex,
      original: confirmDeleteTx.original
    };

    try {
      const result = await postToGas(payload);

      if (result.code === 'CONFLICT') {
        setConfirmDeleteTx(null);
        setEditingTx(null);
        showToast('error', result.error || '資料已變動，已重新整理，請再試一次');
        await fetchTransactions(selectedMonthRef.current);
      } else if (result.success) {
        setConfirmDeleteTx(null);
        setEditingTx(null);
        showToast('success', '記錄已成功刪除！');
        await fetchTransactions(selectedMonthRef.current);
      } else {
        setConfirmDeleteTx(null);
        showToast('error', `刪除失敗：${result.error || '請重試'}`);
      }
    } catch (err) {
      console.error(err);
      setConfirmDeleteTx(null);
      showToast('error', '連線失敗，請確認 API 網址或密碼是否正確！');
    } finally {
      setMutating(false);
    }
  };

  // Handle Enter keypress for submission
  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!loading && !mutating) {
        handleSubmit();
      }
    }
  };

  // Submit flow
  const handleSubmit = async () => {
    if (loading || mutating) return;

    // Basic validation
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      showToast('error', '請輸入有效的金額！');
      return;
    }
    if (!selectedCategory) {
      showToast('error', '請選擇消費分類！');
      return;
    }
    if (!gasUrl) {
      showToast('error', '請先點擊右上角設定 API 網址！');
      setShowSettings(true);
      return;
    }

    setLoading(true);

    // Format date based on selected mode
    let targetDate = new Date();
    if (dateMode === 'yesterday') {
      targetDate.setDate(targetDate.getDate() - 1);
    } else if (dateMode === 'custom') {
      const parts = customDate.split('-');
      if (parts.length === 3) {
        targetDate = new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }

    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}/${mm}/${dd}`; // Format matches GAS parsing

    const payload = {
      date: formattedDate,
      category: selectedCategory,
      amount: numericAmount,
      remarks: remarks.trim()
    };

    try {
      const result = await postToGas(payload);

      if (result.success) {
        showToast('success', `記帳成功：$${numericAmount} [${selectedCategory}]`);
        
        // Reset input form only on successful server write
        setAmount('0');
        setSelectedCategory(null);
        setRemarks('');

        // Refresh list if the submitted transaction's month matches the currently viewed month
        const submittedMonth = `${yyyy}-${mm}`;
        if (submittedMonth === selectedMonthRef.current) {
          fetchTransactions(selectedMonthRef.current);
        }
      } else {
        showToast('error', `記帳失敗：${result.error || '請檢查安全密碼'}`);
      }
    } catch (err) {
      console.error(err);
      showToast('error', '連線失敗，請確認 API 網址或密碼是否正確！');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className={`toast glass-panel ${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' ? '✅' : '⚠️'}
            </span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">📊</span>
          <span>Sheeto</span>
        </div>
        <button 
          className="settings-btn" 
          onClick={() => setShowSettings(true)}
          title="設定"
        >
          ⚙️
        </button>
      </header>

      {/* Tab Content */}
      {activeTab === 'log' ? (
        <>
          {/* Amount Display */}
          <div className="amount-display-container glass-panel animate-pop-in">
            <label className="amount-label" htmlFor="amount-input">金額 Amount</label>
            <div className="amount-value-wrapper">
              <span className="amount-currency">$</span>
              <input
                id="amount-input"
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                className="amount-input-field"
                value={amount === '0' ? '' : amount}
                placeholder="0"
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                autoFocus={!showSettings}
              />
            </div>
          </div>

          {/* Main card containing Category and Config inputs */}
          <main className="main-card glass-panel animate-slide-up">
            {/* Date Selector */}
            <div>
              <div className="section-title">📅 日期 Date</div>
              <div className="date-selector-row">
                <button 
                  className={`date-pill ${dateMode === 'today' ? 'active' : ''}`}
                  onClick={() => setDateMode('today')}
                >
                  今天 Today
                </button>
                <button 
                  className={`date-pill ${dateMode === 'yesterday' ? 'active' : ''}`}
                  onClick={() => setDateMode('yesterday')}
                >
                  昨天 Yesterday
                </button>
                <button 
                  className={`date-pill ${dateMode === 'custom' ? 'active' : ''}`}
                  onClick={() => setDateMode('custom')}
                >
                  選擇 Select
                </button>
              </div>
              {dateMode === 'custom' && (
                <div style={{ marginTop: '8px' }}>
                  <input 
                    type="date" 
                    className="custom-date-picker" 
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Category Grid */}
            <div>
              <div className="section-title">🏷️ 分類 Category</div>
              <CategoryPicker 
                categories={CATEGORIES} 
                selectedCategory={selectedCategory} 
                onSelectCategory={setSelectedCategory}
                disabled={loading || mutating}
              />
            </div>

            {/* Remarks Input */}
            <div>
              <div className="section-title">✍️ 備註 Remarks (選填)</div>
              <input 
                type="text" 
                placeholder="例如：午餐麥當勞、飲料..." 
                className="remarks-input"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={loading || mutating}
              />
            </div>
          </main>

          {/* Submit Button */}
          <button 
            className="submit-btn" 
            onClick={handleSubmit} 
            disabled={loading || mutating || amount === '0' || !selectedCategory}
          >
            {loading ? <div className="spinner" /> : '✓ 送出此筆記帳 Submit'}
          </button>
        </>
      ) : (
        /* Monthly Transactions List Card */
        gasUrl && passcode && (
          <div className="transactions-card glass-panel animate-slide-up" style={{ width: '100%' }}>
            <div className="transactions-header">
              <div className="section-title" style={{ margin: 0 }}>📊 當月明細 Transactions</div>
              
              {/* Month Selector */}
              <select 
                className="month-dropdown"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const monthVal = String(i + 1).padStart(2, '0');
                  const yearVal = new Date().getFullYear();
                  return (
                    <option key={monthVal} value={`${yearVal}-${monthVal}`}>
                      {yearVal}年 {i + 1}月
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Monthly Total (shown whenever the chart isn't taking over that role) */}
            {transactions.length === 0 && (
              <div className="monthly-total-summary">
                <span className="total-label">本月累計金額 Total:</span>
                <span className="total-amount">
                  ${(0).toLocaleString('zh-TW', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              </div>
            )}

            {/* Loading Indicator / Error Message / Empty State / Table */}
            {listLoading && transactions.length === 0 ? (
              <div className="list-loading">
                <div className="spinner" style={{ marginBottom: '12px' }} />
                <span>載入明細中...</span>
              </div>
            ) : fetchError && transactions.length === 0 ? (
              <div className="list-error">
                <span>⚠️ {fetchError}</span>
                <button className="retry-btn" onClick={() => fetchTransactions(selectedMonth)}>
                  重試 Retry
                </button>
              </div>
            ) : (
              <>
                {/* Inline error for background refresh failures when we already have cached transaction data */}
                {fetchError && (
                  <div className="list-inline-error">
                    <span>⚠️ {fetchError}</span>
                    <button className="retry-btn-inline" onClick={() => fetchTransactions(selectedMonth)}>
                      重試 Retry
                    </button>
                  </div>
                )}

                {transactions.length === 0 ? (
                  <div className="empty-state">
                    <span>🫙 這個月還沒有記帳記錄喔！</span>
                  </div>
                ) : (
                  <>
                    {/* Expense Analytics (Donut Chart & Category Breakdown) */}
                    <div className="analytics-section">
                      <ExpenseDonutChart
                        breakdown={categoryBreakdown}
                        totalAmount={totalExpense}
                        activeCategory={activeCategory}
                        onSelectCategory={setActiveCategory}
                      />
                      <CategoryBreakdownList
                        breakdown={categoryBreakdown}
                        activeCategory={activeCategory}
                        onSelectCategory={setActiveCategory}
                      />
                    </div>

                    {/* Transactions Section Header */}
                    <div className="tx-list-header">
                      <span className="tx-list-title">
                        📝 消費記錄 {activeCategory ? `• ${activeCategory}` : ''}
                        <span className="tx-list-hint">(點擊可編輯/刪除)</span>
                      </span>
                      {activeCategory && (
                        <button 
                          className="clear-filter-btn"
                          onClick={() => setActiveCategory(null)}
                          title="顯示全部記錄"
                        >
                          顯示全部 ✕
                        </button>
                      )}
                    </div>

                    {/* Transactions List Table */}
                    <div className="transactions-list-wrapper">
                      <table className="transactions-table">
                        <thead>
                          <tr>
                            <th>日期</th>
                            <th>分類</th>
                            <th>金額</th>
                            <th>備註</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(activeCategory 
                            ? transactions.filter(tx => (tx.category || '其他') === activeCategory)
                            : transactions
                          ).map((tx, idx) => (
                            <tr 
                              key={tx.rowIndex ?? idx} 
                              className={`transaction-row tappable ${activeCategory && (tx.category || '其他') === activeCategory ? 'filtered-highlight' : ''} ${mutating ? 'row-disabled' : ''}`}
                              onClick={() => !mutating && handleOpenEditModal(tx)}
                              title="點擊以編輯或刪除此筆記錄"
                            >
                              <td className="tx-date">{tx.date.substring(5)}</td>
                              <td className="tx-category">
                                {getCategoryMeta(tx.category).emoji} {tx.category}
                              </td>
                              <td className="tx-amount">${Number(tx.amount).toFixed(1)}</td>
                              <td className="tx-remarks" title={tx.remarks}>{tx.remarks || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )
      )}

      {/* Tab Navigation */}
      <nav className="tab-navigation">
        <button 
          className={`nav-tab ${activeTab === 'log' ? 'active' : ''}`}
          onClick={() => setActiveTab('log')}
        >
          <span className="nav-icon">✍️</span>
          <span className="nav-label">記帳 Log</span>
        </button>
        <button 
          className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">明細 History</span>
        </button>
      </nav>


      {/* Settings Modal Dialog Overlay */}
      {showSettings && (
        <div className="settings-overlay">
          <div className="settings-modal glass-panel">
            <h3 className="settings-title">⚙️ API 連線設定</h3>
            {gasUrl && passcode && (
              <button className="settings-close" onClick={() => setShowSettings(false)}>
                ✕
              </button>
            )}
            
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Google Web App URL</label>
                <input 
                  type="url" 
                  required
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="form-input" 
                  value={gasUrl}
                  onChange={(e) => setGasUrl(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">安全密碼 (Passcode)</label>
                <input 
                  type="password" 
                  required
                  placeholder="請輸入設定的 PASSCODE"
                  className="form-input" 
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                />
              </div>

              <div className="settings-description">
                * 網址與密碼將以安全方式儲存在您的瀏覽器本地快取中 (localStorage)，資料不經由任何第三方伺服器，安全無虞。
              </div>

              <button type="submit" className="save-settings-btn">
                確認並儲存 Save
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal Dialog Overlay */}
      {editingTx && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-pop-in">
            <div className="modal-header">
              <h3 className="modal-title">✏️ 編輯記帳 Edit</h3>
              <button 
                className="modal-close" 
                onClick={() => !mutating && setEditingTx(null)}
                disabled={mutating}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Amount Display & Input */}
              <div className="form-group">
                <label className="form-label">💵 金額 Amount</label>
                <div className="amount-value-wrapper edit-amount-wrapper">
                  <span className="amount-currency">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    className="amount-input-field edit-amount-input"
                    value={editingTx.amount === '0' ? '' : editingTx.amount}
                    placeholder="0"
                    onChange={handleEditAmountChange}
                    disabled={mutating}
                  />
                </div>
              </div>

              {/* Date Selector */}
              <div className="form-group">
                <label className="form-label">📅 日期 Date</label>
                <input 
                  type="date" 
                  min="2026-01-01" 
                  max="2026-12-31" 
                  className="custom-date-picker" 
                  value={editingTx.date}
                  onChange={(e) => setEditingTx(prev => prev ? ({ ...prev, date: e.target.value }) : null)}
                  disabled={mutating}
                />
              </div>

              {/* Category Picker */}
              <div className="form-group">
                <label className="form-label">🏷️ 分類 Category</label>
                <CategoryPicker 
                  categories={CATEGORIES} 
                  selectedCategory={editingTx.category} 
                  onSelectCategory={(catName) => setEditingTx(prev => prev ? ({ ...prev, category: catName }) : null)}
                  disabled={mutating}
                />
              </div>

              {/* Remarks Input */}
              <div className="form-group">
                <label className="form-label">✍️ 備註 Remarks (選填)</label>
                <input 
                  type="text" 
                  placeholder="例如：午餐麥當勞、飲料..." 
                  className="remarks-input"
                  value={editingTx.remarks}
                  onChange={(e) => setEditingTx(prev => prev ? ({ ...prev, remarks: e.target.value }) : null)}
                  disabled={mutating}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions-bar">
              <button 
                type="button" 
                className="btn-danger-outline"
                onClick={() => !mutating && setConfirmDeleteTx(editingTx)}
                disabled={mutating}
              >
                🗑️ 刪除
              </button>
              <div className="modal-actions-right">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => !mutating && setEditingTx(null)}
                  disabled={mutating}
                >
                  取消
                </button>
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={handleUpdateTransaction}
                  disabled={mutating || editingTx.amount === '0' || !editingTx.category}
                >
                  {mutating && !confirmDeleteTx ? <div className="spinner" /> : '✓ 儲存變更'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog Overlay */}
      {confirmDeleteTx && (
        <div className="modal-overlay delete-confirm-overlay">
          <div className="modal-content delete-confirm-modal glass-panel animate-pop-in">
            <div className="modal-header">
              <h3 className="modal-title delete-title">⚠️ 確定刪除這筆記帳？</h3>
            </div>
            <div className="delete-confirm-body">
              <p className="delete-warning-text">
                刪除後資料將自 Google 試算表中移除。請確認以下記帳內容：
              </p>
              <div className="delete-tx-summary glass-panel">
                <div className="delete-summary-row">
                  <span className="summary-label">日期：</span>
                  <span className="summary-val">{confirmDeleteTx.original.date}</span>
                </div>
                <div className="delete-summary-row">
                  <span className="summary-label">分類：</span>
                  <span className="summary-val">
                    {getCategoryMeta(confirmDeleteTx.original.category).emoji} {confirmDeleteTx.original.category}
                  </span>
                </div>
                <div className="delete-summary-row">
                  <span className="summary-label">金額：</span>
                  <span className="summary-val amount-highlight">
                    ${Number(confirmDeleteTx.original.amount).toFixed(1)}
                  </span>
                </div>
                {confirmDeleteTx.original.remarks && (
                  <div className="delete-summary-row">
                    <span className="summary-label">備註：</span>
                    <span className="summary-val">{confirmDeleteTx.original.remarks}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-actions-bar delete-actions-bar">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => !mutating && setConfirmDeleteTx(null)}
                disabled={mutating}
              >
                取消
              </button>
              <button 
                type="button" 
                className="btn-danger"
                onClick={handleDeleteTransaction}
                disabled={mutating}
              >
                {mutating ? <div className="spinner" /> : '確認刪除 Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
