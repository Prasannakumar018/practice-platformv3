'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function ResultsPage() {
  const params = useParams();
  const quizId = params.id as string;
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const data = await apiClient.finishQuiz(quizId);
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [quizId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading results...</div>;
  }

  const percentage = (results.score || 0).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Complete!</h1>
            
            <div className="my-8">
              <div className="text-6xl font-bold text-indigo-600 mb-2">{percentage}%</div>
              <p className="text-gray-600">
                {results.correct_answers} out of {results.total_questions} correct
              </p>
            </div>

            {results.time_taken && (
              <p className="text-gray-600 mb-6">Time taken: {results.time_taken} minutes</p>
            )}

            <div className="space-y-4 mb-8">
              {results.answers?.map((answer: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-2 ${
                    answer.is_correct ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                  }`}
                >
                  <p className="font-semibold mb-2">Question {idx + 1}</p>
                  <p className="text-sm">
                    Your answer: <span className="font-medium">{answer.selected_answer}</span>
                  </p>
                  {!answer.is_correct && (
                    <p className="text-sm text-green-700">
                      Correct answer: <span className="font-medium">{answer.correct_answer}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>

            <Link
              href="/dashboard"
              className="inline-block px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
