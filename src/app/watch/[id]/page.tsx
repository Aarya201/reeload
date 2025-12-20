'use client';
import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Course {
  title: string;
  videos: string[];
  reelCount: number;
}

export default function WatchCourse() {
  const params = useParams();
  const courseId = params.id as string;
  const [course, setCourse] = useState<any>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [certificateEarned, setCertificateEarned] = useState(false);
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
  }, []);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      const courseRef = ref(db, `courses/${courseId}`);
      const snapshot = await get(courseRef);
      if (snapshot.exists()) {
        const courseData = snapshot.val();
        setCourse(courseData);
        setIsPurchased(courseData.students?.includes(user?.uid) || false);
      }
      setLoading(false);
    };

    if (user) {
      fetchCourse();
    }
  }, [courseId, user]);

  const handleNextVideo = () => {
    if (course && currentVideoIndex < course.videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else if (course && currentVideoIndex === course.videos.length - 1) {
      setCertificateEarned(true);
    }
  };

  if (loading) return <div className="text-center py-16">Loading course...</div>;
  if (!course) return <div className="text-center py-16">Course not found</div>;
  if (!isPurchased) return <div className="text-center py-16">You haven't purchased this course</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md py-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <Link href="/courses" className="text-blue-600 hover:underline">
            ← Back
          </Link>
          <h1 className="text-xl font-bold">{course.title}</h1>
          <button
            onClick={() => auth.signOut().then(() => router.push('/'))}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {certificateEarned ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-9xl mb-8">🏆</div>
            <h2 className="text-4xl font-bold mb-4">Congratulations!</h2>
            <p className="text-xl text-gray-600 mb-8">You've completed {course.title}</p>

            <div className="bg-gradient-to-br from-yellow-100 to-orange-100 p-8 rounded-lg mb-8 border-2 border-yellow-500">
              <p className="text-gray-700 text-lg mb-4">Certificate of Completion</p>
              <p className="text-2xl font-bold text-orange-600 mb-4">{user?.email}</p>
              <p className="text-gray-600">Has successfully completed</p>
              <p className="text-3xl font-bold text-orange-700 mb-4">{course.title}</p>
              <p className="text-gray-600">{new Date().toLocaleDateString()}</p>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700"
              >
                📥 Download Certificate
              </button>
              <Link
                href="/courses"
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700"
              >
                Explore More Courses
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Video Player */}
            <div className="bg-black rounded-lg overflow-hidden mb-8">
              <video
                width="100%"
                height="500"
                controls
                src={course.videos[currentVideoIndex]}
                className="bg-black"
              />
            </div>

            {/* Progress */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow">
              <p className="text-gray-700 font-semibold mb-2">
                Video {currentVideoIndex + 1} of {course.videos.length}
              </p>
              <div className="w-full bg-gray-300 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.round(
                      ((currentVideoIndex + 1) / course.videos.length) * 100
                    )}%`,
                  }}
                />
              </div>
              <p className="text-gray-600 text-sm mt-2">
                {Math.round(
                  ((currentVideoIndex + 1) / course.videos.length) * 100
                )}
                % Complete
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() =>
                  setCurrentVideoIndex(Math.max(0, currentVideoIndex - 1))
                }
                disabled={currentVideoIndex === 0}
                className="px-8 py-3 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              <button
                onClick={handleNextVideo}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
              >
                {currentVideoIndex === course.videos.length - 1
                  ? '✅ Complete & Get Certificate'
                  : 'Next →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}