'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { signOut, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function navbar() {
  const [user, setUser] = useState<User | null>(null);
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

  if (loading) return null;

  return (
    <nav className="bg-white shadow-md py-4">
      <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="font-bold text-lg md:text-2xl">
          🎬 ReelLoad
        </Link>

        {user ? (
          <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-end">
            <span className="text-xs md:text-sm text-gray-600 truncate max-w-[100px] md:max-w-none">
              {user.email}
            </span>
            <Link
              href="/courses"
              className="text-xs md:text-sm text-blue-600 hover:underline whitespace-nowrap"
            >
              Courses
            </Link>
            <Link
              href="/search"
              className="text-xs md:text-sm text-blue-600 hover:underline whitespace-nowrap"
            >
              🔍 Search
            </Link>
            <Link
              href="/dashboard"
              className="text-xs md:text-sm text-blue-600 hover:underline whitespace-nowrap"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs md:text-sm bg-red-600 text-white px-2 md:px-4 py-1 rounded hover:bg-red-700 whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 md:gap-4">
            <Link
              href="/login"
              className="text-xs md:text-sm text-blue-600 hover:underline"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="text-xs md:text-sm bg-blue-600 text-white px-2 md:px-4 py-1 rounded hover:bg-blue-700"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
