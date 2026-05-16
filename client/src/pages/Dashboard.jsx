import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getResults, calcBatch } from '../services/api.js';
import RecommendationBadge from '../components/RecommendationBadge.jsx';
import ProductDetailModal  from '../components/ProductDetailModal.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useState } from 'react';

function StatCard({ label, value, sub, highlight }) {
  return (
    <div className={`rounded-xl shadow p-5 ${highlight ? 'bg-navy-900 text-white' : 'bg-white'}`}>
      <p className={`text-xs uppercase tracking-wide ${highlight ? 'text-navy-300' : 'text-gray-500'}`}>{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className={`text-sm mt-1 ${highlight ? 'text-navy-200' : 'text-gray-500'}`}>{sub}</p>}
    </div>
  );
}

const ROW_BG = {
  OPTIMAL:  'hover:bg-green-50',
  WARNING:  'bg-amber-50 hover:bg-amber-100',
  ALERT:    'bg-rust-50 hover:bg-rust-100',
  CRITICAL: 'bg-red-50 hover:bg-red-100',
};

export default function Dashboard() {
  const qc = useQueryClient();
  const { data: results = [], isLoading } = useQuery({ queryKey: ['results'], queryFn: getResults });
  const [msg, setMsg]           = useState('');
  const [selectedResult, setSelectedResult] = useState(null);

  const batch = useMutation({
    mutationFn: calcBatch,
    onSuccess: (d) => {
      setMsg(`✅ Calculated ${d.count} products.`);
      qc.invalidateQueries({ queryKey: ['results'] });
    },
    onError: () => setMsg('❌ Batch run failed. Is the server running?'),
  });

  const avgMargin = results.length
    ? (results.reduce((s, r) => s + parseFloat(r.margin_pct ?? 0), 0) / results.length * 100).toFixed(1)
    : '—';

  const top = results.length
    ? results.reduce((b, r) => parseFloat(r.margin_pct) > parseFloat(b.margin_pct) ? r : b, results[0])
    : null;

  const atRisk = results.filter(r => r.fallback_level && r.fallback_level !== null).length;

  const chartData = [...results]
    .sort((a, b) => parseFloat(b.net_profit) - parseFloat(a.net_profit))
    .slice(0, 10)
    .map(r => ({ name: r.product_name?.split(' ').slice(0, 2).join(' '), profit: parseFloat(r.net_profit) }));

  return (
    <div className="space-y-6">
      {selectedResult && (
        <ProductDetailModal result={selectedResult} onClose={() => setSelectedResult(null)} />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm">{msg}</span>}
          <button
            onClick={() => batch.mutate()}
            disabled={batch.isPending}
            className="bg-rust-600 hover:bg-rust-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {batch.isPending ? 'Running…' : '▶ Run All Products'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Products Calculated" value={results.length} />
        <StatCard label="Avg Margin %" value={`${avgMargin}%`} />
        <StatCard
          label="Top Performer"
          value={top ? `₹${parseFloat(top.best_listing_price).toFixed(0)}` : '—'}
          sub={top ? `${top.product_name} · ${(parseFloat(top.margin_pct) * 100).toFixed(1)}%` : ''}
          highlight
        />
        <StatCard label="Need Attention" value={atRisk} sub="Below target or loss-making" />
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Top 10 by Net Profit (₹)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`₹${v.toFixed(2)}`, 'Net Profit']} />
              <Bar dataKey="profit" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#1a3a6e' : '#b84a18'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-400">Loading…</p>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">
          No results yet — click <strong>Run All Products</strong> to calculate.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <p className="px-4 pt-3 pb-1 text-xs text-gray-400">Click any row to see all 26 scenarios and cost breakdown.</p>
          <table className="min-w-full text-sm">
            <thead className="bg-navy-900 text-white text-xs uppercase">
              <tr>
                {['#', 'Product', 'Category', 'Cost', 'Best Price', 'Net Profit', 'Margin', 'Status'].map(h => (
                  <th key={h} className="px-4 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map(r => {
                const rec = typeof r.recommendation === 'string' ? JSON.parse(r.recommendation) : r.recommendation;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedResult(r)}
                    className={`cursor-pointer ${ROW_BG[rec?.status] ?? 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-2 text-gray-400">{r.sr_no}</td>
                    <td className="px-4 py-2 font-medium hover:text-rust-600 transition-colors">{r.product_name}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{r.category_name}</td>
                    <td className="px-4 py-2">₹{parseFloat(r.manufacturing_cost).toFixed(0)}</td>
                    <td className="px-4 py-2 font-semibold text-navy-900">₹{parseFloat(r.best_listing_price).toFixed(0)}</td>
                    <td className="px-4 py-2">₹{parseFloat(r.net_profit).toFixed(2)}</td>
                    <td className="px-4 py-2">{(parseFloat(r.margin_pct) * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2"><RecommendationBadge recommendation={rec} compact /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
