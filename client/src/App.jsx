import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard      from './pages/Dashboard.jsx';
import Products       from './pages/Products.jsx';
import Calculator     from './pages/Calculator.jsx';
import Results        from './pages/Results.jsx';
import Settings       from './pages/Settings.jsx';
import AlgorithmGuide from './pages/AlgorithmGuide.jsx';

const navItems = [
  { to: '/',           label: 'Dashboard',   exact: true },
  { to: '/products',   label: 'Products' },
  { to: '/calculator', label: 'Calculator' },
  { to: '/results',    label: 'Results' },
  { to: '/settings',   label: 'Settings' },
  { to: '/algorithm',  label: 'How It Works' },
];

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="bg-navy-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-0 flex items-center gap-6">
          {/* Logo */}
          <a href="/" className="shrink-0 flex items-center">
            <img
              src="/exverge logo.webp"
              alt="Exverge"
              className="h-14 w-auto object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </a>

          {/* Divider */}
          <div className="h-8 w-px bg-white/20 hidden sm:block" />

          {/* Tool name */}
          <div className="hidden sm:block">
            <p className="text-xs text-navy-300 leading-none">Amazon India</p>
            <p className="text-sm font-semibold leading-snug">Price Calculator</p>
          </div>

          {/* Nav */}
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
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/products"   element={<Products />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/results"    element={<Results />} />
          <Route path="/settings"   element={<Settings />} />
          <Route path="/algorithm"  element={<AlgorithmGuide />} />
        </Routes>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-navy-900 text-navy-300 text-xs text-center py-3 mt-6">
        Built by <span className="text-white font-medium">Exverge™</span> — Amazon India Price Engine
      </footer>
    </div>
  );
}
