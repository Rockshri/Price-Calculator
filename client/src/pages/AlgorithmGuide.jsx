import { useState } from 'react';

// ─── Reusable collapse section ─────────────────────────────────────────────────
function Section({ title, badge, badgeColor = 'bg-rust-100 text-rust-800', children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-800">{title}</span>
          {badge && <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>}
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="border-t px-6 py-5">{children}</div>}
    </div>
  );
}

function Code({ children }) {
  return <code className="bg-gray-100 text-rust-700 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>;
}

function Formula({ label, expr, note }) {
  return (
    <div className="my-3 border-l-4 border-rust-400 pl-4">
      {label && <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">{label}</p>}
      <pre className="font-mono text-sm bg-gray-50 rounded p-3 whitespace-pre-wrap text-gray-800">{expr}</pre>
      {note && <p className="text-xs text-gray-500 mt-1">{note}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    OPTIMAL:  'bg-green-100 text-green-800 border-green-200',
    WARNING:  'bg-yellow-100 text-yellow-800 border-yellow-200',
    ALERT:    'bg-rust-100 text-rust-800 border-rust-200',
    CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  };
  return (
    <span className={`inline-block border rounded-full px-3 py-0.5 text-xs font-semibold ${cfg[status]}`}>{status}</span>
  );
}

// ─── Flowchart of fallback pools ───────────────────────────────────────────────
function FallbackFlowchart() {
  const levels = [
    { level: 'Level 1', label: 'Target margin + within band', status: 'OPTIMAL',  badge: 'bg-green-100 text-green-800',  arrow: true },
    { level: 'Level 2', label: 'Min margin + within band',   status: 'WARNING',   badge: 'bg-yellow-100 text-yellow-800', arrow: true },
    { level: 'Level 3', label: 'Any profit within band',     status: 'WARNING',   badge: 'bg-yellow-100 text-yellow-800', arrow: true },
    { level: 'Level 4', label: 'Any profit outside band',    status: 'ALERT',     badge: 'bg-rust-100 text-rust-800', arrow: true },
    { level: 'Level 5', label: 'Least loss (all scenarios)', status: 'CRITICAL',  badge: 'bg-red-100 text-red-800',       arrow: false },
  ];
  return (
    <div className="flex flex-col gap-0 max-w-lg">
      {levels.map(({ level, label, status, badge, arrow }) => (
        <div key={level}>
          <div className={`flex items-center gap-3 rounded-lg px-4 py-3 border ${badge}`}>
            <span className="text-xs font-bold w-14 shrink-0">{level}</span>
            <span className="text-sm flex-1">{label}</span>
            <StatusBadge status={status} />
          </div>
          {arrow && (
            <div className="flex justify-center text-gray-300 text-lg leading-none py-1">↓ if empty</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Scoring worked example ────────────────────────────────────────────────────
function ScoringExample() {
  const rows = [
    { price: 784,  margin: 0.217, conv: 1.00, price_s: 1.00, note: '← sweet spot'   },
    { price: 896,  margin: 0.271, conv: 0.92, price_s: 0.88, note: ''                },
    { price: 952,  margin: 0.294, conv: 0.87, price_s: 0.82, note: ''                },
    { price: 999,  margin: 0.311, conv: 0.84, price_s: 0.78, note: '+ charm bonus'   },
    { price: 1232, margin: 0.375, conv: 0.62, price_s: 0.64, note: ''                },
    { price: 1499, margin: 0.425, conv: 0.25, price_s: 0.52, note: '← band ceiling'  },
  ];
  return (
    <div className="overflow-x-auto">
      <p className="text-xs text-gray-500 mb-2">Example: ₹224 cost · Handbags · band ₹560–₹1499 · sweet ₹784 · target margin 22%</p>
      <table className="min-w-full text-xs border-collapse">
        <thead className="bg-gray-800 text-white">
          <tr>
            {['Price','Margin%','marginScore (×0.5)','convScore (×0.3)','priceScore (×0.2)','Total',''].map(h => (
              <th key={h} className="px-3 py-2 text-right first:text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(r => {
            const ms = Math.min(r.margin / 0.22, 1.0);
            const total = (ms * 0.5 + r.conv * 0.3 + r.price_s * 0.2).toFixed(3);
            const isBest = r.price === 784;
            return (
              <tr key={r.price} className={isBest ? 'bg-green-50 font-semibold' : ''}>
                <td className="px-3 py-1.5">₹{r.price} {r.note && <span className="text-gray-400 font-normal">{r.note}</span>}</td>
                <td className="px-3 py-1.5 text-right">{(r.margin*100).toFixed(1)}%</td>
                <td className="px-3 py-1.5 text-right">{ms.toFixed(3)}</td>
                <td className="px-3 py-1.5 text-right">{r.conv.toFixed(3)}</td>
                <td className="px-3 py-1.5 text-right">{r.price_s.toFixed(3)}</td>
                <td className="px-3 py-1.5 text-right font-bold">{total}</td>
                <td className="px-3 py-1.5">{isBest ? '🏆 Winner' : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function AlgorithmGuide() {
  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Algorithm Guide</h1>
        <p className="text-sm text-gray-500 mt-1">
          How the pricing engine selects the best listing price — every formula, every decision, every fallback.
        </p>
      </div>

      {/* ── OVERVIEW ── */}
      <Section title="1. Overview — What the Engine Does" defaultOpen>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          For each product the engine tests <strong>26 candidate listing prices</strong>, computes the full
          cost breakdown for each one, then picks the single best price using a weighted scoring formula
          that balances margin efficiency, conversion likelihood, and price positioning.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {[
            ['Input', 'Product dimensions, cost, category → drives all fee lookups'],
            ['26 Prices', '10 multiplier-based + 16 fixed psychological anchors'],
            ['Output', 'Best listing price + recommendation status + full cost breakdown'],
          ].map(([t, d]) => (
            <div key={t} className="bg-gray-50 rounded-lg p-3">
              <p className="font-semibold text-rust-600 mb-1">{t}</p>
              <p className="text-gray-600">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 26 PRICE POINTS ── */}
      <Section title="2. The 26 Candidate Price Points">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="font-semibold mb-2">Group A — 10 Multiplier-Based Prices</p>
            <Formula
              label="Formula"
              expr="price = ROUND(manufacturing_cost × factor)\nfactors = [3.0, 3.25, 3.5, 4.0, 4.25, 4.5, 4.75, 5.0, 5.25, 5.5]"
              note="Spread evenly from 3× to 5.5× of cost in 0.25× steps. Ensures coverage of the typical Amazon markup range."
            />
            <p className="text-gray-600">
              These follow the product's actual cost, so they scale correctly regardless of whether the
              product costs ₹50 or ₹5000. A ₹200-cost product gets multiplier prices from ₹600 to ₹1100.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-2">Group B — 16 Fixed "Charm" Anchors</p>
            <div className="bg-gray-50 rounded p-3 font-mono text-xs grid grid-cols-4 gap-1 text-center">
              {[249,251,299,301,499,501,999,1001,1499,1501,1999,2001,4999,5001,9999,10001].map(p => (
                <span key={p} className={[249,299,499,999,1499,1999,4999,9999].includes(p) ? 'text-green-700 font-bold' : 'text-gray-500'}>₹{p}</span>
              ))}
            </div>
            <p className="text-gray-600 mt-2">
              Each psychological threshold is tested as <em>just-below</em> (₹499) and <em>just-above</em> (₹501).
              Green = charm price; grey = boundary. Covers all major Indian consumer price brackets.
            </p>
          </div>
        </div>
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-800">
          <strong>Why 26?</strong> — 10 multiplier points ensure the cost-appropriate range is sampled,
          while 16 fixed points catch charm pricing opportunities regardless of cost. The engine always
          tests both, then scores all 26 against category rules to find the winner.
        </div>
      </Section>

      {/* ── COST CALCULATION ── */}
      <Section title="3. Cost Breakdown — How Each Scenario Is Evaluated">
        <p className="text-sm text-gray-600 mb-4">
          All cost components are stored as <strong>negative numbers</strong> (matching Excel convention).
          Net profit is simply their sum with the selling price.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
          <div>
            <Formula
              label="Selling Price (excl. GST)"
              expr="selling_price = listing_price / (1 + gst_rate)"
              note="Amazon pays out the ex-GST amount. Default GST rate: 5%."
            />
            <Formula
              label="G8 · Seller Side Costs (negative)"
              expr="seller_costs = −( mfg_cost + primary_transport
            + bulk_packaging
            + selling_price × 0.01158 )"
              note="The 0.01158 is the exact product-packaging rate from the Excel model."
            />
            <Formula
              label="G9 · Fulfilment Cost (negative)"
              expr="fulfilment = −( inward + avg_days×storage_rate
           + outward + return_handling
           + selling_price / 100 )"
              note="Admin fee = 1% of selling price."
            />
          </div>
          <div>
            <Formula
              label="G10 · Amazon Charges (negative)"
              expr="amazon = −( referral_fee + closing_fee
         + shipping_fee
         + selling_price × marketing_rate )"
              note="Referral fee: per-category % from the referral_fees table. Closing fee: tiered from closing_fees table. Shipping: by billable weight."
            />
            <Formula
              label="Return Charges"
              expr="return = return_rate × ( return_logistics
                 + listing_price × (−0.20) )"
              note="Amazon refunds 20% of the listing price on returns — shown as −0.20 multiplier. Default return rate: 15%."
            />
            <Formula
              label="Net Profit"
              expr="net_profit = selling_price
           + seller_costs       ← negative
           + fulfilment_cost    ← negative
           + amazon_charges     ← negative
           + return_charges"
              note="All negatives cancel. Positive net_profit = profitable listing."
            />
          </div>
        </div>
        <div className="mt-4 bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
          <strong>Billable weight</strong> = MAX(actual_kg, volumetric_kg) where
          volumetric = L×W×H ÷ 5000. Used for the shipping fee lookup. Amazon charges whichever is higher.
        </div>
      </Section>

      {/* ── PRICE BAND ── */}
      <Section title="4. Price Band — Defining the Market Range">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <Formula
              label="Band Minimum"
              expr="band.min = MAX( cost × min_multiplier,
               abs_price_floor )"
              note="The lower multiplier sets the minimum acceptable price. The abs_price_floor is a hard safety net — even a ₹40-cost product won't be listed below ₹199."
            />
            <Formula
              label="Band Sweet Spot"
              expr="band.sweet = cost × sweet_multiplier"
              note="The single ideal price point. All three scoring functions are anchored to this value."
            />
            <Formula
              label="Band Maximum"
              expr="band.max = MIN( cost × max_multiplier,
               abs_price_ceiling )"
              note="Upper boundary. abs_price_ceiling caps even expensive products from entering unreachable price tiers."
            />
          </div>
          <div className="space-y-3">
            <p className="font-medium">Example — ₹224 cost · Handbags</p>
            <div className="relative h-12 bg-gray-100 rounded-full overflow-hidden">
              <div className="absolute inset-y-0 bg-green-200" style={{ left: '15%', right: '40%' }} />
              <div className="absolute inset-y-0 w-1 bg-rust-600 rounded" style={{ left: '30%' }} />
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3 text-xs font-mono">
                <span>₹0</span><span>₹560</span><span className="text-rust-600 font-bold">₹784</span><span>₹1499</span><span>∞</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 flex gap-4">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-green-200 rounded"></span> Band (₹560–₹1499)</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-1 bg-rust-600"></span> Sweet ₹784</span>
            </div>
            <p className="text-gray-600 text-xs leading-relaxed">
              The engine only considers Level 1–3 scenarios within this band.
              Prices outside the band are only used as a last-resort fallback.
            </p>
          </div>
        </div>
      </Section>

      {/* ── FALLBACK POOLS ── */}
      <Section title="5. Fallback Pools — How the Candidate Set Is Chosen">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          <div>
            <p className="text-gray-600 mb-4">
              The engine tries to find candidates at the highest quality level first.
              Only if that pool is empty does it fall to the next level.
              The level at which a winner is found determines the recommendation status.
            </p>
            <FallbackFlowchart />
          </div>
          <div className="space-y-4">
            <p className="font-medium">When does each level trigger?</p>
            <div className="space-y-3 text-xs">
              {[
                { status: 'OPTIMAL',  l: 'Level 1', when: 'At least one scenario achieves target_margin_pct within the price band. Most common outcome for well-priced, low-cost products.' },
                { status: 'WARNING',  l: 'Level 2', when: 'No scenario hits the target margin, but at least one exceeds min_margin_pct within band. Product is viable but needs cost review.' },
                { status: 'WARNING',  l: 'Level 3', when: 'No scenario meets even the minimum margin within band, but positive profit exists. Margin is very thin — high volume dependency.' },
                { status: 'ALERT',   l: 'Level 4', when: 'No profitable price exists within the market band at all. Product is priced outside its competitive range. Requires repricing or cost reduction.' },
                { status: 'CRITICAL', l: 'Level 5', when: 'All 26 price points result in a loss. Product is fundamentally unviable on Amazon at current cost structure. Do not list.' },
              ].map(({ status, l, when }) => (
                <div key={l} className="flex gap-3">
                  <div className="shrink-0 pt-0.5"><StatusBadge status={status} /></div>
                  <div>
                    <p className="font-semibold">{l}</p>
                    <p className="text-gray-600 leading-relaxed">{when}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ── SCORING ── */}
      <Section title="6. Scoring — How the Winner Is Chosen Within the Pool">
        <div className="space-y-5 text-sm">
          <p className="text-gray-600">
            Once the candidate pool is selected (e.g. Level 1), every scenario in that pool is scored
            on three orthogonal axes and the scores are combined using category-specific weights.
            The highest scorer wins; ties are broken by preferring the lower price.
          </p>

          <Formula
            label="Combined Score"
            expr="score = marginScore × weight_margin
       + convScore   × weight_conversion
       + priceScore  × weight_profit_inr"
            note="Weights come from category_pricing_rules. Default Handbags: 0.50 / 0.30 / 0.20."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <p className="font-semibold text-green-800 mb-2">marginScore</p>
              <Formula expr="MIN( margin / target_margin, 1.0 )" />
              <p className="text-xs text-gray-600">
                Rises linearly from 0 to 1.0 as margin improves toward target.
                Capped at <strong>1.0</strong> — no bonus for over-achieving (prevents high prices
                from gaining margin compound advantage).
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="font-semibold text-blue-800 mb-2">convScore</p>
              <Formula expr="f(|price − sweet|) + charm" />
              <p className="text-xs text-gray-600">
                Smooth quadratic peaked at <Code>band.sweet</Code>. Scores 1.0 exactly at sweet spot,
                falls to ~0.25 at band edges. <em>charmBonus = +0.05</em> when price is within ₹10
                below a threshold (₹249, ₹499, ₹749…).
              </p>
              <Formula
                expr="t = |price − sweet| / halfBand
score = MAX(0.10, 1 − 0.50t − 0.25t²)"
              />
            </div>
            <div className="bg-rust-50 rounded-lg p-4 border border-rust-100">
              <p className="font-semibold text-rust-800 mb-2">priceScore</p>
              <Formula expr="MIN( sweet / price, 1.0 )" />
              <p className="text-xs text-gray-600">
                Directly penalises listing above the sweet spot. At sweet price: 1.0.
                As price rises: falls proportionally. Prices below sweet are NOT penalised here
                — they're handled by a lower marginScore instead.
                <br /><br />
                <strong>Why not absolute profit?</strong> The old formula used
                <Code>profit / maxProfit</Code>, which always gave the most expensive scenario a
                perfect 1.0. Replaced to remove systematic upward price bias.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="font-medium mb-2">Worked Example — ₹224 Handbag</p>
            <ScoringExample />
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <strong>Tiebreaker</strong>: All scenarios within 0.01 of the maximum score form a "top candidates" set.
            The lowest price among them is selected. This ensures the algorithm never recommends an
            unnecessarily expensive price when a cheaper one would score equivalently.
          </div>
        </div>
      </Section>

      {/* ── STATUS MEANINGS ── */}
      <Section title="7. Status Meanings — What to Do With Each Result">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            {
              status: 'OPTIMAL', icon: '✓',
              bg: 'bg-green-50 border-green-200',
              title: 'Proceed',
              meaning: 'The best price sits within the market band AND meets the target margin. Product is commercially viable as-is.',
              actions: ['List at the recommended price immediately', 'Monitor first 30 days for actual conversion data', 'Re-run after any cost change (materials, logistics)'],
            },
            {
              status: 'WARNING', icon: '⚠',
              bg: 'bg-yellow-50 border-yellow-200',
              title: 'Review Cost',
              meaning: 'Profitable but margin is below target. May indicate input cost is too high relative to what the market will pay.',
              actions: ['Audit seller-side costs (transport, packaging)', 'Negotiate bulk discounts on materials', 'Consider a smaller SKU to reduce manufacturing cost', 'Adjust sweet_multiplier upward if brand allows premium'],
            },
            {
              status: 'ALERT', icon: '⚡',
              bg: 'bg-rust-50 border-rust-200',
              title: 'Reprice',
              meaning: 'No profitable price exists within the category\'s market band. Product needs repositioning — either lower cost or a different category.',
              actions: ['Check if category_name is correct (different category = different band)', 'Compare competitor costs on similar products', 'Redesign SKU to reduce cost by 20–30%', 'Consider bundling to increase perceived value'],
            },
            {
              status: 'CRITICAL', icon: '✗',
              bg: 'bg-red-50 border-red-200',
              title: 'Do Not List',
              meaning: 'All 26 price points result in a loss. At current cost, listing on Amazon guarantees a loss per order.',
              actions: ['Do NOT list — every sale worsens cash flow', 'Use the cost breakdown to identify the largest cost driver', 'Return rate may be estimated too high — verify category data', 'Fulfillment type matters: compare Easy Ship vs Seller Flex fees'],
            },
          ].map(({ status, icon, bg, title, meaning, actions }) => (
            <div key={status} className={`border rounded-xl p-5 ${bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{icon}</span>
                <StatusBadge status={status} />
                <span className="font-semibold ml-1">{title}</span>
              </div>
              <p className="text-xs text-gray-700 mb-3">{meaning}</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {actions.map(a => <li key={a} className="flex gap-2"><span>→</span><span>{a}</span></li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* ── OPTIMIZATION CHECKLIST ── */}
      <Section title="8. How to Improve a Product's Status">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="font-semibold mb-3 text-rust-700">Improving margin (moving CRITICAL → ALERT → WARNING → OPTIMAL)</p>
            <div className="space-y-2">
              {[
                ['Reduce manufacturing cost', 'Most impactful lever. Even 10% reduction can shift entire band.'],
                ['Optimise dimensions', 'Smaller box → lower volumetric weight → lower shipping fee. L×W×H / 5000 = volumetric kg.'],
                ['Reduce return rate', 'Better photos and descriptions. 5% lower return rate ≈ ₹3–10 saved per unit.'],
                ['Switch fulfillment type', 'Self-Ship may be cheaper than Easy Ship for heavy/large items.'],
                ['Lower marketing rate', 'If organic ranking is strong, reduce ad spend below default 20%.'],
                ['Increase sweet_multiplier', 'If your brand commands a premium, raising the sweet spot raises the recommended price.'],
              ].map(([t, d]) => (
                <div key={t} className="flex gap-3">
                  <span className="text-green-600 shrink-0 mt-0.5">✓</span>
                  <div>
                    <p className="font-medium">{t}</p>
                    <p className="text-gray-500 text-xs">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold mb-3 text-blue-700">Tuning category rules for better recommendations</p>
            <div className="space-y-2">
              {[
                ['Lower target_margin_pct', 'If the current target is unrealistic for the category, lower it so Level 1 pool has candidates.'],
                ['Reduce max_multiplier', 'Wide band = algorithm can stray to expensive prices. Narrowing max to 4–5× keeps recommendations realistic.'],
                ['Increase weight_conversion', 'Forces the algorithm to prioritise the sweet-spot price zone over margin optimisation.'],
                ['Enable charm pricing', 'For B2C categories, ₹499/₹999 consistently outperform ₹505/₹1010 in click-through.'],
                ['Set abs_price_floor correctly', 'If your category has a minimum viable price (below which Amazon fees eat all profit), set the floor there.'],
              ].map(([t, d]) => (
                <div key={t} className="flex gap-3">
                  <span className="text-blue-600 shrink-0 mt-0.5">⚙</span>
                  <div>
                    <p className="font-medium">{t}</p>
                    <p className="text-gray-500 text-xs">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
