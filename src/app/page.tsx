'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';



export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
      {/* Navigation */}
      <nav className="bg-black bg-opacity-50 backdrop-blur-md py-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">🎬 ReelLoad</h1>
          <div className="flex gap-4 items-center">
            {user ? (
              <>
                {user.email}
                <Link href="/courses">Courses</Link>
                <Link href="/search" className="text-blue-600 hover:underline">
                🔍 Search
                </Link>

                <Link href="/creator/dashboard" className="text-white hover:text-gray-200">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-white hover:text-gray-200">
                  Login
                </Link>
                <Link href="/auth-choice" className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-24 text-center">
        <h1 className="text-7xl font-bold text-white mb-6">Learn Through Reels</h1>
        <p className="text-2xl text-white mb-12 opacity-90">
          Master any subject in short, engaging video courses. Just ₹60 per course.
        </p>
        
        {/* Main Buttons */}
        <div className="flex gap-4 justify-center flex-wrap mb-20">
          {user ? (
            <>
              <Link
                href="/courses"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
              >
                🎓 Explore Courses
              </Link>
              <Link
                href="/creator/upload-course"
                className="bg-yellow-400 text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-yellow-300 transition"
              >
                📹 Create Course
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth-choice"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-blue-600 transition"
              >
                Already a Member?
              </Link>
            </>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white bg-opacity-10 backdrop-blur-md p-8 rounded-lg text-black">
            <div className="text-5xl mb-4">⚡</div>
            <h3 className="text-2xl font-bold mb-4">Fast Gen-Z Style Learning</h3>
            <p>45-second to 2-minute videos</p>
          </div>
          
          <div className="bg-white bg-opacity-10 backdrop-blur-md p-8 rounded-lg text-black">
            <div className="text-5xl mb-4">💰</div>
            <h3 className="text-2xl font-bold mb-4">Affordable</h3>
            <p>Just ₹60 per course</p>
          </div>
          
          <div className="bg-white bg-opacity-10 backdrop-blur-md p-8 rounded-lg text-black">
            <div className="text-5xl mb-4">🏆</div>
            <h3 className="text-2xl font-bold mb-4">Certified</h3>
            <p>Get verified certificates</p>
          </div>
        </div> 
      </div>

      {/* Footer */}
      <footer className="bg-black bg-opacity-50 text-white text-center py-8 mt-20">
        <p>&copy; 2025 ReelLoad. Made with 💜 for India.</p>
      </footer>
    </div>
  );
}
