import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Dashboard      from './pages/Dashboard.jsx';
import Products       from './pages/Products.jsx';
import Calculator     from './pages/Calculator.jsx';
import Results        from './pages/Results.jsx';
import Settings       from './pages/Settings.jsx';
import AlgorithmGuide from './pages/AlgorithmGuide.jsx';
import Login          from './pages/Login.jsx';
import Signup         from './pages/Signup.jsx';

const navItems = [
  { to: '/',           label: 'Dashboard',   exact: true },
  { to: '/products',   label: 'Products' },
  { to: '/calculator', label: 'Calculator' },
  { to: '/results',    label: 'Results' },
  { to: '/settings',   label: 'Settings' },
  { to: '/algorithm',  label: 'How It Works' },
];

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppShell() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header (only when logged in) ── */}
      {isAuthenticated && (
        <header className="bg-navy-900 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-0 flex items-center gap-6">
            <a href="/" className="shrink-0 flex items-center">
              <img
                src="/exverge logo.webp"
                alt="Exverge"
                className="h-14 w-auto object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </a>

            <div className="h-8 w-px bg-white/20 hidden sm:block" />

            <div className="hidden sm:block">
              <p className="text-xs text-navy-300 leading-none">Amazon India</p>
              <p className="text-sm font-semibold leading-snug">Price Calculator</p>
            </div>

            <nav className="flex gap-1 ml-auto flex-wrap">
              {navItems.map(({ to, label, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={exact}
                  className={({ isActive }) =>
                    `px-3 py-5 text-sm font-medium transition-colors border-b-2 ${
                      isActive
                        ? 'border-rust-500 text-white'
                        : 'border-transparent text-navy-200 hover:text-white hover:border-navy-300'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* User badge + logout */}
            <div className="flex items-center gap-3 ml-2 shrink-0">
              <span className="hidden sm:block text-xs text-navy-300 max-w-[120px] truncate">
                {user?.name}
              </span>
              <button
                onClick={logout}
                className="text-xs text-navy-300 hover:text-white border border-navy-600 hover:border-navy-400 px-3 py-1.5 rounded-lg transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </header>
      )}

      {/* ── Routes ── */}
      <main className={`flex-1 ${isAuthenticated ? 'max-w-7xl mx-auto w-full px-4 py-6' : ''}`}>
        <Routes>
          {/* Public */}
          <Route path="/login"  element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected */}
          <Route path="/"           element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/products"   element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="/calculator" element={<ProtectedRoute><Calculator /></ProtectedRoute>} />
          <Route path="/results"    element={<ProtectedRoute><Results /></ProtectedRoute>} />
          <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/algorithm"  element={<ProtectedRoute><AlgorithmGuide /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* ── Footer (only when logged in) ── */}
      {isAuthenticated && (
        <footer className="bg-navy-900 text-navy-300 text-xs text-center py-3 mt-6">
          Built by <span className="text-white font-medium">Exverge™</span> — Amazon India Price Engine
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
