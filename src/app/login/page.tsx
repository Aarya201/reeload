'use client';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';


export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);


    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;
      
      // Try to determine if user is creator or viewer by checking both databases
      // This is handled on the next page load - user will be redirected based on their type
      alert('✅ Logged in! Redirecting...');
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6">Login</h1>



        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}


        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>


          <div>
            <label className="block text-sm font-bold mb-2 text-gray-800">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full p-3 border rounded-lg focus:outline-none focus:border-blue-500 text-gray-900"
              required
            />
          </div>


          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? '⏳ Logging in...' : '🔓 Login'}
          </button>
          
        </form>


        <div className="mt-6 text-center space-y-3">
          <div>
            <Link
              href="/forgot-password"
              className="text-blue-600 hover:underline font-semibold text-sm"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="border-t border-gray-300 pt-3">
            <p className="text-gray-600 mb-2">Don't have an account?</p>
            <Link href="/auth-choice" className="text-blue-600 font-bold hover:underline">
              Sign up here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}