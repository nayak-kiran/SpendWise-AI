import { useState, useEffect, useRef } from 'react';
import { getExpenses, getBudgetStatus } from '../services/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#4ecca3', '#e94560', '#f5a623', '#0f3460', '#a78bfa', '#60a5fa'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const getLocalToday = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
};

const formatMonthValue = (year, month) => `${year}-${String(month + 1).padStart(2, '0')}`;

const formatMonthLabel = (monthValue) => {
  const [year, month] = monthValue.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, 1)
    .toLocaleString('default', { month: 'long', year: 'numeric' });
};

// Custom SVG line chart with per-segment coloring and exact day positioning
const CustomSpendingChart = ({ expenses, selectedMonth }) => {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const width = 500;
  const height = 220;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 15;
  const paddingBottom = 45;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Filter expenses for selected month, sort by day
  const monthExpenses = expenses
    .filter(exp => exp.date.slice(0, 7) === selectedMonth)
    .map(exp => ({ ...exp, day: parseInt(exp.date.split('-')[2]) }))
    .sort((a, b) => a.day - b.day);

  if (monthExpenses.length === 0) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        No expenses for this month yet
      </div>
    );
  }

  const maxAmount = Math.max(...monthExpenses.map(e => e.amount));
  const totalDays = 31;

  // X position: day 0 = left edge, day 31 = right edge
  const xPos = (day) => paddingLeft + (day / totalDays) * chartWidth;
  // Y position: 0 = bottom, maxAmount = top
  const yPos = (amount) => paddingTop + chartHeight - (amount / (maxAmount * 1.1)) * chartHeight;

  // Build points array including 0 at day 0
  const points = [
    { day: 0, amount: 0 },
    ...monthExpenses,
  ];

  // Build colored segments between consecutive points
  const segments = [];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const color = curr.amount > prev.amount ? '#e94560'
                : curr.amount < prev.amount ? '#4ecca3'
                : '#f5a623';
    segments.push({ x1: xPos(prev.day), y1: yPos(prev.amount), x2: xPos(curr.day), y2: yPos(curr.amount), color });
  }

  // X-axis tick positions and labels
  const xTicks = [
    { day: 0, label: '0' },
    { day: 7, label: 'Week 1' },
    { day: 14, label: 'Week 2' },
    { day: 21, label: 'Week 3' },
    { day: 28, label: 'Week 4' },
    { day: 31, label: '31' },
  ];

  // Y-axis ticks
  const yTickCount = 4;
  const yTicks = Array.from({ length: yTickCount + 1 }, (_, i) => {
    const val = Math.round((maxAmount * 1.1 / yTickCount) * i);
    return { val, y: yPos(val) };
  });

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <line
            key={i}
            x1={paddingLeft}
            y1={tick.y}
            x2={width - paddingRight}
            y2={tick.y}
            stroke="#f0f0f0"
            strokeWidth="1"
          />
        ))}

        {/* Week zone dividers */}
        {[7, 14, 21, 28].map(day => (
          <line
            key={day}
            x1={xPos(day)}
            y1={paddingTop}
            x2={xPos(day)}
            y2={paddingTop + chartHeight}
            stroke="#e8e8e8"
            strokeWidth="1"
            strokeDasharray="4,3"
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <text key={i} x={paddingLeft - 6} y={tick.y + 4} textAnchor="end" fontSize="10" fill="#999">
            ₹{tick.val >= 1000 ? `${(tick.val / 1000).toFixed(0)}k` : tick.val}
          </text>
        ))}

        {/* X-axis line */}
        <line
          x1={paddingLeft}
          y1={paddingTop + chartHeight}
          x2={width - paddingRight}
          y2={paddingTop + chartHeight}
          stroke="#ddd"
          strokeWidth="1"
        />

        {/* X-axis ticks and labels */}
        {xTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={xPos(tick.day)}
              y1={paddingTop + chartHeight}
              x2={xPos(tick.day)}
              y2={paddingTop + chartHeight + 4}
              stroke="#ddd"
              strokeWidth="1"
            />
            <text
              x={xPos(tick.day)}
              y={paddingTop + chartHeight + 16}
              textAnchor="middle"
              fontSize={tick.label.startsWith('Week') ? '9' : '10'}
              fill="#999"
            >
              {tick.label}
            </text>
          </g>
        ))}

        {/* Colored line segments */}
        {segments.map((seg, i) => (
          <line
            key={i}
            x1={seg.x1} y1={seg.y1}
            x2={seg.x2} y2={seg.y2}
            stroke={seg.color}
            strokeWidth="2.5"
          />
        ))}

        {/* Blue dots for each actual expense */}
        {monthExpenses.map((exp, i) => (
          <circle
            key={i}
            cx={xPos(exp.day)}
            cy={yPos(exp.amount)}
            r="5"
            fill="#3b82f6"
            stroke="white"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => setTooltip({ x: xPos(exp.day), y: yPos(exp.amount), exp })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        {/* Origin dot at day 0 */}
        <circle
          cx={xPos(0)}
          cy={yPos(0)}
          r="4"
          fill="#999"
          stroke="white"
          strokeWidth="2"
        />

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect
              x={tooltip.x + 8}
              y={tooltip.y - 28}
              width="130"
              height="42"
              rx="6"
              fill="white"
              stroke="#ddd"
              strokeWidth="1"
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
            />
            <text x={tooltip.x + 14} y={tooltip.y - 12} fontSize="10" fill="#16213e" fontWeight="bold">
              ₹{tooltip.exp.amount.toLocaleString()}
            </text>
            <text x={tooltip.x + 14} y={tooltip.y + 2} fontSize="9" fill="#666">
              {tooltip.exp.description.slice(0, 18)}{tooltip.exp.description.length > 18 ? '...' : ''}
            </text>
            <text x={tooltip.x + 14} y={tooltip.y + 14} fontSize="9" fill="#999">
              Day {tooltip.exp.day} — {tooltip.exp.category}
            </text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', marginTop: '0.5rem', fontSize: '0.78rem', color: '#666' }}>
        <span><span style={{ color: '#e94560', fontWeight: 'bold' }}>●</span> Spending up</span>
        <span><span style={{ color: '#4ecca3', fontWeight: 'bold' }}>●</span> Spending down</span>
        <span><span style={{ color: '#f5a623', fontWeight: 'bold' }}>●</span> Same amount</span>
        <span><span style={{ color: '#3b82f6', fontWeight: 'bold' }}>●</span> Expense</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const today = getLocalToday();
  const defaultMonth = formatMonthValue(today.year, today.month);

  const [expenses, setExpenses] = useState([]);
  const [budgetStatus, setBudgetStatus] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarYear, setCalendarYear] = useState(today.year);
  const calendarRef = useRef(null);

  useEffect(() => {
    getExpenses().then(res => setExpenses(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    getBudgetStatus(selectedMonth)
      .then(res => setBudgetStatus(res.data))
      .catch(() => setBudgetStatus(null));
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

  // Filter expenses for selected month only
  const monthExpenses = expenses.filter(exp => exp.date.slice(0, 7) === selectedMonth);

  const categoryData = monthExpenses.reduce((acc, exp) => {
    const existing = acc.find(item => item.name === exp.category);
    if (existing) existing.value += exp.amount;
    else acc.push({ name: exp.category, value: exp.amount });
    return acc;
  }, []);

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header with month picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', position: 'relative' }}>
        <h2 style={{ color: '#16213e', margin: 0 }}>Dashboard — {formatMonthLabel(selectedMonth)}</h2>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <button
                onClick={() => setCalendarYear(y => y - 1)}
                disabled={calendarYear <= 2024}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: calendarYear <= 2024 ? '#ccc' : '#16213e' }}
              >‹</button>
              <span style={{ fontWeight: 'bold', color: '#16213e' }}>{calendarYear}</span>
              <button
                onClick={() => setCalendarYear(y => y + 1)}
                disabled={calendarYear >= today.year}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: calendarYear >= today.year ? '#ccc' : '#16213e' }}
              >›</button>
            </div>
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

      {/* Summary cards */}
      {budgetStatus ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ ...cardStyle, borderLeft: '4px solid #4ecca3' }}>
            <p style={{ color: '#666', fontSize: '0.85rem' }}>Total Spent</p>
            <h3 style={{ fontSize: '1.8rem', color: '#16213e' }}>₹{budgetStatus.total_spent.toLocaleString()}</h3>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #f5a623' }}>
            <p style={{ color: '#666', fontSize: '0.85rem' }}>Monthly Budget</p>
            <h3 style={{ fontSize: '1.8rem', color: '#16213e' }}>₹{budgetStatus.budget.toLocaleString()}</h3>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #a78bfa' }}>
            <p style={{ color: '#666', fontSize: '0.85rem' }}>Remaining</p>
            <h3 style={{ fontSize: '1.8rem', color: '#16213e' }}>₹{budgetStatus.remaining.toLocaleString()}</h3>
          </div>
          <div style={{ ...cardStyle, borderLeft: '4px solid #e94560' }}>
            <p style={{ color: '#666', fontSize: '0.85rem' }}>Budget Used</p>
            <h3 style={{ fontSize: '1.8rem', color: budgetStatus.percent_used >= 80 ? '#e94560' : '#4ecca3' }}>
              {budgetStatus.percent_used}%
            </h3>
          </div>
        </div>
      ) : (
        <div style={{ ...cardStyle, marginBottom: '2rem', color: '#999', textAlign: 'center' }}>
          No budget set for {formatMonthLabel(selectedMonth)} — go to Budget page to set one.
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '1rem', color: '#16213e' }}>Spending by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: '#999', textAlign: 'center', paddingTop: '4rem' }}>
              No expenses for {formatMonthLabel(selectedMonth)}
            </p>
          )}
        </div>

        <div style={cardStyle}>
          <h3 style={{ marginBottom: '1rem', color: '#16213e' }}>Monthly Spending Trend</h3>
          <CustomSpendingChart expenses={expenses} selectedMonth={selectedMonth} />
        </div>
      </div>

      {/* Recent expenses */}
      <div style={cardStyle}>
        <h3 style={{ marginBottom: '1rem', color: '#16213e' }}>
          Recent Expenses — {formatMonthLabel(selectedMonth)}
        </h3>
        {monthExpenses.length === 0 ? (
          <p style={{ color: '#999' }}>No expenses for {formatMonthLabel(selectedMonth)}</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f2f5' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem', color: '#666' }}>Description</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', color: '#666' }}>Category</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', color: '#666' }}>Amount</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', color: '#666' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {monthExpenses.slice(0, 5).map(exp => (
                <tr key={exp.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{exp.description}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <span style={{ backgroundColor: '#f0f2f5', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                      {exp.category}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: '#e94560', fontWeight: 'bold' }}>
                    ₹{exp.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: '#666' }}>{exp.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;