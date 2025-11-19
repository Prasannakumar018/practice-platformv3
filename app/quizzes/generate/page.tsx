'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function GenerateQuizPage() {
  const router = useRouter();
  const [files, setFiles] = useState<any[]>([]);
  const [rulesets, setRulesets] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [selectedRuleset, setSelectedRuleset] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [filesData, rulesetsData] = await Promise.all([
          apiClient.getFiles(),
          apiClient.getRulesets(),
        ]);
        setFiles(filesData.filter((f: any) => f.status === 'completed'));
        setRulesets(rulesetsData);
      } catch (err) {
        setError('Failed to load data');
      }
    };

    loadData();
  }, []);

  const handleGenerate = async () => {
    if (!selectedFile || !selectedRuleset) {
      setError('Please select both a file and a ruleset');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const questions = await apiClient.generateQuestions(selectedFile, selectedRuleset);
      const quiz = await apiClient.createQuiz(
        selectedRuleset,
        questions.map((q: any) => q.id)
      );
      // Store questions in localStorage for the start page
      if (typeof window !== 'undefined') {
        localStorage.setItem(`quiz_questions_${quiz.quiz_id}`, JSON.stringify(questions));
      }
      router.push(`/quizzes/${quiz.quiz_id}/start`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard" className="text-indigo-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Generate Quiz</h1>

          <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Document
              </label>
              <select
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose a file...</option>
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.filename}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Ruleset
              </label>
              <select
                value={selectedRuleset}
                onChange={(e) => setSelectedRuleset(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose a ruleset...</option>
                {rulesets.map((ruleset) => (
                  <option key={ruleset.id} value={ruleset.id}>
                    {ruleset.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !selectedFile || !selectedRuleset}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Quiz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
