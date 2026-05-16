import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProducts, deleteProduct } from '../services/api.js';
import { useState } from 'react';
import ProductForm from '../components/ProductForm.jsx';

export default function Products() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useQuery({ queryKey: ['products'], queryFn: getProducts });
  const [editing, setEditing] = useState(null);
  const [filter, setFilter]   = useState('');

  const filtered = products.filter(p =>
    p.product_name.toLowerCase().includes(filter.toLowerCase()) ||
    p.category_name?.toLowerCase().includes(filter.toLowerCase())
  );

  async function handleDelete(id) {
    if (!confirm('Soft-delete this product?')) return;
    await deleteProduct(id);
    qc.invalidateQueries({ queryKey: ['products'] });
  }

  if (isLoading) return <p className="text-gray-400">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-navy-900">Products</h1>
        <div className="flex gap-3 items-center">
          <input
            placeholder="Search name or category…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-rust-300"
          />
          <button
            onClick={() => setEditing('new')}
            className="bg-rust-600 hover:bg-rust-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Add Product
          </button>
        </div>
      </div>

      {editing && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold mb-4 text-navy-900">
            {editing === 'new' ? 'New Product' : 'Edit Product'}
          </h2>
          <ProductForm
            initial={editing === 'new' ? null : editing}
            onSave={() => { setEditing(null); qc.invalidateQueries({ queryKey: ['products'] }); }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-navy-900 text-white text-xs uppercase">
            <tr>
              {['#', 'Name', 'Category', 'Weight (g)', 'L×W×H (cm)', 'Cost (₹)', 'Actions'].map(h => (
                <th key={h} className="px-4 py-2 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-rust-50">
                <td className="px-4 py-2 text-gray-400">{p.sr_no}</td>
                <td className="px-4 py-2 font-medium">{p.product_name}</td>
                <td className="px-4 py-2 text-gray-500">{p.category_name}</td>
                <td className="px-4 py-2">{p.weight_gm}</td>
                <td className="px-4 py-2">{p.length_cm}×{p.width_cm}×{p.height_cm}</td>
                <td className="px-4 py-2 font-medium text-navy-900">₹{parseFloat(p.manufacturing_cost).toFixed(0)}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button onClick={() => setEditing(p)}   className="text-navy-600 hover:underline text-xs">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
