'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function CreateRulesetPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [hardness, setHardness] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [timeLimit, setTimeLimit] = useState<number | undefined>(undefined);
  const [timed, setTimed] = useState(false);
  const [gradingStyle, setGradingStyle] = useState('end_only');
  const [bloomLevels, setBloomLevels] = useState<string[]>(['remember', 'understand']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bloomOptions = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

  const toggleBloomLevel = (level: string) => {
    setBloomLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const config = {
        hardness,
        num_questions: numQuestions,
        time_limit: timed ? timeLimit : null,
        grading_style: gradingStyle,
        bloom_levels: bloomLevels,
        question_types: ['mcq'],
      };

      await apiClient.createRuleset(name, config);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create ruleset');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create Quiz Ruleset</h1>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8 space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ruleset Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level
              </label>
              <select
                value={hardness}
                onChange={(e) => setHardness(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Questions
              </label>
              <input
                type="number"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                min={1}
                max={50}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={timed}
                  onChange={(e) => setTimed(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Timed Quiz</span>
              </label>
              {timed && (
                <input
                  type="number"
                  value={timeLimit === undefined ? '' : timeLimit}
                  onChange={(e) => setTimeLimit(e.target.value === '' ? undefined : parseInt(e.target.value))}
                  placeholder="Time limit in minutes"
                  className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bloom's Taxonomy Levels
              </label>
              <div className="grid grid-cols-2 gap-2">
                {bloomOptions.map((level) => (
                  <label key={level} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={bloomLevels.includes(level)}
                      onChange={() => toggleBloomLevel(level)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm capitalize">{level}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grading Style
              </label>
              <select
                value={gradingStyle}
                onChange={(e) => setGradingStyle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="end_only">Show results at end only</option>
                <option value="immediate">Immediate feedback</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Ruleset'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
