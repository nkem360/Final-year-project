export default function ResultsPanel({ results }) {
  if (!results) return null;

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">
        AI Analysis Results
      </h2>

      {results.map((item, index) => (
        <div
          key={index}
          className="bg-white p-4 rounded-lg shadow mb-3"
        >
          <h3 className="font-semibold">{item.name}</h3>
          <p>Confidence: {item.confidence}</p>
        </div>
      ))}
    </div>
  );
}