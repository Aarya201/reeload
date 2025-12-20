'use client';
import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { searchCourses, SearchableResult } from '@/lib/fuzzySearch';

interface Course extends SearchableResult {
  id: string;
  title: string;
  description: string;
  creatorName: string;
  price: number;
  reelCount: number;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const router = useRouter();

  // Auth check
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [router]);

  // Fetch all courses with creator names
  useEffect(() => {
    if (!user) return;

    const coursesRef = ref(db, 'courses');
    const creatorsRef = ref(db, 'creators');

    const unsubscribe = onValue(coursesRef, async (coursesSnapshot) => {
      const creatorsSnapshot = await new Promise((resolve) => {
        onValue(creatorsRef, resolve, { onlyOnce: true });
      });

      const coursesData = coursesSnapshot.val();
      const creatorsData = (creatorsSnapshot as any).val() || {};

      if (coursesData) {
        const coursesList: Course[] = Object.entries(coursesData).map(
          ([key, value]: any) => {
            const creatorId = value.creatorId;
            const creator = creatorsData[creatorId] || {};

            return {
              id: key,
              title: value.title || '',
              description: value.description || '',
              creatorName: creator.fullName || creator.email || 'Unknown',
              price: value.price || 0,
              reelCount: value.reelCount || 0,
              matchScore: 0,
            };
          }
        );

        setAllCourses(coursesList);
        setFilteredCourses(coursesList); // Show all by default
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Real-time search with debouncing
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCourses(allCourses);
      setSearching(false);
      return;
    }

    setSearching(true);

    // Small delay to avoid too many calculations
    const debounceTimer = setTimeout(() => {
      const results = searchCourses(searchQuery, allCourses);
      setFilteredCourses(results);
      setSearching(false);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, allCourses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md py-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            🎬 ReelLearn
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/courses" className="text-blue-600 hover:underline">
              Browse Courses
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

      {/* Search Section */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">🔍 Search Courses</h1>
        <p className="text-gray-600 mb-8">
          Search by course title, description, or creator name. Typos are okay!
        </p>

        {/* Search Input */}
        <div className="mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses, creators, topics... (e.g., 'recat', 'john', 'web design')"
            className="w-full px-6 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-lg"
            autoFocus
          />
          {searching && (
            <p className="text-gray-500 text-sm mt-2">🔎 Searching...</p>
          )}
        </div>

        {/* Results Count */}
        {searchQuery && (
          <div className="mb-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-800 font-semibold">
              Found {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
              {searchQuery && ` for "${searchQuery}"`}
            </p>
          </div>
        )}

        {/* No Results */}
        {searchQuery && filteredCourses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-3xl mb-4">😞</p>
            <p className="text-2xl text-gray-600 mb-4">No courses found</p>
            <p className="text-gray-500 mb-8">
              Try searching with different keywords or check the course list
            </p>
            <Link
              href="/courses"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700"
            >
              Browse All Courses
            </Link>
          </div>
        ) : (
          /* Results Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Link key={course.id} href={`/course/${course.id}`}>
                <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer h-full flex flex-col">
                  {/* Course Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-6xl">
                    🎬
                  </div>

                  {/* Course Info */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">
                      {course.title}
                    </h3>

                    {/* Creator Info */}
                    <p className="text-blue-600 text-sm font-semibold mb-2">
                      👨‍🏫 {course.creatorName}
                    </p>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                      {course.description}
                    </p>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <span className="text-blue-600 font-bold text-lg">
                        ₹{course.price}
                      </span>
                      <span className="text-gray-500 text-xs bg-gray-100 px-2 py-1 rounded">
                        {course.reelCount} videos
                      </span>
                    </div>
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
