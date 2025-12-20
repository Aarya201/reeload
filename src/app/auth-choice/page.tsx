'use client';
import Link from 'next/link';

export default function AuthChoice() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
      <div className="w-full max-w-2xl px-4">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">🎬 ReelLearn</h1>
          <p className="text-2xl text-white opacity-90">What's your role?</p>
        </div>

        {/* Two Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* CREATOR CARD */}
          <Link href="/creator/signup">
            <div className="bg-white rounded-lg shadow-2xl p-8 text-center cursor-pointer hover:shadow-3xl transition transform hover:scale-105">
              <div className="text-7xl mb-6">📹</div>
              <h2 className="text-3xl font-bold text-blue-600 mb-4">I'm a Creator</h2>
              <p className="text-gray-600 mb-6 text-lg">
                Share your knowledge and earn ₹40 per student
              </p>
              <ul className="text-left space-y-3 mb-6 text-gray-700">
                <li>✅ Upload video courses</li>
                <li>✅ Add multiple reels per course</li>
                <li>✅ Track earnings & analytics</li>
                <li>✅ Get instant payments</li>
              </ul>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition">
                Start Creating 🚀
              </button>
            </div>
          </Link>

          {/* VIEWER/STUDENT CARD */}
          <Link href="/viewer/signup">
            <div className="bg-white rounded-lg shadow-2xl p-8 text-center cursor-pointer hover:shadow-3xl transition transform hover:scale-105">
              <div className="text-7xl mb-6">🎓</div>
              <h2 className="text-3xl font-bold text-blue-600 mb-4">I'm a Student</h2>
              <p className="text-gray-600 mb-6 text-lg">
                Learn from expert creators with affordable courses
              </p>
              <ul className="text-left space-y-3 mb-6 text-gray-700">
                <li>✅ Browse 100+ courses</li>
                <li>✅ Learn at your own pace</li>
                <li>✅ Get certificates</li>
                <li>✅ Lifetime access</li>
              </ul>
              <button className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition">
                Start Learning 📚
              </button>
            </div>
          </Link>

        </div>

        {/* Already Registered */}
        <div className="text-center mt-12">
          <p className="text-white text-lg">
            Already have an account?{' '}
            <Link href="/login" className="font-bold underline hover:text-gray-200">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
