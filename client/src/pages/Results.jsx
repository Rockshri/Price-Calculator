import { useQuery } from '@tanstack/react-query';
import { getResults } from '../services/api.js';
import { useState } from 'react';
import RecommendationBadge from '../components/RecommendationBadge.jsx';
import ProductDetailModal  from '../components/ProductDetailModal.jsx';

const ROW_BG = {
  OPTIMAL:  '',
  WARNING:  'bg-amber-50',
  ALERT:    'bg-rust-50',
  CRITICAL: 'bg-red-50',
};

const abs = v => Math.abs(parseFloat(v ?? 0)).toFixed(2);
const pct = v => `${(parseFloat(v ?? 0) * 100).toFixed(1)}%`;

export default function Results() {
  const { data: results = [], isLoading } = useQuery({ queryKey: ['results'], queryFn: getResults });
  const [selectedResult, setSelectedResult] = useState(null);

  function exportCsv() {
    const headers = ['#','Product','Category','Cost','Best Price','Seller Costs','Fulfilment',
                     'Amazon','Return','Net Profit','Margin %','Profit on Cost %','Status'];
    const rows = results.map(r => {
      const rec = typeof r.recommendation === 'string' ? JSON.parse(r.recommendation) : r.recommendation;
      return [
        r.sr_no, r.product_name, r.category_name,
        r.manufacturing_cost, r.best_listing_price,
        abs(r.seller_side_costs), abs(r.fulfilment_cost),
        abs(r.amazon_charges), abs(r.return_charges),
        parseFloat(r.net_profit).toFixed(2),
        pct(r.margin_pct), pct(r.profit_on_cost_pct),
        rec?.status,
      ];
    });
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'exverge_results.csv';
    a.click();
  }

  if (isLoading) return <p className="text-gray-400">Loading…</p>;

  return (
    <div className="space-y-4">
      {selectedResult && (
        <ProductDetailModal result={selectedResult} onClose={() => setSelectedResult(null)} />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy-900">Results</h1>
        <button
          onClick={exportCsv}
          disabled={!results.length}
          className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40 transition-colors"
        >
          Export CSV
        </button>
      </div>

      {!results.length ? (
        <div className="bg-white rounded-xl shadow p-10 text-center text-gray-400">
          No results yet — run <strong>Run All Products</strong> from the Dashboard.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <p className="px-4 pt-3 pb-1 text-xs text-gray-400">Click any row to drill into all 26 scenarios and cost breakdown.</p>
          <table className="min-w-full text-xs">
            <thead className="bg-navy-900 text-white">
              <tr>
                {['#','Product','Category','Cost','Best Price','Seller Costs','Fulfilment',
                  'Amazon','Return','Net Profit','Margin%','ROI%','Status'].map(h => (
                  <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>
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
                    className={`cursor-pointer ${ROW_BG[rec?.status] ?? ''} hover:brightness-95`}
                  >
                    <td className="px-3 py-1.5 text-gray-400">{r.sr_no}</td>
                    <td className="px-3 py-1.5 font-medium whitespace-nowrap hover:text-rust-600">{r.product_name}</td>
                    <td className="px-3 py-1.5 text-gray-500">{r.category_name}</td>
                    <td className="px-3 py-1.5">₹{parseFloat(r.manufacturing_cost).toFixed(0)}</td>
                    <td className="px-3 py-1.5 font-semibold text-navy-900">₹{parseFloat(r.best_listing_price).toFixed(0)}</td>
                    <td className="px-3 py-1.5 text-red-600">₹{abs(r.seller_side_costs)}</td>
                    <td className="px-3 py-1.5 text-red-600">₹{abs(r.fulfilment_cost)}</td>
                    <td className="px-3 py-1.5 text-red-600">₹{abs(r.amazon_charges)}</td>
                    <td className="px-3 py-1.5 text-red-600">₹{abs(r.return_charges)}</td>
                    <td className={`px-3 py-1.5 font-bold ${parseFloat(r.net_profit) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      ₹{parseFloat(r.net_profit).toFixed(2)}
                    </td>
                    <td className="px-3 py-1.5">{pct(r.margin_pct)}</td>
                    <td className="px-3 py-1.5">{pct(r.profit_on_cost_pct)}</td>
                    <td className="px-3 py-1.5"><RecommendationBadge recommendation={rec} compact /></td>
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
