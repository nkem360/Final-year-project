import SymptomInput from "../components/SymptomInput";
import ResultsPanel from "../components/ResultsPanel";

export default function Analyze({ onAnalyze, results }) {
  return (
    <div className="p-8">
      <SymptomInput onAnalyze={onAnalyze} />
      <ResultsPanel results={results} />
    </div>
  );
}