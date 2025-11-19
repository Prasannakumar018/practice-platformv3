'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startQuiz = async () => {
      try {
        await apiClient.startQuiz(quizId);
        // Try to load questions from localStorage
        let loadedQuestions = [];
        if (typeof window !== 'undefined') {
          const qStr = localStorage.getItem(`quiz_questions_${quizId}`);
          if (qStr) {
            loadedQuestions = JSON.parse(qStr);
          }
        }
        console.log('Loaded questions:', loadedQuestions);
        setQuestions(loadedQuestions);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    startQuiz();
  }, [quizId]);

  const handleSubmitAnswer = async () => {
    if (!selectedAnswer) return;

    try {
      await apiClient.submitAnswer(quizId, questions[currentIndex].id, selectedAnswer);
      
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedAnswer('');
      } else {
        router.push(`/quizzes/${quizId}/results`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading quiz...</div>;
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Question {currentIndex + 1} of {questions.length}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {currentQuestion?.question_text}
            </h2>

            <div className="space-y-3 mb-8">
              {currentQuestion?.options.map((option: string, idx: number) => (
                <label
                  key={idx}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedAnswer === option
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-300 hover:border-indigo-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={option}
                    checked={selectedAnswer === option}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    className="mr-3"
                  />
                  {option}
                </label>
              ))}
            </div>

            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedAnswer}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
