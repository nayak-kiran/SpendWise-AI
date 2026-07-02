import { useState, useEffect } from 'react';
import { getExpenses, addExpense, updateExpense, deleteExpense } from '../services/api';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ amount: '', description: '', date: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchExpenses = () => {
    getExpenses().then(res => setExpenses(res.data)).catch(() => {});
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.amount || !form.description || !form.date) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (editingId) {
        await updateExpense(editingId, { ...form, amount: parseFloat(form.amount) });
        setEditingId(null);
      } else {
        await addExpense({ ...form, amount: parseFloat(form.amount) });
      }
      setForm({ amount: '', description: '', date: '' });
      fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (exp) => {
    setEditingId(exp.id);
    setForm({ amount: exp.amount, description: exp.description, date: exp.date });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await deleteExpense(id);
    fetchExpenses();
  };

  const inputStyle = {
    padding: '0.65rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '0.95rem',
    flex: 1,
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', color: '#16213e' }}>Expenses</h2>

      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        marginBottom: '2rem',
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#16213e' }}>
          {editingId ? 'Edit Expense' : 'Add New Expense'}
        </h3>
        {error && <p style={{ color: '#e94560', marginBottom: '0.75rem' }}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input name="description" placeholder="Description (e.g. Swiggy order)" value={form.description} onChange={handleChange} style={{ ...inputStyle, minWidth: '200px' }} />
          <input name="amount" type="number" placeholder="Amount (₹)" value={form.amount} onChange={handleChange} style={{ ...inputStyle, maxWidth: '140px' }} />
          <input name="date" type="date" value={form.date} onChange={handleChange}  max={new Date().toISOString().split('T')[0]} style={{ ...inputStyle, maxWidth: '160px' }} />
          <button onClick={handleSubmit} disabled={loading} style={{
            padding: '0.65rem 1.5rem',
            backgroundColor: '#40977a',
            color: '#0f3460',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}>
            {loading ? 'Saving...' : editingId ? 'Update' : 'Add Expense'}
          </button>
          {editingId && (
            <button onClick={() => { setEditingId(null); setForm({ amount: '', description: '', date: '' }); }} style={{
              padding: '0.65rem 1rem',
              backgroundColor: '#f0f2f5',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}>Cancel</button>
          )}
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>
        {expenses.length === 0 ? (
          <p style={{ padding: '2rem', color: '#999', textAlign: 'center' }}>No expenses yet</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ textAlign: 'left', padding: '1rem', color: '#666' }}>Description</th>
                <th style={{ textAlign: 'left', padding: '1rem', color: '#666' }}>Category</th>
                <th style={{ textAlign: 'left', padding: '1rem', color: '#666' }}>Amount</th>
                <th style={{ textAlign: 'left', padding: '1rem', color: '#666' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '1rem', color: '#666' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id} style={{ borderBottom: '1px solid #f0f2f5' }}>
                  <td style={{ padding: '1rem' }}>{exp.description}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ backgroundColor: '#f0f2f5', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.85rem' }}>
                      {exp.category}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#e94560', fontWeight: 'bold' }}>₹{exp.amount.toLocaleString()}</td>
                  <td style={{ padding: '1rem', color: '#666' }}>{exp.date}</td>
                  <td style={{ padding: '1rem' }}>
                    <button onClick={() => handleEdit(exp)} style={{ marginRight: '0.5rem', padding: '0.3rem 0.8rem', backgroundColor: '#4ecca3', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDelete(exp.id)} style={{ padding: '0.3rem 0.8rem', backgroundColor: '#e94560', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Expenses;