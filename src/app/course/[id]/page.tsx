'use client';
import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Course {
  title: string;
  description: string;
  price: number;
  creatorId: string;
  videos: string[];
  reelCount: number;
  students?: string[];
}


export default function CoursePage() {
  const [loading, setLoading] = useState(true);  // ← ADD THIS
  const params = useParams();
  const courseId = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const router = useRouter();

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
  }, []);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      const courseRef = ref(db, `courses/${courseId}`);
      const snapshot = await get(courseRef);
      if (snapshot.exists()) {
        setCourse(snapshot.val());
      }
    };

    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    if (!course || !user) return;
    setIsPurchased(course.students?.includes(user.uid) || false);
  }, [course, user]);

  if (loading) {
  return <div className="p-8 text-center">Loading...</div>;
}

if (!user) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Please login first</h2>
      <button onClick={() => router.push('/login')}>Go to Login</button>
    </div>
  );
}

  const handlePayment = async () => {
    if (!user || !course) return;

    setProcessingPayment(true);

    // Simulate Razorpay payment
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: course.price * 100,
      currency: 'INR',
      name: 'ReelLearn',
      description: course.title,
      handler: async () => {
        // Payment successful - add user to course
        const courseRef = ref(db, `courses/${courseId}`);
        const students = course.students || [];
        if (!students.includes(user.uid)) {
          students.push(user.uid);
        }
        await update(courseRef, { students });

        const creatorRef = ref(db, `creators/${course.creatorId}`);
        const creatorSnapshot = await get(creatorRef);
        if (creatorSnapshot.exists()) {
        const currentEarnings = creatorSnapshot.val().totalEarnings || 0;
        const creatorEarnings = Math.floor(course.price * 0.67);
        await update(creatorRef, {
        totalEarnings: currentEarnings + creatorEarnings,
        })
      }
      

        // Add to user's purchases
        // Add to user's purchases
        const viewerRef = ref(db, `viewers/${user.uid}`);
        const viewerSnapshot = await get(viewerRef);
        let purchasedCourseIds = viewerSnapshot.val()?.purchasedCourseIds || [];
        if (!purchasedCourseIds.includes(courseId)) {
          purchasedCourseIds.push(courseId);
        }
        await update(viewerRef, {
          purchasedCourseIds: purchasedCourseIds,
        });


        alert('✅ Course purchased! Redirecting...');
        router.push(`/watch/${courseId}`);
      },
      prefill: {
        email: user.email,
      },
    };

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    };
    document.body.appendChild(script);

    setProcessingPayment(false);
  };

  if (loading) return <div className="text-center py-16">Loading course...</div>;
  if (!course) return <div className="text-center py-16">Course not found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md py-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <Link href="/courses" className="text-blue-600 hover:underline">← Back to Courses</Link>
          <button
            onClick={() => auth.signOut().then(() => router.push('/'))}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Course Details */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-9xl">
            🎬
          </div>

          <div className="p-8">
            <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
            <p className="text-xl text-gray-600 mb-6">{course.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 py-8 border-y">
              <div>
                <p className="text-gray-600 text-sm">Price</p>
                <p className="text-3xl font-bold text-blue-600">₹{course.price}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Reels</p>
                <p className="text-3xl font-bold text-purple-600">{course.reelCount}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Students</p>
                <p className="text-3xl font-bold text-green-600">{course.students?.length || 0}</p>
              </div>
            </div>

            {isPurchased ? (
              <Link
                href={`/watch/${courseId}`}
                className="w-full block text-center bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition"
              >
                ✅ Start Learning
              </Link>
            ) : (
              <button
                onClick={handlePayment}
                disabled={processingPayment}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {processingPayment ? '⏳ Processing...' : '💳 Buy Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
