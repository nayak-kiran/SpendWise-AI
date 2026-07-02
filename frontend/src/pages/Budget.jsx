import { useState, useEffect, useRef } from 'react';
import { getBudgetStatus, setBudget, adjustBudget } from '../services/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getLocalToday = () => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth(),
  };
};

const formatMonthValue = (year, month) => {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
};

const formatMonthLabel = (monthValue) => {
  const [year, month] = monthValue.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const Budget = () => {
  const today = getLocalToday();
  const defaultMonth = formatMonthValue(today.year, today.month);

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarYear, setCalendarYear] = useState(today.year);
  const [status, setStatus] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const calendarRef = useRef(null);

  const fetchStatus = () => {
    getBudgetStatus(selectedMonth)
      .then(res => setStatus(res.data))
      .catch(() => setStatus(null));
  };

  useEffect(() => {
    fetchStatus();
    setAmount('');
    setError('');
    setSuccess('');
  }, [selectedMonth]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMonthSelectable = (year, monthIndex) => {
    if (year < today.year) return true;
    if (year === today.year && monthIndex <= today.month) return true;
    return false;
  };

  const handleMonthSelect = (monthIndex) => {
    if (!isMonthSelectable(calendarYear, monthIndex)) return;
    setSelectedMonth(formatMonthValue(calendarYear, monthIndex));
    setCalendarOpen(false);
  };

  const handleSetBudget = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await setBudget({ month: selectedMonth, amount: parseFloat(amount) });
      setSuccess('Budget set successfully');
      setAmount('');
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to set budget');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async (action) => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await adjustBudget({ month: selectedMonth, amount: parseFloat(amount), action });
      setSuccess(`Budget updated successfully — amount ${action === 'add' ? 'added' : 'withdrawn'}`);
      setAmount('');
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to adjust budget');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '1.5rem',
  };

  const percentColor = !status ? '#4ecca3'
    : status.percent_used >= 100 ? '#e94560'
    : status.percent_used >= 80 ? '#f5a623'
    : '#4ecca3';

  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>

      {/* Header with calendar icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', position: 'relative' }}>
        <h2 style={{ color: '#16213e', margin: 0 }}>
          Budget — {formatMonthLabel(selectedMonth)}
        </h2>
        <button
          onClick={() => setCalendarOpen(!calendarOpen)}
          style={{
            background: 'none',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '0.4rem 0.6rem',
            cursor: 'pointer',
            fontSize: '1.2rem',
          }}
          title="Change month"
        >
          📅
        </button>

        {/* Calendar popup */}
        {calendarOpen && (
          <div
            ref={calendarRef}
            style={{
              position: 'absolute',
              top: '110%',
              left: 0,
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              padding: '1.25rem',
              zIndex: 100,
              minWidth: '280px',
            }}
          >
            {/* Year selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <button
                onClick={() => setCalendarYear(y => y - 1)}
                disabled={calendarYear <= 2024}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: calendarYear <= 2024 ? '#ccc' : '#16213e' }}
              >
                ‹
              </button>
              <span style={{ fontWeight: 'bold', color: '#16213e', fontSize: '1rem' }}>{calendarYear}</span>
              <button
                onClick={() => setCalendarYear(y => y + 1)}
                disabled={calendarYear >= today.year}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: calendarYear >= today.year ? '#ccc' : '#16213e' }}
              >
                ›
              </button>
            </div>

            {/* Month grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {MONTHS.map((month, index) => {
                const selectable = isMonthSelectable(calendarYear, index);
                const isSelected = selectedMonth === formatMonthValue(calendarYear, index);
                return (
                  <button
                    key={month}
                    onClick={() => handleMonthSelect(index)}
                    disabled={!selectable}
                    style={{
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #4ecca3' : '1px solid #eee',
                      backgroundColor: isSelected ? '#4ecca3' : selectable ? 'white' : '#f8f8f8',
                      color: isSelected ? '#0f3460' : selectable ? '#16213e' : '#ccc',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      cursor: selectable ? 'pointer' : 'not-allowed',
                      fontSize: '0.85rem',
                    }}
                  >
                    {month}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Budget set/adjust card */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: '1rem', color: '#16213e' }}>
          {status ? 'Adjust Budget' : 'Set Budget'}
        </h3>
        {error && <p style={{ color: '#e94560', marginBottom: '0.75rem' }}>{error}</p>}
        {success && <p style={{ color: '#4ecca3', marginBottom: '0.75rem' }}>{success}</p>}

        {status ? (
          <div>
            <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Current budget: <strong>₹{status.budget.toLocaleString()}</strong>
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="number"
                placeholder="Enter amount (₹)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
              />
              <button
                onClick={() => handleAdjust('add')}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.2rem',
                  backgroundColor: '#4ecca3',
                  color: '#0f3460',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                + Add Amount
              </button>
              <button
                onClick={() => handleAdjust('withdraw')}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.2rem',
                  backgroundColor: '#e94560',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                − Withdraw Amount
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="number"
              placeholder={`Set budget for ${formatMonthLabel(selectedMonth)} (₹)`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }}
            />
            <button
              onClick={handleSetBudget}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#4ecca3',
                color: '#0f3460',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {loading ? 'Saving...' : 'Set Budget'}
            </button>
          </div>
        )}
      </div>

      {/* Budget overview card */}
      {status ? (
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '1.5rem', color: '#16213e' }}>Budget Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#666', fontSize: '0.85rem' }}>Total Budget</p>
              <h3 style={{ fontSize: '1.8rem', color: '#16213e' }}>₹{status.budget.toLocaleString()}</h3>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#666', fontSize: '0.85rem' }}>Total Spent</p>
              <h3 style={{ fontSize: '1.8rem', color: '#e94560' }}>₹{status.total_spent.toLocaleString()}</h3>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#666', fontSize: '0.85rem' }}>Remaining</p>
              <h3 style={{ fontSize: '1.8rem', color: '#4ecca3' }}>₹{status.remaining.toLocaleString()}</h3>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#666', fontSize: '0.85rem' }}>Used</p>
              <h3 style={{ fontSize: '1.8rem', color: percentColor }}>{status.percent_used}%</h3>
            </div>
          </div>

          <div style={{ backgroundColor: '#f0f2f5', borderRadius: '8px', height: '12px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(status.percent_used, 100)}%`,
              backgroundColor: percentColor,
              borderRadius: '8px',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <p style={{ textAlign: 'center', marginTop: '0.5rem', color: '#666', fontSize: '0.85rem' }}>
            ₹{status.total_spent.toLocaleString()} spent of ₹{status.budget.toLocaleString()}
          </p>

          {status.percent_used >= 80 && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              backgroundColor: status.percent_used >= 100 ? '#fde8eb' : '#fff8e6',
              borderRadius: '8px',
              borderLeft: `4px solid ${percentColor}`,
            }}>
              <p style={{ color: percentColor, fontWeight: 'bold' }}>
                {status.percent_used >= 100
                  ? '🚨 You have exceeded your monthly budget!'
                  : '⚠️ You have used 80% of your monthly budget'}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ ...cardStyle, textAlign: 'center', color: '#999' }}>
          <p>No budget set for {formatMonthLabel(selectedMonth)} yet.</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Set one above to start tracking.</p>
        </div>
      )}
    </div>
  );
};

export default Budget;