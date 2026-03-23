import { useState } from "react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import SymptomInput from "./components/SymptomInput";
import ResultsPanel from "./components/ResultsPanel";
import EmergencyAlert from "./components/EmergencyAlert";

function App() {
  const [page, setPage] = useState("dashboard");
  const [results, setResults] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [language, setLanguage] = useState("en");

  const pet = {
    name: "Max",
    breed: "Golden Retriever",
    age: "5 years",
    emoji: "🐶",
  };

  const handleAnalyze = (symptomText) => {
    setSymptoms(symptomText);

    const mockResults = [
      { name: "Possible Muscle Injury", confidence: "65%" },
      { name: "Allergic Reaction", confidence: "20%" },
      { name: "Gastrointestinal Upset", confidence: "15%" },
    ];

    setResults(mockResults);
    setPage("analyze");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar setPage={setPage} />

      <div className="flex-1 flex flex-col">
        <Header language={language} setLanguage={setLanguage} />

        <main className="flex-1 p-6 md:p-8">
          {page === "dashboard" && <Dashboard pet={pet} />}

          {page === "analyze" && (
            <div className="max-w-4xl mx-auto space-y-8">
              <SymptomInput onAnalyze={handleAnalyze} />
              <EmergencyAlert symptoms={symptoms} />
              <ResultsPanel results={results} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;