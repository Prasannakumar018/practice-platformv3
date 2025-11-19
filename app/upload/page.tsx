'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      await apiClient.uploadFile(file);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Upload Document</h1>

          <div className="bg-white rounded-xl shadow-md p-8">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select PDF or PowerPoint file
              </label>
              <input
                type="file"
                accept=".pdf,.ppt,.pptx"
                onChange={handleFileChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">Selected: {file.name}</p>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
