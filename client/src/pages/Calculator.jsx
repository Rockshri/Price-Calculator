import LiveCalculator from '../components/LiveCalculator.jsx';

export default function Calculator() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Live Calculator</h1>
      <p className="text-sm text-gray-500">
        Mirrors the "Scenario Check" sheet — enter inputs and instantly see costs across all price points.
      </p>
      <LiveCalculator />
    </div>
  );
}
