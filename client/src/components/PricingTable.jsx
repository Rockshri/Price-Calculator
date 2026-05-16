const fmt = (v) => `₹${parseFloat(v ?? 0).toFixed(2)}`;
const pct = (v) => `${(parseFloat(v ?? 0) * 100).toFixed(1)}%`;

export default function PricingTable({ results }) {
  if (!results.length) {
    return (
      <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400">
        No results yet. Run "Run All Products" from the Dashboard.
      </div>
    );
  }

  const rows = [
    { label: 'Manufacturing Cost', key: 'manufacturingCost', format: fmt, bg: 'bg-yellow-50' },
    { label: 'Weight (gm)',        key: 'weightGm',          format: v => v,  bg: 'bg-yellow-50' },
    { label: 'Dimensions (cm)',    key: null,                format: null,    bg: 'bg-yellow-50' },
    { label: 'Best Listing Price', key: 'bestListingPrice',  format: fmt,     bg: '' },
    { label: 'Best Selling Price', key: 'bestSellingPrice',  format: fmt,     bg: '' },
    { label: 'Seller Side Costs', key: 'sellerSideCosts',   format: fmt,     bg: '' },
    { label: 'Fulfilment Cost',   key: 'fulfilmentCost',    format: fmt,     bg: '' },
    { label: 'Amazon Charges',    key: 'amazonCharges',     format: fmt,     bg: '' },
    { label: 'Return Charges',    key: 'returnCharges',     format: fmt,     bg: '' },
    { label: 'Net Profit',        key: 'netProfit',         format: fmt,     bg: 'bg-gray-100 font-bold' },
    { label: 'Margin %',          key: 'marginPct',         format: pct,     bg: 'bg-gray-100 font-bold' },
    { label: 'Profit on Cost %',  key: 'profitOnCostPct',   format: pct,     bg: 'bg-gray-100 font-bold' },
  ];

  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">
      <table className="text-xs border-collapse min-w-max">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="sticky left-0 bg-gray-800 px-3 py-2 text-left min-w-[160px]">Metric</th>
            {results.map(r => (
              <th key={r.id} className="px-3 py-2 text-center min-w-[120px] font-medium">
                <div>#{r.srNo}</div>
                <div className="text-gray-300 font-normal truncate max-w-[120px]">{r.productName}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ label, key, format, bg }) => (
            <tr key={label} className={`border-t ${bg}`}>
              <td className={`sticky left-0 ${bg || 'bg-white'} px-3 py-1.5 font-medium text-gray-700 min-w-[160px]`}>
                {label}
              </td>
              {results.map(r => (
                <td key={r.id} className="px-3 py-1.5 text-center">
                  {key === null
                    ? `${r.lengthCm}×${r.widthCm}×${r.heightCm}`
                    : format(r[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
