'use client';
import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { ref, get, onValue } from 'firebase/database';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  reelCount: number;
  progress?: number;
}

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
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

    const viewerRef = ref(db, `viewers/${user.uid}`);

    const unsubscribe = onValue(viewerRef, async (snapshot) => {
      if (snapshot.exists()) {
        const purchasedCourseIds = snapshot.val().purchasedCourseIds || [];
        
        const coursesList: Course[] = [];
        for (const courseId of purchasedCourseIds) {
          const courseRef = ref(db, `courses/${courseId}`);
          const courseSnapshot = await get(courseRef);
          if (courseSnapshot.exists()) {
            coursesList.push({
              id: courseId,
              ...courseSnapshot.val(),
            });
          }
        }
        setCourses(coursesList);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md py-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">🎬 ReelLearn</Link>
          <div className="flex gap-4 items-center">
            <span className="text-gray-700">{user.email}</span>
            <Link href="/courses" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Explore Courses
            </Link>
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
        <h1 className="text-4xl font-bold mb-8">📚 My Courses</h1>

        {loading ? (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">Loading your courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg">
            <p className="text-2xl text-gray-600 mb-8">You haven't purchased any courses yet</p>
            <Link
              href="/courses"
              className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-700"
            >
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link key={course.id} href={`/watch/${course.id}`}>
                <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer h-full flex flex-col">
                  <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-6xl">
                    🎬
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 flex-1">{course.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                      <span>{course.reelCount} reels</span>
                      <span>₹{course.price}</span>
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 text-sm">
                      Continue Learning
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
