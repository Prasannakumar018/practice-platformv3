import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Practice & Self-Evaluation Platform
          </h1>
          <p className="text-xl text-gray-700 mb-12">
            Upload your study materials and generate AI-powered quizzes tailored to your learning needs
          </p>
          
          <div className="flex gap-4 justify-center mb-16">
            <Link
              href="/auth/signup"
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              Get Started
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition"
            >
              Sign In
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-xl font-semibold mb-2">Upload Documents</h3>
              <p className="text-gray-600">Upload PDFs and presentations to extract content</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold mb-2">Customize Rules</h3>
              <p className="text-gray-600">Set difficulty, topics, and question types</p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Take Quizzes</h3>
              <p className="text-gray-600">Practice with AI-generated questions and track progress</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
