import { useQuery } from '@tanstack/react-query';
import { getCategories, createProduct, updateProduct } from '../services/api.js';
import { useState } from 'react';

export default function ProductForm({ initial, onSave, onCancel }) {
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  const [form, setForm] = useState({
    sr_no:              initial?.sr_no ?? '',
    product_name:       initial?.product_name ?? '',
    category_name:      initial?.category_name ?? '',
    weight_gm:          initial?.weight_gm ?? '',
    length_cm:          initial?.length_cm ?? '',
    width_cm:           initial?.width_cm ?? '',
    height_cm:          initial?.height_cm ?? '',
    manufacturing_cost: initial?.manufacturing_cost ?? '',
    image_url:          initial?.image_url ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  function set(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (initial) await updateProduct(initial.id, form);
      else         await createProduct(form);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to save product');
    } finally {
      setLoading(false);
    }
  }

  const field = (label, key, type = 'text', step) => (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        type={type} step={step}
        value={form[key]}
        onChange={set(key)}
        className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rust-300"
        required
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
      {field('Sr. No.',               'sr_no',              'number')}
      {field('Product Name',          'product_name')}

      <div>
        <label className="block text-xs text-gray-500 mb-1">Category</label>
        <select
          value={form.category_name}
          onChange={set('category_name')}
          className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rust-300"
          required
        >
          <option value="">Select category…</option>
          {categories.map(c => (
            <option key={c.id} value={c.category_name}>{c.category_name}</option>
          ))}
        </select>
      </div>

      {field('Weight (gm)',            'weight_gm',          'number', '0.1')}
      {field('Length (cm)',            'length_cm',          'number', '0.1')}
      {field('Width (cm)',             'width_cm',           'number', '0.1')}
      {field('Height (cm)',            'height_cm',          'number', '0.1')}
      {field('Manufacturing Cost (₹)', 'manufacturing_cost', 'number', '0.01')}

      <div className="col-span-2">
        <label className="block text-xs text-gray-500 mb-1">Image URL (optional)</label>
        <input
          type="url"
          value={form.image_url}
          onChange={set('image_url')}
          className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-rust-300"
        />
      </div>

      {error && <p className="col-span-2 text-red-500 text-sm">{error}</p>}

      <div className="col-span-2 flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-rust-600 hover:bg-rust-700 text-white px-5 py-2 rounded text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving…' : initial ? 'Update' : 'Create'}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:underline">
          Cancel
        </button>
      </div>
    </form>
  );
}
