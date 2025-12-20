'use client';
import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { ref, get, onValue } from 'firebase/database';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreatorDashboard() {
  const [creator, setCreator] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
      }
    });
    return unsubscribe;
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const creatorRef = ref(db, `creators/${user.uid}`);
    
    const unsubscribe = onValue(creatorRef, (snapshot) => {
      if (snapshot.exists()) {
        setCreator(snapshot.val());
      } else {
        // User is not a creator, redirect to home
        router.push('/'); 
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, router]);

  useEffect(() => {
  if (!user) return;

  const coursesRef = ref(db, 'courses');
  const unsubscribe = onValue(coursesRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const creatorCourses = Object.entries(data)
        .filter(([_, course]: any) => course.creatorId === user.uid)
        .map(([key, value]: any) => ({
          id: key,
          ...value,
        }));

      setCourses(creatorCourses);
    }
  });

  return () => unsubscribe();
}, [user]);

  if (loading) {
    return <div className="text-center py-16 text-white">Loading dashboard...</div>;
  }

  if (!creator) {
    return <div className="text-center py-16 text-white">You are not a creator</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md py-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">🎬 ReelLearn Creator</h1>
          <div className="flex gap-4">
            <Link href="/" className="text-blue-600 hover:underline">Home</Link>
            <button
              onClick={() => auth.signOut().then(() => router.push('/'))}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        
       {/* Stats Cards */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
  <div className="bg-white p-6 rounded-lg shadow-lg">
    <p className="text-gray-600 text-sm">Total Earnings</p>
    <p className="text-4xl font-bold text-green-600">₹{creator.totalEarnings || 0}</p>
  </div>
  <div className="bg-white p-6 rounded-lg shadow-lg">
    <p className="text-gray-600 text-sm">Courses Published</p>
    <p className="text-4xl font-bold text-blue-600">{courses.length}</p>
  </div>
  <div className="bg-white p-6 rounded-lg shadow-lg">
    <p className="text-gray-600 text-sm">Total Students</p>
    <p className="text-4xl font-bold text-purple-600">
      {courses.reduce((sum, course: any) => sum + (course.students?.length || 0), 0)}
    </p>
  </div>
  <div className="bg-white p-6 rounded-lg shadow-lg">
    <p className="text-gray-600 text-sm">Creator Since</p>
    <p className="text-sm font-bold text-gray-700">
      {creator.createdAt ? new Date(creator.createdAt).toLocaleDateString() : 'N/A'}
    </p>
  </div>
</div>


        {/* Creator Info */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">👤 Your Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-gray-600 text-sm">Full Name</p>
              <p className="text-xl font-bold">{creator.fullName || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Email</p>
              <p className="text-xl font-bold">{creator.email}</p>
            </div>
          </div>
        </div>

        {/* Create Course Button */}
        <Link
          href="/creator/upload-course"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700 mb-8"
        >
          + Create New Course
        </Link>

        {/* Courses Section */}
        <h2 className="text-3xl font-bold mb-6">📚 Your Courses</h2>
        {courses.length === 0 ? (
          <div className="bg-white p-12 rounded-lg text-center">
            <p className="text-2xl text-gray-600 mb-6">You haven't created any courses yet</p>
            <Link
              href="/creator/upload-course"
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-bold"
            >
              Create Your First Course
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-6xl">
                  🎬
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">{course.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>{course.reelCount} reels</span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">₹{course.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
