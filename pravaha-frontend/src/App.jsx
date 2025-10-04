import React, { useState, useEffect } from 'react';
import { Camera, Upload, CheckCircle, XCircle, Clock, DollarSign, Users, FileText, Settings, LogOut, Plus, Eye, TrendingUp } from 'lucide-react';

// API Base URL
const API_BASE = 'http://localhost:5000/api';

// Theme colors
const colors = {
  bg: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceHover: '#252525',
  primary: '#fbbf24',
  primaryDark: '#f59e0b',
  success: '#22c55e',
  successDark: '#16a34a',
  error: '#ef4444',
  text: '#ffffff',
  textSecondary: '#9ca3af',
  border: '#2a2a2a'
};

// Main App Component
function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [expenses, setExpenses] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setCurrentView(user.role === 'Admin' ? 'dashboard' : 'myExpenses');
      loadExpenses(user.user_id);
    }
  }, []);

  const loadExpenses = async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/expenses/user/${userId}`);
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentView(user.role === 'Admin' ? 'dashboard' : 'myExpenses');
    loadExpenses(user.user_id);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setCurrentView('login');
    setExpenses([]);
  };

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg, color: colors.text }}>
      <Navbar 
        user={currentUser} 
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogout={handleLogout}
      />
      <div style={{ padding: '24px' }}>
        {currentView === 'dashboard' && <Dashboard user={currentUser} />}
        {currentView === 'myExpenses' && (
          <MyExpenses 
            user={currentUser} 
            expenses={expenses}
            onRefresh={() => loadExpenses(currentUser.user_id)}
          />
        )}
        {currentView === 'submitExpense' && (
          <SubmitExpense 
            user={currentUser}
            onSuccess={() => {
              loadExpenses(currentUser.user_id);
              setCurrentView('myExpenses');
            }}
          />
        )}
        {currentView === 'manageUsers' && <ManageUsers user={currentUser} />}
        {currentView === 'approveExpenses' && <ApproveExpenses user={currentUser} />}
      </div>
    </div>
  );
}

// Navbar Component
function Navbar({ user, currentView, setCurrentView, onLogout }) {
  return (
    <nav style={{
      backgroundColor: colors.surface,
      padding: '16px 24px',
      borderBottom: `2px solid ${colors.primary}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <DollarSign color={colors.primary} size={32} />
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold',
          background: `linear-gradient(135deg, ${colors.primary}, ${colors.success})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Pravaha
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        {user.role === 'Admin' && (
          <>
            <NavButton 
              active={currentView === 'dashboard'}
              onClick={() => setCurrentView('dashboard')}
              icon={<TrendingUp size={18} />}
              label="Dashboard"
            />
            <NavButton 
              active={currentView === 'manageUsers'}
              onClick={() => setCurrentView('manageUsers')}
              icon={<Users size={18} />}
              label="Users"
            />
          </>
        )}
        
        {(user.role === 'Manager' || user.role === 'Admin') && (
          <NavButton 
            active={currentView === 'approveExpenses'}
            onClick={() => setCurrentView('approveExpenses')}
            icon={<CheckCircle size={18} />}
            label="Approvals"
          />
        )}

        <NavButton 
          active={currentView === 'myExpenses'}
          onClick={() => setCurrentView('myExpenses')}
          icon={<FileText size={18} />}
          label="My Expenses"
        />
        
        <NavButton 
          active={currentView === 'submitExpense'}
          onClick={() => setCurrentView('submitExpense')}
          icon={<Plus size={18} />}
          label="Submit"
        />

        <div style={{
          borderLeft: `1px solid ${colors.border}`,
          paddingLeft: '16px',
          marginLeft: '8px'
        }}>
          <span style={{ color: colors.textSecondary, marginRight: '12px' }}>
            {user.full_name} ({user.role})
          </span>
          <button
            onClick={onLogout}
            style={{
              backgroundColor: colors.error,
              color: colors.text,
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: active ? colors.primary : 'transparent',
        color: active ? colors.bg : colors.text,
        border: active ? 'none' : `1px solid ${colors.border}`,
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: active ? 'bold' : 'normal',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        if (!active) e.target.style.backgroundColor = colors.surfaceHover;
      }}
      onMouseLeave={(e) => {
        if (!active) e.target.style.backgroundColor = 'transparent';
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// Auth Screen
function AuthScreen({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    company_name: '',
    country: 'India'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isSignup ? '/signup' : '/login';
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        if (isSignup) {
          alert('Company created successfully! Please login.');
          setIsSignup(false);
        } else {
          onLogin(data);
        }
      } else {
        setError(data.message || 'An error occurred');
      }
    } catch (err) {
      setError('Connection error. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: colors.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        backgroundColor: colors.surface,
        padding: '48px',
        borderRadius: '12px',
        border: `2px solid ${colors.primary}`,
        maxWidth: '450px',
        width: '100%'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <DollarSign size={48} color={colors.primary} style={{ margin: '0 auto' }} />
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            marginTop: '16px',
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.success})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Pravaha
          </h1>
          <p style={{ color: colors.textSecondary }}>Expense Management System</p>
        </div>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <Input
                label="Full Name"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                required
              />
              <Input
                label="Company Name"
                value={formData.company_name}
                onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                required
              />
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: colors.textSecondary,
                  fontSize: '14px'
                }}>
                  Country
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    color: colors.text,
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                  <option value="France">France</option>
                  <option value="Japan">Japan</option>
                  <option value="Singapore">Singapore</option>
                  <option value="UAE">UAE</option>
                  <option value="Brazil">Brazil</option>
                  <option value="China">China</option>
                  <option value="Mexico">Mexico</option>
                  <option value="South Korea">South Korea</option>
                </select>
              </div>
            </>
          )}

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          
          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />

          {error && (
            <div style={{
              backgroundColor: colors.error + '20',
              color: colors.error,
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: colors.primary,
              color: colors.bg,
              border: 'none',
              padding: '14px',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px'
            }}
          >
            {loading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Login')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            onClick={() => setIsSignup(!isSignup)}
            style={{
              background: 'none',
              border: 'none',
              color: colors.primary,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isSignup ? 'Already have an account? Login' : 'First time? Create Company'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Input Component
function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{
        display: 'block',
        marginBottom: '8px',
        color: colors.textSecondary,
        fontSize: '14px'
      }}>
        {label}
      </label>
      <input
        {...props}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: '6px',
          color: colors.text,
          fontSize: '14px',
          boxSizing: 'border-box'
        }}
      />
    </div>
  );
}

// Dashboard Component (Admin)
function Dashboard({ user }) {
  const [stats, setStats] = useState({
    totalUsers: '--',
    totalExpenses: '--',
    pendingApprovals: '--'
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Fetch users count
      const usersRes = await fetch(`${API_BASE}/admin/users?company_id=${user.company_id}`);
      const usersData = await usersRes.json();
      
      // Fetch all expenses count
      const expensesRes = await fetch(`${API_BASE}/expenses/company/${user.company_id}`);
      const expensesData = await expensesRes.json();
      
      // Fetch pending expenses count
      const pendingRes = await fetch(`${API_BASE}/expenses/pending?company_id=${user.company_id}`);
      const pendingData = await pendingRes.json();
      
      setStats({
        totalUsers: usersData.length,
        totalExpenses: expensesData.length,
        pendingApprovals: pendingData.length
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '28px', marginBottom: '24px' }}>
        Admin Dashboard
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        <StatCard
          icon={<Users size={32} color={colors.primary} />}
          title="Total Users"
          value={stats.totalUsers}
          color={colors.primary}
        />
        <StatCard
          icon={<FileText size={32} color={colors.success} />}
          title="Total Expenses"
          value={stats.totalExpenses}
          color={colors.success}
        />
        <StatCard
          icon={<Clock size={32} color={colors.primary} />}
          title="Pending Approvals"
          value={stats.pendingApprovals}
          color={colors.primary}
        />
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }) {
  return (
    <div style={{
      backgroundColor: colors.surface,
      padding: '24px',
      borderRadius: '12px',
      border: `2px solid ${color}`,
    }}>
      <div style={{ marginBottom: '12px' }}>{icon}</div>
      <div style={{ color: colors.textSecondary, fontSize: '14px' }}>{title}</div>
      <div style={{ fontSize: '32px', fontWeight: 'bold', color }}>{value}</div>
    </div>
  );
}

// My Expenses Component
function MyExpenses({ user, expenses, onRefresh }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px' }}>My Expenses</h2>
        <button
          onClick={onRefresh}
          style={{
            backgroundColor: colors.success,
            color: colors.text,
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>

      {expenses.length === 0 ? (
        <div style={{
          backgroundColor: colors.surface,
          padding: '48px',
          borderRadius: '12px',
          textAlign: 'center',
          color: colors.textSecondary
        }}>
          No expenses submitted yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {expenses.map((expense) => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExpenseCard({ expense }) {
  const statusColors = {
    'Pending': colors.primary,
    'Approved': colors.success,
    'Rejected': colors.error
  };

  const statusIcons = {
    'Pending': <Clock size={18} />,
    'Approved': <CheckCircle size={18} />,
    'Rejected': <XCircle size={18} />
  };

  return (
    <div style={{
      backgroundColor: colors.surface,
      padding: '20px',
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
          {expense.category}
        </div>
        <div style={{ color: colors.textSecondary, fontSize: '14px', marginBottom: '4px' }}>
          {expense.description}
        </div>
        <div style={{ color: colors.textSecondary, fontSize: '14px' }}>
          {expense.date}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
          {expense.amount} {expense.currency}
        </div>
        <div style={{ color: colors.textSecondary, fontSize: '12px', marginBottom: '8px' }}>
          Base: {expense.base_amount} {expense.base_currency}
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: statusColors[expense.status] + '20',
          color: statusColors[expense.status],
          padding: '6px 12px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          {statusIcons[expense.status]}
          {expense.status}
        </div>
      </div>
    </div>
  );
}

// Submit Expense Component
function SubmitExpense({ user, onSuccess }) {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    category: 'Travel',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [useOCR, setUseOCR] = useState(false);

  const categories = ['Travel', 'Food', 'Lodging', 'Miscellaneous', 'Office Supplies'];
  const currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          user_id: user.user_id
        })
      });

      if (response.ok) {
        alert('Expense submitted successfully!');
        onSuccess();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to submit expense');
      }
    } catch (error) {
      alert('Error submitting expense');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result.split(',')[1];
      
      try {
        const response = await fetch(`${API_BASE}/ocr/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_data: base64Data })
        });

        const data = await response.json();
        if (data.suggested_amount) {
          setFormData({
            ...formData,
            amount: data.suggested_amount,
            currency: data.suggested_currency || 'USD',
            category: data.suggested_category || 'Miscellaneous'
          });
          alert('Receipt scanned successfully!');
        } else {
          alert('Could not extract data from receipt');
        }
      } catch (error) {
        alert('OCR processing failed');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '28px', marginBottom: '24px' }}>Submit Expense</h2>
      
      <div style={{
        backgroundColor: colors.surface,
        padding: '32px',
        borderRadius: '12px',
        border: `2px solid ${colors.primary}`
      }}>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useOCR}
              onChange={(e) => setUseOCR(e.target.checked)}
            />
            <Camera size={18} color={colors.primary} />
            <span>Use OCR to scan receipt</span>
          </label>
        </div>

        {useOCR && (
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              padding: '32px',
              border: `2px dashed ${colors.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              backgroundColor: colors.bg
            }}>
              <Upload size={32} color={colors.primary} />
              <span style={{ color: colors.textSecondary }}>Click to upload receipt</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            label="Amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            required
          />

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: colors.textSecondary,
              fontSize: '14px'
            }}>
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({...formData, currency: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '14px'
              }}
            >
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: colors.textSecondary,
              fontSize: '14px'
            }}>
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '14px'
              }}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />

          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: colors.success,
              color: colors.text,
              border: 'none',
              padding: '14px',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '8px'
            }}
          >
            {loading ? 'Submitting...' : 'Submit Expense'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Manage Users Component
function ManageUsers({ user }) {
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'Employee'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/users?company_id=${user.company_id}`);
      const data = await response.json();
      setUsers(data);
      setManagers(data.filter(u => u.role === 'Manager' || u.role === 'Admin'));
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE}/admin/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          company_id: user.company_id,
          requester_role: user.role
        })
      });

      if (response.ok) {
        alert('User created successfully!');
        setShowForm(false);
        setFormData({ email: '', password: '', full_name: '', role: 'Employee' });
        loadUsers();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to create user');
      }
    } catch (error) {
      alert('Error creating user');
    }
  };

  const handleAssignManager = async (employeeId, managerId) => {
    try {
      const response = await fetch(`${API_BASE}/admin/assign-manager`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          manager_id: managerId,
          requester_role: user.role
        })
      });

      if (response.ok) {
        alert('Manager assigned successfully!');
        loadUsers();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to assign manager');
      }
    } catch (error) {
      alert('Error assigning manager');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '28px' }}>Manage Users</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            backgroundColor: colors.primary,
            color: colors.bg,
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {showForm && (
        <div style={{
          backgroundColor: colors.surface,
          padding: '32px',
          borderRadius: '12px',
          border: `2px solid ${colors.primary}`,
          marginBottom: '24px'
        }}>
          <h3 style={{ marginBottom: '20px' }}>Create New User</h3>
          <form onSubmit={handleSubmit}>
            <Input
              label="Full Name"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              required
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: colors.textSecondary,
                fontSize: '14px'
              }}>
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  color: colors.text,
                  fontSize: '14px'
                }}
              >
                <option value="Employee">Employee</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                backgroundColor: colors.success,
                color: colors.text,
                border: 'none',
                padding: '14px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Create User
            </button>
          </form>
        </div>
      )}

      <div style={{
        backgroundColor: colors.surface,
        padding: '24px',
        borderRadius: '12px',
        border: `1px solid ${colors.border}`
      }}>
        {loading ? (
          <p style={{ color: colors.textSecondary, textAlign: 'center' }}>Loading users...</p>
        ) : users.length === 0 ? (
          <p style={{ color: colors.textSecondary, textAlign: 'center' }}>No users found</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {users.map((u) => (
              <div key={u.id} style={{
                backgroundColor: colors.bg,
                padding: '16px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{u.full_name}</div>
                  <div style={{ color: colors.textSecondary, fontSize: '14px' }}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {u.role === 'Employee' && (
                    <select
                      value={u.manager_id || ''}
                      onChange={(e) => handleAssignManager(u.id, e.target.value || null)}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
                        color: colors.text,
                        fontSize: '14px'
                      }}
                    >
                      <option value="">No Manager</option>
                      {managers.map(m => (
                        <option key={m.id} value={m.id}>{m.full_name}</option>
                      ))}
                    </select>
                  )}
                  <div style={{
                    backgroundColor: colors.primary + '20',
                    color: colors.primary,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {u.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
// Approve Expenses Component
function ApproveExpenses({ user }) {
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPendingExpenses();
  }, []);

  const loadPendingExpenses = async () => {
    setLoading(true);
    try {
      const url = user.role === 'Manager' 
        ? `${API_BASE}/expenses/pending?company_id=${user.company_id}&manager_id=${user.user_id}`
        : `${API_BASE}/expenses/pending?company_id=${user.company_id}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setPendingExpenses(data);
    } catch (error) {
      console.error('Error loading pending expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (expenseId, status) => {
    try {
      const response = await fetch(`${API_BASE}/expenses/approve/${expenseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          manager_id: user.user_id,
          requester_role: user.role
        })
      });

      if (response.ok) {
        alert(`Expense ${status.toLowerCase()} successfully!`);
        setPendingExpenses(pendingExpenses.filter(e => e.id !== expenseId));
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update expense');
      }
    } catch (error) {
      alert('Error updating expense');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '28px', marginBottom: '24px' }}>Pending Approvals</h2>

      {loading ? (
        <div style={{
          backgroundColor: colors.surface,
          padding: '48px',
          borderRadius: '12px',
          textAlign: 'center',
          color: colors.textSecondary
        }}>
          Loading...
        </div>
      ) : pendingExpenses.length === 0 ? (
        <div style={{
          backgroundColor: colors.surface,
          padding: '48px',
          borderRadius: '12px',
          textAlign: 'center',
          color: colors.textSecondary
        }}>
          No pending approvals
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pendingExpenses.map((expense) => (
            <div key={expense.id} style={{
              backgroundColor: colors.surface,
              padding: '20px',
              borderRadius: '12px',
              border: `1px solid ${colors.border}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {expense.category}
                  </div>
                  <div style={{ color: colors.textSecondary, fontSize: '14px', marginBottom: '4px' }}>
                    {expense.description}
                  </div>
                  <div style={{ color: colors.textSecondary, fontSize: '14px' }}>
                    Date: {expense.date}
                  </div>
                  <div style={{ color: colors.textSecondary, fontSize: '14px' }}>
                    Submitted by: {expense.user_name}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.primary }}>
                    {expense.amount} {expense.currency}
                  </div>
                  <div style={{ color: colors.textSecondary, fontSize: '12px', marginBottom: '12px' }}>
                    Base: {expense.base_amount} {expense.base_currency}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleApproval(expense.id, 'Approved')}
                      style={{
                        backgroundColor: colors.success,
                        color: colors.text,
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 'bold'
                      }}
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproval(expense.id, 'Rejected')}
                      style={{
                        backgroundColor: colors.error,
                        color: colors.text,
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 'bold'
                      }}
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;