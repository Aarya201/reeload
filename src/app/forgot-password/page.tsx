'use client';
import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showBackToLogin, setShowBackToLogin] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate email
      if (!email.trim()) {
        setError('Please enter your email address');
        setLoading(false);
        return;
      }

      // Check if email is valid format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Send password reset email
      await sendPasswordResetEmail(auth, email);

      // Success!
      setSuccess(true);
      setShowBackToLogin(true);
    } catch (err: any) {
      console.error('Password reset error:', err);

      // User-friendly error messages
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many reset attempts. Please try again later.');
      } else {
        setError(err.message || 'Failed to send reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🔐 Reset Password</h1>
            <p className="text-gray-600">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          {/* Success Message */}
          {success ? (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-green-800 mb-2">Email Sent!</h2>
                <p className="text-green-700 mb-4">
                  We've sent a password reset link to:
                </p>
                <p className="font-semibold text-gray-800 mb-6 break-all">{email}</p>
                <div className="bg-white border border-green-200 rounded p-4 text-left text-sm text-gray-700 space-y-2">
                  <p className="font-semibold">What to do next:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Check your email inbox</li>
                    <li>Click the "Reset Password" link in the email</li>
                    <li>Enter your new password</li>
                    <li>Log in with your new password</li>
                  </ol>
                </div>
              </div>

              {/* Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-sm text-blue-800">
                <p className="mb-2">💡 Didn't receive the email?</p>
                <p className="mb-4">Check your spam folder or try again in a few minutes</p>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="text-blue-600 hover:text-blue-800 font-semibold underline"
                >
                  Try another email
                </button>
              </div>

              {/* Back to Login */}
              <Link
                href="/login"
                className="block w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 text-center transition"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  disabled={loading}
                  autoFocus
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                  <p className="font-semibold">❌ Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? '⏳ Sending...' : '📧 Send Reset Link'}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Back to Login Link */}
              <div className="text-center">
                <p className="text-gray-600 mb-2">Remember your password?</p>
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Back to Login
                </Link>
              </div>

              {/* Sign Up Link */}
              <div className="text-center">
                <p className="text-gray-600 mb-2">Don't have an account?</p>
                <Link
                  href="/auth-choice"
                  className="text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Sign Up
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white text-sm">
          <p>🎬 ReelLearn - Learn Through Reels</p>
        </div>
      </div>
    </div>
  );
}
