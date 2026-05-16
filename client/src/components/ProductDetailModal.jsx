import { useEffect, useState } from 'react';
import { calcScenarios } from '../services/api.js';
import ScenarioChart from './ScenarioChart.jsx';
import CostBreakdown from './CostBreakdown.jsx';
import RecommendationBadge from './RecommendationBadge.jsx';

const abs = v => Math.abs(parseFloat(v ?? 0)).toFixed(2);

const ROW_BG = {
  OPTIMAL:  '',
  WARNING:  'bg-amber-50',
  ALERT:    'bg-rust-50',
  CRITICAL: 'bg-red-50',
};

export default function ProductDetailModal({ result, onClose }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [selScenario, setSelScenario] = useState(null);
  const [view, setView]       = useState('breakdown'); // 'breakdown' | 'table'

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    calcScenarios({
      product: {
        manufacturingCost: parseFloat(result.manufacturing_cost),
        weightGm:          parseFloat(result.weight_gm),
        lengthCm:          parseFloat(result.length_cm),
        widthCm:           parseFloat(result.width_cm),
        heightCm:          parseFloat(result.height_cm),
        categoryName:      result.category_name,
      },
    })
      .then(d => { if (!cancelled) { setData(d); setSelScenario(null); } })
      .catch(() => { if (!cancelled) setError('Failed to calculate scenarios.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [result]);

  const best    = data?.best;
  const display = selScenario ?? best;
  const rec     = best?.recommendation;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-6 px-3">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b">
          <div>
            <p className="text-xs text-gray-400 font-mono">#{result.sr_no} · {result.category_name}</p>
            <h2 className="text-xl font-bold">{result.product_name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Cost ₹{parseFloat(result.manufacturing_cost).toFixed(0)} ·
              {result.weight_gm}g ·
              {result.length_cm}×{result.width_cm}×{result.height_cm} cm
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        {loading && (
          <div className="p-10 text-center text-gray-400">Calculating all 26 scenarios…</div>
        )}
        {error && (
          <div className="p-6 text-red-500 text-sm">{error}</div>
        )}

        {data && best && (
          <div className="p-6 space-y-6">

            {/* Best scenario summary + recommendation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Best Listing Price</p>
                    <p className="text-3xl font-bold">₹{parseFloat(best.listingPriceGST).toFixed(0)}</p>
                    <p className="text-xs text-gray-500">{(best.margin * 100).toFixed(1)}% margin · ₹{parseFloat(best.netProfit).toFixed(2)} net profit/unit</p>
                  </div>
                  <RecommendationBadge recommendation={rec} compact />
                </div>
                {best.priceBand && (
                  <p className="text-xs text-gray-400 border-t pt-2">
                    Market band ₹{Math.round(best.priceBand.min)}–₹{Math.round(best.priceBand.max)} · sweet ₹{Math.round(best.priceBand.sweet)}
                  </p>
                )}
                {rec && !best.isOptimal && (
                  <RecommendationBadge recommendation={rec} />
                )}

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  {[
                    ['Seller Costs',    `₹${abs(best.sellerCosts)}`],
                    ['Fulfilment',      `₹${abs(best.fulfilmentCost)}`],
                    ['Amazon Charges',  `₹${abs(best.amazonCharges)}`],
                    ['Return Charges',  `₹${parseFloat(best.returnCharges).toFixed(2)}`],
                    ['Selling Price',   `₹${parseFloat(best.sellingPrice).toFixed(2)}`],
                    ['Profit on Cost',  `${(data.profitOnCost * 100).toFixed(1)}%`],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-gray-400">{l}</p>
                      <p className="font-semibold">{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost breakdown pie — shows selected or best */}
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  {selScenario
                    ? `Cost breakdown at ₹${selScenario.listingPriceGST} (selected)`
                    : 'Cost breakdown at best price'}
                </p>
                <CostBreakdown result={display} />
              </div>
            </div>

            {/* Chart */}
            <div className="bg-gray-50 rounded-xl p-4">
              <ScenarioChart scenarios={data.scenarios} bestPrice={best.listingPriceGST} />
            </div>

            {/* Scenario table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold">All 26 Scenarios</p>
                <p className="text-xs text-gray-400">Click a row to see its cost breakdown above</p>
              </div>
              <div className="overflow-x-auto rounded-xl border">
                <table className="min-w-full text-xs">
                  <thead className="bg-navy-900 text-white">
                    <tr>
                      {['Price','Selling','Seller Costs','Fulfilment','Amazon','Return','Net Profit','Margin%','Factor','In Band'].map(h => (
                        <th key={h} className="px-3 py-2 text-right first:text-left whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.scenarios.map((s, i) => {
                      const isBest     = s.listingPriceGST === best.listingPriceGST;
                      const isSelected = selScenario?.listingPriceGST === s.listingPriceGST;
                      const inBand     = best.priceBand &&
                        s.listingPriceGST >= best.priceBand.min &&
                        s.listingPriceGST <= best.priceBand.max;
                      return (
                        <tr
                          key={i}
                          onClick={() => setSelScenario(isSelected ? null : s)}
                          className={`cursor-pointer ${
                            isBest     ? 'bg-rust-50 font-semibold' :
                            isSelected ? 'bg-blue-50' :
                            parseFloat(s.netProfit) < 0 ? 'bg-red-50/40 text-gray-400' :
                            'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-3 py-1.5">{isBest ? '★ ' : ''}₹{s.listingPriceGST}</td>
                          <td className="px-3 py-1.5 text-right">₹{parseFloat(s.sellingPrice).toFixed(0)}</td>
                          <td className="px-3 py-1.5 text-right text-red-500">₹{abs(s.sellerCosts)}</td>
                          <td className="px-3 py-1.5 text-right text-red-500">₹{abs(s.fulfilmentCost)}</td>
                          <td className="px-3 py-1.5 text-right text-red-500">₹{abs(s.amazonCharges)}</td>
                          <td className="px-3 py-1.5 text-right">₹{parseFloat(s.returnCharges).toFixed(2)}</td>
                          <td className={`px-3 py-1.5 text-right font-medium ${parseFloat(s.netProfit) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            ₹{parseFloat(s.netProfit).toFixed(2)}
                          </td>
                          <td className="px-3 py-1.5 text-right">{(s.margin * 100).toFixed(1)}%</td>
                          <td className="px-3 py-1.5 text-right">{parseFloat(s.multiplier).toFixed(2)}×</td>
                          <td className="px-3 py-1.5 text-center">{inBand ? '✓' : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
