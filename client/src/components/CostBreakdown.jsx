import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Navy + rust palette aligned with Exverge brand
const COLORS = ['#b84a18', '#1a3a6e', '#3460ba', '#d95a20'];
const LABELS = ['Seller Costs', 'Fulfilment', 'Amazon Charges', 'Return Charges'];

export default function CostBreakdown({ result }) {
  if (!result) return null;

  const raw = [
    parseFloat(result.sellerCosts ?? result.sellerSideCosts ?? 0),
    parseFloat(result.fulfilmentCost ?? 0),
    parseFloat(result.amazonCharges ?? 0),
    parseFloat(result.returnCharges ?? 0),
  ];

  const data = LABELS
    .map((name, i) => ({ name, value: parseFloat(Math.abs(raw[i]).toFixed(2)) }))
    .filter(d => d.value > 0);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Cost breakdown</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
          >
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => `₹${v.toFixed(2)}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
