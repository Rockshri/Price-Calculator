import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCategories, calcScenarios } from '../services/api.js';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend, Cell,
} from 'recharts';
import CostBreakdown from './CostBreakdown.jsx';
import RecommendationBadge from './RecommendationBadge.jsx';

const INITIAL = {
  manufacturingCost: 224,
  weightGm: 197,
  lengthCm: 39,
  widthCm: 37,
  heightCm: 2.5,
  categoryName: 'Handbags',
};

const abs = v => Math.abs(parseFloat(v ?? 0)).toFixed(2);

// ─── Slider ──────────────────────────────────────────────────────────────────
function Slider({ label, value, min, max, step, format, onChange, color = 'rust' }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className={`text-xs font-mono font-semibold text-${color}-600`}>{format(value)}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, #b84a18 ${pct}%, #e5e7eb ${pct}%)` }}
      />
      <div className="flex justify-between text-[10px] text-gray-300 mt-0.5">
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );
}

// ─── Comparison chart ─────────────────────────────────────────────────────────
function ComparisonChart({ base, compare }) {
  if (!base?.scenarios) return null;

  const compareMap = {};
  if (compare?.scenarios) {
    compare.scenarios.forEach(s => { compareMap[s.listingPriceGST] = s; });
  }

  const data = base.scenarios.map(s => {
    const cmp = compareMap[s.listingPriceGST];
    return {
      price:       `₹${s.listingPriceGST}`,
      baseMargin:  parseFloat((s.margin * 100).toFixed(2)),
      baseProfit:  parseFloat(s.netProfit.toFixed(2)),
      cmpMargin:   cmp ? parseFloat((cmp.margin * 100).toFixed(2)) : null,
      cmpProfit:   cmp ? parseFloat(cmp.netProfit.toFixed(2)) : null,
      isBest:      s.listingPriceGST === base.best?.listingPriceGST,
      isCmpBest:   compare && cmp && s.listingPriceGST === compare.best?.listingPriceGST,
    };
  });

  const hasCompare = compare?.scenarios;

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Margin % across price points
        {hasCompare && <span className="ml-2 text-xs font-normal text-blue-500">— showing baseline vs modified</span>}
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="price" angle={-45} textAnchor="end" tick={{ fontSize: 10 }} />
          <YAxis unit="%" tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v, name) => [`${v}%`, name]}
            labelFormatter={l => l}
          />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 2" />
          <Bar dataKey="baseMargin" name="Base margin" radius={[4, 4, 0, 0]} barSize={hasCompare ? 8 : 14}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.isBest ? '#16a34a' : d.baseMargin >= 0 ? '#b84a18' : '#fbc4a5'} />
            ))}
          </Bar>
          {hasCompare && (
            <Line
              type="monotone"
              dataKey="cmpMargin"
              name="Modified margin"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="4 2"
              dot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Delta badge ─────────────────────────────────────────────────────────────
function Delta({ base, compare, label, format }) {
  if (!compare) return null;
  const diff = compare - base;
  if (Math.abs(diff) < 0.001) return <span className="text-xs text-gray-400">no change</span>;
  const pos = diff > 0;
  return (
    <span className={`text-xs font-semibold ${pos ? 'text-green-600' : 'text-red-500'}`}>
      {pos ? '▲' : '▼'} {format(Math.abs(diff))}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LiveCalculator() {
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  // Base form
  const [form, setForm] = useState(INITIAL);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [selScenario, setSelScenario] = useState(null);
  const timerRef = useRef(null);

  // Sensitivity sliders
  const [costAdj, setCostAdj]   = useState(0);      // % change −40..+40
  const [retRate, setRetRate]   = useState(null);    // null = use DB default
  const [mktRate, setMktRate]   = useState(null);
  const [cmpResult, setCmpResult] = useState(null);
  const [cmpLoading, setCmpLoading] = useState(false);
  const cmpTimerRef = useRef(null);

  const [showSensitivity, setShowSensitivity] = useState(false);
  const [activeSliders, setActiveSliders]     = useState(false);

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })); }

  // Base calculation (debounced)
  const calculate = useCallback(async (f) => {
    setLoading(true);
    setError('');
    try {
      const res = await calcScenarios({
        product: {
          manufacturingCost: Number(f.manufacturingCost),
          weightGm:          Number(f.weightGm),
          lengthCm:          Number(f.lengthCm),
          widthCm:           Number(f.widthCm),
          heightCm:          Number(f.heightCm),
          categoryName:      f.categoryName,
        },
      });
      setResult(res);
      setSelScenario(null);
      setCmpResult(null); // reset comparison when base changes
    } catch {
      setError('Calculation failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const { manufacturingCost, weightGm, lengthCm, widthCm, heightCm } = form;
    if (!manufacturingCost || !weightGm || !lengthCm || !widthCm || !heightCm) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => calculate(form), 300);
    return () => clearTimeout(timerRef.current);
  }, [form, calculate]);

  // Sensitivity comparison calculation
  const calculateCompare = useCallback(async (f, ca, rr, mr) => {
    const adjCost = Number(f.manufacturingCost) * (1 + ca / 100);
    const override = {};
    if (rr !== null) override.returnRate    = rr / 100;
    if (mr !== null) override.marketingRate = mr / 100;

    setCmpLoading(true);
    try {
      const res = await calcScenarios({
        product: {
          manufacturingCost: adjCost,
          weightGm:          Number(f.weightGm),
          lengthCm:          Number(f.lengthCm),
          widthCm:           Number(f.widthCm),
          heightCm:          Number(f.heightCm),
          categoryName:      f.categoryName,
        },
        settingsOverride: override,
      });
      setCmpResult(res);
    } catch { /* ignore */ }
    finally { setCmpLoading(false); }
  }, []);

  const slidersAreDefault = costAdj === 0 && retRate === null && mktRate === null;

  useEffect(() => {
    if (!showSensitivity) return;
    if (slidersAreDefault) { setCmpResult(null); return; }
    if (!form.manufacturingCost) return;
    clearTimeout(cmpTimerRef.current);
    cmpTimerRef.current = setTimeout(
      () => calculateCompare(form, costAdj, retRate, mktRate), 400
    );
    return () => clearTimeout(cmpTimerRef.current);
  }, [form, costAdj, retRate, mktRate, showSensitivity, calculateCompare, slidersAreDefault]);

  const best    = result?.best;
  const display = selScenario ?? best;
  const cmpBest = cmpResult?.best;

  const retDefault  = 15; // default %
  const mktDefault  = 20;

  return (
    <div className="space-y-6">
      {/* ── Inputs ── */}
      <div className="bg-white rounded-xl shadow p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          ['Manufacturing Cost (₹)', 'manufacturingCost'],
          ['Weight (gm)',            'weightGm'],
          ['Length (cm)',            'lengthCm'],
          ['Width (cm)',             'widthCm'],
          ['Height (cm)',            'heightCm'],
        ].map(([label, key]) => (
          <div key={key}>
            <label className="block text-xs text-gray-500 mb-1">{label}</label>
            <input
              type="number" step="any"
              value={form[key]}
              onChange={set(key)}
              className="w-full border rounded px-3 py-1.5 text-sm"
            />
          </div>
        ))}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Category</label>
          <select
            value={form.categoryName}
            onChange={set('categoryName')}
            className="w-full border rounded px-3 py-1.5 text-sm"
          >
            {categories.map(c => (
              <option key={c.id} value={c.category_name}>{c.category_name}</option>
            ))}
          </select>
        </div>
        {loading && <p className="col-span-full text-sm text-rust-600">Calculating…</p>}
        {error   && <p className="col-span-full text-sm text-red-500">{error}</p>}
      </div>

      {/* ── Best scenario + cost breakdown ── */}
      {best && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold text-gray-700">Best Scenario</h2>
              <RecommendationBadge recommendation={best.recommendation} compact />
            </div>
            {best.priceBand && (
              <p className="text-xs text-gray-400">
                Market band ₹{Math.round(best.priceBand.min)}–₹{Math.round(best.priceBand.max)}
                {' '}· sweet spot ₹{Math.round(best.priceBand.sweet)}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Listing Price (incl. GST)', `₹${parseFloat(best.listingPriceGST).toFixed(0)}`],
                ['Selling Price (excl. GST)', `₹${parseFloat(best.sellingPrice).toFixed(2)}`],
                ['Seller Side Costs',         `₹${abs(best.sellerCosts)}`],
                ['Fulfilment Cost',           `₹${abs(best.fulfilmentCost)}`],
                ['Amazon Charges',            `₹${abs(best.amazonCharges)}`],
                ['Return Charges',            `₹${parseFloat(best.returnCharges).toFixed(2)}`],
                ['Net Profit / Unit',         `₹${parseFloat(best.netProfit).toFixed(2)}`],
                ['Margin %',                  `${(best.margin * 100).toFixed(2)}%`],
                ['Profit on Cost %',          `${(result.profitOnCost * 100).toFixed(2)}%`],
                ['Multiplying Factor',        `${parseFloat(best.multiplier).toFixed(2)}×`],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="font-semibold">{val}</p>
                </div>
              ))}
            </div>
            {!best.isOptimal && (
              <div className="pt-2">
                <RecommendationBadge recommendation={best.recommendation} />
              </div>
            )}
          </div>

          <CostBreakdown result={display} />
        </div>
      )}

      {/* ── Sensitivity Analysis ── */}
      {result && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <button
            onClick={() => setShowSensitivity(s => !s)}
            className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <span>Sensitivity Analysis — What-If Slicers</span>
            <span className="text-gray-400 text-xs">{showSensitivity ? '▲ Collapse' : '▼ Expand'}</span>
          </button>

          {showSensitivity && (
            <div className="border-t p-6 space-y-6">
              <p className="text-xs text-gray-500">
                Adjust sliders to model cost changes or rate assumptions.
                The modified result overlays in <span className="text-blue-500 font-medium">blue</span> on the chart below.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <Slider
                    label="Manufacturing Cost adjustment"
                    value={costAdj}
                    min={-40} max={40} step={1}
                    format={v => `${v > 0 ? '+' : ''}${v}%`}
                    onChange={setCostAdj}
                  />
                  {costAdj !== 0 && (
                    <p className="text-xs text-gray-400 text-center">
                      ₹{Number(form.manufacturingCost).toFixed(0)} → ₹{(Number(form.manufacturingCost) * (1 + costAdj / 100)).toFixed(0)}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <Slider
                    label="Return rate override"
                    value={retRate ?? retDefault}
                    min={0} max={40} step={1}
                    format={v => `${v}%`}
                    onChange={v => setRetRate(v === retDefault ? null : v)}
                    color="blue"
                  />
                  {retRate !== null && (
                    <p className="text-xs text-gray-400 text-center">DB default {retDefault}% → {retRate}%</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Slider
                    label="Marketing rate override"
                    value={mktRate ?? mktDefault}
                    min={0} max={30} step={1}
                    format={v => `${v}%`}
                    onChange={v => setMktRate(v === mktDefault ? null : v)}
                    color="purple"
                  />
                  {mktRate !== null && (
                    <p className="text-xs text-gray-400 text-center">DB default {mktDefault}% → {mktRate}%</p>
                  )}
                </div>
              </div>

              {!slidersAreDefault && (
                <button
                  onClick={() => { setCostAdj(0); setRetRate(null); setMktRate(null); setCmpResult(null); }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Reset to defaults
                </button>
              )}

              {/* Delta summary */}
              {cmpBest && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-800 mb-3">Impact of changes</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    {[
                      {
                        label: 'Best Price',
                        base:  parseFloat(best.listingPriceGST),
                        cmp:   parseFloat(cmpBest.listingPriceGST),
                        fmt:   v => `₹${v.toFixed(0)}`,
                        fmtD:  v => `₹${v.toFixed(0)}`,
                      },
                      {
                        label: 'Net Profit',
                        base:  parseFloat(best.netProfit),
                        cmp:   parseFloat(cmpBest.netProfit),
                        fmt:   v => `₹${v.toFixed(2)}`,
                        fmtD:  v => `₹${v.toFixed(2)}`,
                      },
                      {
                        label: 'Margin %',
                        base:  best.margin * 100,
                        cmp:   cmpBest.margin * 100,
                        fmt:   v => `${v.toFixed(1)}%`,
                        fmtD:  v => `${v.toFixed(1)}pp`,
                      },
                      {
                        label: 'Modified Cost',
                        base:  Number(form.manufacturingCost),
                        cmp:   Number(form.manufacturingCost) * (1 + costAdj / 100),
                        fmt:   v => `₹${v.toFixed(0)}`,
                        fmtD:  v => `₹${v.toFixed(0)}`,
                      },
                    ].map(({ label, base, cmp, fmt, fmtD }) => (
                      <div key={label}>
                        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                        <p className="font-bold">{fmt(cmp)}</p>
                        <Delta base={base} compare={cmp} label={label} format={fmtD} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cmpLoading && <p className="text-xs text-blue-500">Recalculating modified scenario…</p>}

              {/* Comparison chart */}
              <div className="bg-gray-50 rounded-xl p-4">
                <ComparisonChart base={result} compare={cmpResult} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Scenario chart (baseline only) ── */}
      {result?.scenarios && !showSensitivity && (
        <div className="bg-white rounded-xl shadow p-6">
          <ComparisonChart base={result} compare={null} />
        </div>
      )}

      {/* ── Scenario table ── */}
      {result?.scenarios && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <p className="px-4 pt-3 pb-1 text-xs text-gray-400">Click a row to see its cost breakdown above.</p>
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase">
              <tr>
                {['Price (₹)','Sell Price','Seller Costs','Fulfilment','Amazon','Return','Net Profit','Margin%','Factor','Band'].map(h => (
                  <th key={h} className="px-3 py-2 text-right first:text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.scenarios.map((s, i) => {
                const isBest     = best && s.listingPriceGST === best.listingPriceGST;
                const isSelected = selScenario?.listingPriceGST === s.listingPriceGST;
                const inBand     = best?.priceBand &&
                  s.listingPriceGST >= best.priceBand.min &&
                  s.listingPriceGST <= best.priceBand.max;
                const cmpRow = cmpResult?.scenarios?.find(c => c.listingPriceGST === s.listingPriceGST);
                return (
                  <tr
                    key={i}
                    onClick={() => setSelScenario(isSelected ? null : s)}
                    className={`cursor-pointer ${
                      isBest     ? 'bg-rust-50 font-semibold' :
                      isSelected ? 'bg-blue-50' :
                      parseFloat(s.netProfit) < 0 ? 'opacity-50' :
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
                      {cmpRow && (
                        <span className={`ml-1 text-[10px] ${cmpRow.netProfit > s.netProfit ? 'text-blue-500' : 'text-red-400'}`}>
                          {cmpRow.netProfit > s.netProfit ? '▲' : '▼'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      {(s.margin * 100).toFixed(1)}%
                      {cmpRow && (
                        <span className={`ml-1 text-[10px] ${cmpRow.margin > s.margin ? 'text-blue-500' : 'text-red-400'}`}>
                          {cmpRow.margin > s.margin ? '▲' : '▼'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-right">{parseFloat(s.multiplier).toFixed(2)}×</td>
                    <td className="px-3 py-1.5 text-center text-gray-400">{inBand ? '✓' : '—'}</td>
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
