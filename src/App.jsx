import React, { useState, useEffect } from 'react';
import './App.css';

// Exact categories matching the spreadsheet rows
const CATEGORIES = [
  { id: 'meals', name: '餐費', emoji: '🍔' },
  { id: 'coffee', name: '咖啡飲料', emoji: '☕' },
  { id: 'beauty', name: '衣服鞋子美容保養', emoji: '🛍️' },
  { id: 'transport', name: '運輸交通', emoji: '🚗' },
  { id: 'household', name: '居家生活用品', emoji: '🏠' },
  { id: 'medical', name: '醫療/保健', emoji: '💊' },
  { id: 'fitness', name: '健身運動/按摩', emoji: '🏋️' },
  { id: 'entertainment', name: '休閒娛樂', emoji: '🎬' },
  { id: 'digital', name: '3C/電子產品', emoji: '💻' },
  { id: 'charity', name: '公益', emoji: '❤️' },
  { id: 'others', name: '其他', emoji: '➕' }
];

function App() {
  // Config state (saved in localStorage)
  const [gasUrl, setGasUrl] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Form states
  const [amount, setAmount] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [dateMode, setDateMode] = useState('today'); // 'today', 'yesterday', 'custom'
  const [customDate, setCustomDate] = useState('');
  const [remarks, setRemarks] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }

  // Load configuration on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('sheeto_gas_url') || '';
    const savedPasscode = localStorage.getItem('sheeto_passcode') || '';
    setGasUrl(savedUrl);
    setPasscode(savedPasscode);
    
    // Automatically show settings if not configured
    if (!savedUrl || !savedPasscode) {
      setShowSettings(true);
    }

    // Set default custom date to today in yyyy-MM-dd format
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

  // Keyboard entry handlers
  const handleKeyPress = (key) => {
    if (amount.length > 10 && key !== 'backspace' && key !== 'clear') return;

    if (key === 'clear') {
      setAmount('0');
    } else if (key === 'backspace') {
      if (amount.length <= 1) {
        setAmount('0');
      } else {
        setAmount(amount.slice(0, -1));
      }
    } else if (key === '.') {
      if (!amount.includes('.')) {
        setAmount(amount + '.');
      }
    } else {
      // Numbers
      if (amount === '0') {
        setAmount(key);
      } else {
        setAmount(amount + key);
      }
    }
  };

  // Submit flow
  const handleSubmit = async () => {
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
      remarks: remarks.trim(),
      passcode: passcode
    };

    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        mode: 'no-cors', // Apps Script web app returns redirect which client handles as opaque
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // Since mode is 'no-cors', we might get an opaque response (status 0).
      // If fetch doesn't throw, we assume it successfully reached GAS.
      showToast('success', `記帳成功：$${numericAmount} [${selectedCategory}]`);
      
      // Reset input form
      setAmount('0');
      setSelectedCategory(null);
      setRemarks('');
    } catch (err) {
      console.error(err);
      showToast('error', '連線失敗，請檢查 API 網址或密碼！');
    } finally {
      setLoading(false);
    }
  };

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. If settings modal is open, do not intercept keyboard events
      if (showSettings) return;
      
      // 2. If the user is currently focusing any text input (remarks, date, settings), do not intercept
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      const { key } = e;
      
      // Allow numbers 0-9
      if (/^[0-9]$/.test(key)) {
        e.preventDefault();
        handleKeyPress(key);
      } 
      // Allow decimal point
      else if (key === '.') {
        e.preventDefault();
        handleKeyPress('.');
      } 
      // Allow Backspace
      else if (key === 'Backspace') {
        e.preventDefault();
        handleKeyPress('backspace');
      } 
      // Allow Escape to clear
      else if (key === 'Escape') {
        e.preventDefault();
        handleKeyPress('clear');
      }
      // Allow Enter to submit
      else if (key === 'Enter') {
        e.preventDefault();
        if (amount !== '0' && selectedCategory && !loading) {
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [amount, selectedCategory, loading, showSettings]);

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

      {/* Amount Display */}
      <div className="amount-display-container glass-panel animate-pop-in">
        <span className="amount-label">金額 Amount</span>
        <div className="amount-value-wrapper">
          <span className="amount-currency">$</span>
          <span className="amount-value">{amount}</span>
          <span className="cursor"></span>
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
          <div className="category-grid">
            {CATEGORIES.map((cat) => (
              <div 
                key={cat.id} 
                className={`category-card ${selectedCategory === cat.name ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                <span className="category-emoji">{cat.emoji}</span>
                <span className="category-name">{cat.name}</span>
              </div>
            ))}
          </div>
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
          />
        </div>
      </main>

      {/* Mobile Custom Keypad */}
      <div className="keypad-container animate-slide-up">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button 
            key={num} 
            className="keypad-btn"
            onClick={() => handleKeyPress(num)}
          >
            {num}
          </button>
        ))}
        <button className="keypad-btn action-btn" onClick={() => handleKeyPress('.')}>
          .
        </button>
        <button className="keypad-btn" onClick={() => handleKeyPress('0')}>
          0
        </button>
        <button 
          className="keypad-btn action-btn" 
          onClick={() => handleKeyPress('backspace')}
          style={{ fontSize: '18px' }}
        >
          ⌫
        </button>
        <button 
          className="keypad-btn action-btn" 
          onClick={() => handleKeyPress('clear')}
          style={{ gridColumn: 'span 3', fontSize: '16px', height: '44px', marginTop: '-4px' }}
        >
          清除 Clear
        </button>
      </div>

      {/* Submit Button */}
      <button 
        className="submit-btn" 
        onClick={handleSubmit} 
        disabled={loading || amount === '0' || !selectedCategory}
      >
        {loading ? <div className="spinner" /> : '✓ 送出此筆記帳 Submit'}
      </button>

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
    </div>
  );
}

export default App;
