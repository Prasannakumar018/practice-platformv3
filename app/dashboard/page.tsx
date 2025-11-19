'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userData, filesData] = await Promise.all([
          apiClient.getCurrentUser(),
          apiClient.getFiles(),
        ]);
        setUser(userData);
        setFiles(filesData);
      } catch (error) {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleLogout = () => {
    apiClient.clearToken();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Practice Platform</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Welcome back, {user?.full_name || user?.email}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/upload"
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition"
          >
            <div className="text-4xl mb-4">📤</div>
            <h3 className="text-xl font-semibold mb-2">Upload Files</h3>
            <p className="text-gray-600">Upload PDFs and presentations</p>
          </Link>

          <Link
            href="/rulesets/create"
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition"
          >
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-xl font-semibold mb-2">Create Ruleset</h3>
            <p className="text-gray-600">Configure quiz generation rules</p>
          </Link>

          <Link
            href="/quizzes/generate"
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition"
          >
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-semibold mb-2">Generate Quiz</h3>
            <p className="text-gray-600">Create AI-powered quizzes</p>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-2xl font-bold mb-4">Your Files</h3>
          {files.length === 0 ? (
            <p className="text-gray-600">No files uploaded yet</p>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-semibold">{file.filename}</p>
                    <p className="text-sm text-gray-600">
                      Status: <span className="capitalize">{file.status}</span>
                    </p>
                    {file.status === 'failed' && file.error_message && (
                      <p className="text-sm text-red-600 mt-1">Error: {file.error_message}</p>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(file.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
