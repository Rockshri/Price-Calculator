import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';

export default function ScenarioChart({ scenarios, bestPrice }) {
  if (!scenarios?.length) return null;

  const data = scenarios.map(s => ({
    price:  `₹${s.listingPriceGST}`,
    margin: parseFloat((s.margin * 100).toFixed(2)),
    isBest: s.listingPriceGST === bestPrice,
  }));

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Margin % across price points</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="price" angle={-45} textAnchor="end" tick={{ fontSize: 10 }} />
          <YAxis unit="%" tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => [`${v}%`, 'Margin']} />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 2" />
          <Bar dataKey="margin" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.isBest ? '#16a34a' : d.margin >= 0 ? '#b84a18' : '#fbc4a5'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
