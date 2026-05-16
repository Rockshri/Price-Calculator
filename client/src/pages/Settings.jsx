import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSetting, getCategoryRules, updateCategoryRule } from '../services/api.js';
import { useState } from 'react';

// ─── Field reference guide data ───────────────────────────────────────────────

const FIELD_GUIDE = [
  {
    key: 'min_multiplier',
    label: 'Min × — Minimum Multiplier',
    formula: 'band.min = MAX(cost × min_multiplier, abs_price_floor)',
    calc: 'Multiplies manufacturing cost by this factor to derive the lower edge of the acceptable price band.',
    interpret: 'A value of 3.0 means the algorithm will never recommend listing below 3× your cost within band. Prices below this lose too much brand positioning value even if profitable.',
    optimize: 'Start at 3× for handmade / artisanal goods. Lower to 2.5× for high-volume commodity categories. Raise to 4× for luxury or premium-positioned products with strong differentiation.',
    source: 'Amazon category search (filter by avg. selling price); Jungle Scout / Helium 10 price distribution report; your own historical conversion data by price tier.',
  },
  {
    key: 'sweet_multiplier',
    label: 'Sweet × — Sweet Spot Multiplier',
    formula: 'band.sweet = cost × sweet_multiplier',
    calc: 'Defines the single "ideal" price point. The conversion score function peaks for scenarios within 0–50% of (sweet − min) range.',
    interpret: 'This is the price your algorithm gravitates toward when all else is equal. It should sit near the highest-converting competitor price cluster, not at the extreme ends of the band.',
    optimize: 'Align with the modal price of your top 10 competitors. If most Handbags sell at ₹499–699 and your cost is ₹150, a 3.5–4× sweet multiplier (₹525–600) is appropriate.',
    source: 'Amazon Best Sellers Rank page for the sub-category; Keepa price history charts; Brand Analytics (Seller Central → Brand Analytics → Market Basket).',
  },
  {
    key: 'max_multiplier',
    label: 'Max × — Maximum Multiplier',
    formula: 'band.max = MIN(cost × max_multiplier, abs_price_ceiling)',
    calc: 'Sets the upper edge of the price band. Scenarios above this are only considered if no profitable option exists within the band (fallback Level 4).',
    interpret: 'A value of 5.5 means you are willing to list at up to 5.5× cost. Above this the market drops off steeply. The algorithm still scores these scenarios but they trigger OUTSIDE_MARKET_BAND status.',
    optimize: 'Check the 90th-percentile price in the category. Going above that typically tanks conversion. For unique/handmade items with no direct competitor, you can push this higher.',
    source: 'Amazon search sorted by "Price: High to Low"; AMZ Scout market analysis; your own conversion rate data segmented by price bracket.',
  },
  {
    key: 'min_margin_pct',
    label: 'Min Margin — Minimum Margin %',
    formula: 'margin = net_profit / selling_price_excl_gst',
    calc: 'The lowest acceptable net margin for a scenario to enter the OPTIMAL pool. Scenarios between min_margin and target_margin fall to fallback Level 2 (BELOW_TARGET_MARGIN → WARNING).',
    interpret: '0.10 = 10% net margin. At this level you are covering all costs but reinvestment capacity is slim. A WARNING badge prompts you to review cost structure before listing.',
    optimize: 'Should be high enough to survive bad months (high returns, delayed payments, ad spend spikes). For handmade goods: 10–15% min. For fast-moving FMCG: 5–8% may be acceptable.',
    source: 'Your P&L history (Seller Central → Business Reports → Payments); industry benchmarks (Marketplace Pulse, eCommerce India reports).',
  },
  {
    key: 'target_margin_pct',
    label: 'Target Margin — Target Margin %',
    formula: 'marginScore = MIN(actual_margin / target_margin, 1.5)',
    calc: 'The margin required for OPTIMAL status (fallback = null). Also anchors the margin scoring: a scenario exactly at target scores 1.0; 50% above scores 1.5 (capped).',
    interpret: '0.20 = 20% target margin. Achieving this means the product is healthy, profitable, and fundable. The margin score rewards overshooting — up to 1.5× bonus for 50% above target.',
    optimize: 'Set 5–10 percentage points above min_margin. Factor in Amazon fee inflation (~2–3% per year) and COGS variability. Revise annually after reviewing annual P&L.',
    source: 'Business plan targets; Deloitte / KPMG e-commerce profitability benchmarks (India MSME sector typically targets 20–28% net).',
  },
  {
    key: 'abs_price_floor',
    label: 'Floor ₹ — Absolute Price Floor',
    formula: 'band.min = MAX(cost × min_multiplier, abs_price_floor)',
    calc: 'Hard rupee minimum — overrides the multiplier-based min if the product cost is very low. Ensures you never list below a viable price regardless of cost.',
    interpret: 'If abs_price_floor = ₹199, even a ₹40-cost product (3× = ₹120) will not be listed below ₹199. This protects brand value and covers Amazon\'s fixed fees (closing fee + referral minimum).',
    optimize: 'Calculate the break-even price at which Amazon fees alone consume 80% of revenue. For Easy Ship + 0–300 bracket: closing ₹1 + referral ~9% means floor should be at least ₹150 for single-digit profit.',
    source: 'Amazon India Fee Calculator (sellercentral.amazon.in/hz/fba/profitabilitycalculator); your minimum viable margin analysis.',
  },
  {
    key: 'abs_price_ceiling',
    label: 'Ceiling ₹ — Absolute Price Ceiling',
    formula: 'band.max = MIN(cost × max_multiplier, abs_price_ceiling)',
    calc: 'Hard rupee maximum — caps the band even if cost × max_multiplier is very high. Prevents pricing into a tier where your category buyers simply do not shop.',
    interpret: 'If abs_price_ceiling = ₹2000, a ₹500-cost product (5.5× = ₹2750) will still be capped at ₹2000 for band scoring. Going above triggers OUTSIDE_MARKET_BAND.',
    optimize: 'Set just above the highest-converting price in your category. Review the "Customers also viewed" section — if all alternatives are under ₹X, that is your ceiling.',
    source: 'Amazon category browse page price filter data; Keepa category price history; Seller Central Brand Analytics price-band conversion report.',
  },
  {
    key: 'typical_return_rate',
    label: 'Return Rate — Typical Return Rate',
    formula: 'returnCharges = returnRate × (returnLogisticsCost + refundAdminFee)\nrefundAdminFee = listingPrice × (−0.20)  ← Amazon refunds 20%',
    calc: 'Category-specific return rate stored for reference. The global setting (calculator_settings.return_rate) is currently used in calculation; this field documents the expected rate for this category.',
    interpret: '0.15 = 15% of orders returned. Returns incur reverse logistics cost (₹75 default) minus Amazon\'s 20% refund of the listing price. Net return charge is usually positive (a cost).',
    optimize: 'Reduce returns by: (1) precise size/dimension info, (2) high-quality photos with scale reference, (3) accurate bullet points. Clothing: 20–35%; Bags: 10–18%; Stationery: 2–5%.',
    source: 'Seller Central → Reports → Return Report (download and compute return rate per ASIN); Amazon category benchmarks (Marketplace Pulse); FBA return rate dashboard.',
  },
  {
    key: 'weight_margin',
    label: 'W: Margin — Margin Score Weight',
    formula: 'score = (marginScore × weight_margin)\n       + (convScore   × weight_conversion)\n       + (profitScore × weight_profit_inr)',
    calc: 'Relative importance of margin % in the composite scoring function. All three weights should sum to approximately 1.0 for balanced scoring.',
    interpret: 'Higher weight_margin → algorithm strongly prefers the highest-margin scenario even if it is outside the sweet spot. Useful for low-volume premium products where every unit must contribute maximally.',
    optimize: 'Premium / craft / low-volume → increase (0.5+). High-volume FMCG / impulse buy → decrease (0.3). Rebalance when business priority shifts from margin protection to volume growth.',
    source: 'Internal business strategy; tune empirically by comparing recommended prices against your top-performing historical listings. Start at equal weights (0.33 each) and adjust.',
  },
  {
    key: 'weight_conversion',
    label: 'W: Conv — Conversion Score Weight',
    formula: 'convScore = conversionScore(price) + charmBonus(price)\nconversionScore: peaks at 1.0 in the sweet-spot zone (0–50% of band)',
    calc: 'Importance of the price being in the high-conversion zone of the band. conversionScore is a step function based on the price\'s position between band.min and band.max.',
    interpret: 'Higher weight_conversion → algorithm gravitates toward the sweet-spot price even if margin is slightly lower. Useful for impulse-buy categories where volume compensates for thinner margins.',
    optimize: 'Impulse / gifting / low-ticket (< ₹500) → increase (0.4+). Researched purchases / high-ticket → decrease (0.2). Corroborate with your category\'s price elasticity data.',
    source: 'Amazon Ads search term report (conversion rate by bid × price); A/B test results from Seller Central Manage Experiments; category search volume × conversion benchmarks.',
  },
  {
    key: 'weight_profit_inr',
    label: 'W: Profit — Absolute Profit Weight',
    formula: 'profitScore = s.netProfit / maxProfitInPool',
    calc: 'Importance of maximising rupee profit per unit (not %). Scenarios are normalised against the max net profit in the candidate pool, so this score is 0–1.',
    interpret: 'Higher weight_profit_inr → algorithm picks the scenario generating the most cash per unit, even if its margin % is slightly below the sweet spot. Critical for cash-flow-first businesses.',
    optimize: 'High-cost / high-ticket products (≥ ₹1000 listing) → increase (0.4+), because a 1% margin difference equals large rupee swings. Low-ticket (< ₹299) → decrease; margin % matters more.',
    source: 'Unit economics model (contribution per SKU); internal cash flow forecasts; Seller Central Payments → Transaction View (filter by product, compute net per order).',
  },
  {
    key: 'prefer_charm_pricing',
    label: 'Charm — Prefer Charm Pricing',
    formula: 'charmBonus = 0.05 if price ∈ [t−10, t) where t ∈ {250,500,750,1000,1500,2000,2500,3000,5000,10000}',
    calc: 'Adds a +0.05 boost to the conversion score when the listing price falls within ₹10 below a psychological threshold (e.g. ₹491–499, ₹991–999).',
    interpret: 'Consumers perceive ₹499 as meaningfully cheaper than ₹500. This nudges the algorithm toward those "just-under" prices when two scenarios score similarly. Effect is modest (0.05 vs typical conv score of 0.6–1.0).',
    optimize: 'Enable for all B2C consumer categories. Disable for B2B, luxury goods, or specialty items where round/premium numbers signal quality (a ₹5000 artisan bag may actually sell better at ₹5000 than ₹4999).',
    source: 'Behavioral economics literature (Schindler & Kirby 1997; Thomas & Morwitz 2005); Amazon India price rounding analysis on best-seller pages.',
  },
];

// ─── Global Settings tab ──────────────────────────────────────────────────────

function GlobalSettings() {
  const qc = useQueryClient();
  const { data: settings = [] } = useQuery({ queryKey: ['settings'], queryFn: getSettings });
  const [edits, setEdits] = useState({});
  const [saved, setSaved] = useState({});

  const mut = useMutation({
    mutationFn: ({ key, value }) => updateSetting(key, value),
    onSuccess: (_, { key }) => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      setSaved(s => ({ ...s, [key]: true }));
      setTimeout(() => setSaved(s => ({ ...s, [key]: false })), 1500);
    },
  });

  return (
    <div className="bg-white rounded-xl shadow divide-y divide-gray-100">
      {settings.map(s => (
        <div key={s.key} className="flex items-center gap-4 px-5 py-3">
          <div className="flex-1">
            <p className="font-mono text-sm font-medium text-navy-900">{s.key}</p>
            {s.description && <p className="text-xs text-gray-400">{s.description}</p>}
          </div>
          <input
            type="text"
            defaultValue={s.value}
            onChange={e => setEdits(p => ({ ...p, [s.key]: e.target.value }))}
            className="w-40 border rounded px-2 py-1 text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-rust-300"
          />
          <button
            onClick={() => mut.mutate({ key: s.key, value: edits[s.key] ?? s.value })}
            className="text-xs bg-rust-600 hover:bg-rust-700 text-white px-3 py-1.5 rounded w-16 transition-colors"
          >
            {saved[s.key] ? '✓' : 'Save'}
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Field reference guide panel ──────────────────────────────────────────────

function FieldGuide() {
  const [open, setOpen] = useState(null);

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <button
        onClick={() => setOpen(open === 'guide' ? null : 'guide')}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
      >
        <span>Field Reference Guide — formulas, interpretation & optimisation tips</span>
        <span className="text-gray-400 text-xs">{open === 'guide' ? '▲ Collapse' : '▼ Expand'}</span>
      </button>

      {open === 'guide' && (
        <div className="border-t divide-y divide-gray-100">
          {FIELD_GUIDE.map(f => (
            <div key={f.key} className="px-5 py-4 grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Left: name + formula */}
              <div className="md:col-span-2">
                <p className="font-semibold text-sm text-gray-800">{f.label}</p>
                <pre className="mt-2 text-xs bg-gray-50 border rounded p-2 font-mono whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {f.formula}
                </pre>
              </div>

              {/* Right: 4 labelled sections */}
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Calculation</p>
                  <p className="text-gray-700 leading-relaxed">{f.calc}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Interpretation</p>
                  <p className="text-gray-700 leading-relaxed">{f.interpret}</p>
                </div>
                <div>
                  <p className="font-semibold text-rust-600 uppercase tracking-wide mb-0.5">How to optimise</p>
                  <p className="text-gray-700 leading-relaxed">{f.optimize}</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-600 uppercase tracking-wide mb-0.5">Data Sources</p>
                  <p className="text-gray-700 leading-relaxed">{f.source}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Category Rules tab ───────────────────────────────────────────────────────

const RULE_FIELDS = [
  ['min_multiplier','Min ×'],['sweet_multiplier','Sweet ×'],['max_multiplier','Max ×'],
  ['min_margin_pct','Min Margin'],['target_margin_pct','Target Margin'],
  ['abs_price_floor','Floor ₹'],['abs_price_ceiling','Ceiling ₹'],
  ['typical_return_rate','Return Rate'],['weight_margin','W: Margin'],
  ['weight_conversion','W: Conv'],['weight_profit_inr','W: Profit'],
];

function CategoryRules() {
  const qc = useQueryClient();
  const { data: rules = [] } = useQuery({ queryKey: ['categoryRules'], queryFn: getCategoryRules });
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState('');

  const mut = useMutation({
    mutationFn: ({ id, data }) => updateCategoryRule(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categoryRules'] }); setEditingId(null); },
  });


  function startEdit(rule) {
    setEditingId(rule.id);
    const next = Object.fromEntries(RULE_FIELDS.map(([k]) => [k, rule[k]]));
    next.prefer_charm_pricing = rule.prefer_charm_pricing;
    setForm(next);
  }

  const filtered = rules.filter(r =>
    r.category_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <FieldGuide />

      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rust-300"
          />
        </div>
        {search && (
          <span className="text-xs text-gray-400">
            {filtered.length} of {rules.length} categories
          </span>
        )}
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Rules table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="bg-navy-900 text-white">
            <tr>
              <th className="px-3 py-2 text-left sticky left-0 bg-navy-900 min-w-[200px]">Category</th>
              {RULE_FIELDS.map(([, label]) => (
                <th key={label} className="px-2 py-2 text-right whitespace-nowrap">{label}</th>
              ))}
              <th className="px-2 py-2">Charm</th>
              <th className="px-2 py-2">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={RULE_FIELDS.length + 3} className="px-4 py-6 text-center text-gray-400">
                  No categories match &ldquo;{search}&rdquo;
                </td>
              </tr>
            )}
            {filtered.map(rule => (
              <tr key={rule.id} className={editingId === rule.id ? 'bg-rust-50' : 'hover:bg-gray-50'}>
                <td className="px-3 py-1.5 sticky left-0 bg-white font-medium">{rule.category_name}</td>
                {RULE_FIELDS.map(([k]) => (
                  <td key={k} className="px-2 py-1.5 text-right">
                    {editingId === rule.id
                      ? <input
                          type="number"
                          step="any"
                          value={form[k] ?? ''}
                          onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
                          className="w-20 border rounded px-1 text-right text-xs"
                        />
                      : parseFloat(rule[k] ?? 0).toFixed(2)}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center">
                  {editingId === rule.id
                    ? <input
                        type="checkbox"
                        checked={!!form.prefer_charm_pricing}
                        onChange={e => setForm(p => ({ ...p, prefer_charm_pricing: e.target.checked }))}
                      />
                    : rule.prefer_charm_pricing ? '✓' : '—'}
                </td>
                <td className="px-2 py-1.5 text-center">
                  {editingId === rule.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => mut.mutate({ id: rule.id, data: form })}
                        className="text-green-600 hover:underline"
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400 hover:underline">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(rule)} className="text-blue-500 hover:underline">
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Fee Tables tab (read-only reference) ─────────────────────────────────────

function FeeTables() {
  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <div>
        <h3 className="font-semibold mb-2">Closing Fees</h3>
        <table className="text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              {['Price Range','Easy Ship','Self-Ship','Seller Flex'].map(h => (
                <th key={h} className="px-3 py-1 text-left border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['₹0–₹300','₹1','₹20','₹6'],
              ['₹300–₹500','₹22','₹26','₹12'],
              ['₹500–₹1000','₹45','₹51','₹35'],
              ['₹1000+','₹76','₹101','₹66'],
            ].map(r => (
              <tr key={r[0]}>
                {r.map((c, i) => <td key={i} className="px-3 py-1 border">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400">
        To modify fee tables, update <code>database/seeds/</code> and re-run the seed scripts.
      </p>
    </div>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

const TABS = ['Global Settings', 'Category Rules', 'Fee Tables'];

export default function Settings() {
  const [tab, setTab] = useState(0);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="flex gap-1 border-b">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === i ? 'border-rust-600 text-rust-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 0 && <GlobalSettings />}
      {tab === 1 && <CategoryRules />}
      {tab === 2 && <FeeTables />}
    </div>
  );
}
