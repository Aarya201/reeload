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
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isPurchased, setIsPurchased] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();

  // ✅ AUTH CHECK
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        router.push('/login');
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [router]);

  // ✅ FETCH COURSE DATA
  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        const courseRef = ref(db, `courses/${courseId}`);
        const snapshot = await get(courseRef);
        if (snapshot.exists()) {
          setCourse(snapshot.val());
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      }
    };

    fetchCourse();
  }, [courseId]);

  // ✅ CHECK IF USER ALREADY PURCHASED
  useEffect(() => {
    if (!course || !user) return;
    setIsPurchased(course.students?.includes(user.uid) || false);
  }, [course, user]);

  // ✅ HANDLE RAZORPAY PAYMENT - LIVE MODE
  const handlePayment = async () => {
    if (!user || !course) return;

    setProcessingPayment(true);
    setPaymentError(null);

    try {
      // Step 1: Create order on backend
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: course.price * 100, // Convert to paise
          courseId: courseId,
          userId: user.uid,
          userName: user.displayName || 'Student',
          userEmail: user.email,
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Step 2: Setup Razorpay options - LIVE MODE
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // ✅ Live Key (rzp_live_xxxxx)
        amount: course.price * 100, // Amount in paise
        currency: 'INR',
        name: 'ReelLearn',
        description: course.title,
        order_id: orderData.orderId, // ✅ Order ID from backend
        image: '/logo.png', // Optional: your logo
        
        // ✅ PREFILL with actual user data
        prefill: {
          name: user.displayName || '',
          email: user.email || '',
          contact: user.phoneNumber || '',
        },

        // ✅ SUCCESS HANDLER
        handler: async (response: any) => {
          try {
            // Step 3: Verify payment on backend - CRITICAL FOR LIVE MODE
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                courseId: courseId,
                userId: user.uid,
                creatorId: course.creatorId,
                coursePrice: course.price,
              }),
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              // Payment verified - update database
              await updateCourseAndUserData();
              alert('✅ Payment successful! Starting course...');
              router.push(`/watch/${courseId}`);
            } else {
              setPaymentError('Payment verification failed. Please contact support.');
              alert('❌ Payment verification failed');
            }
          } catch (error) {
            console.error('Verification error:', error);
            setPaymentError('Error verifying payment');
          }
        },

        // ✅ FAILURE HANDLER
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
            setPaymentError('Payment cancelled');
          },
        },
      };

      // Step 4: Load Razorpay script and open checkout
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        // @ts-ignore
        const razorpay = new window.Razorpay(options);
        razorpay.open();
      };
      script.onerror = () => {
        setPaymentError('Failed to load payment gateway');
        setProcessingPayment(false);
      };
      document.body.appendChild(script);

    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'Payment failed. Please try again.');
      setProcessingPayment(false);
    }
  };

  // ✅ UPDATE FIREBASE AFTER VERIFIED PAYMENT
  const updateCourseAndUserData = async () => {
    try {
      // 1. Add student to course
      const courseRef = ref(db, `courses/${courseId}`);
      const students = course?.students || [];
      if (!students.includes(user.uid)) {
        students.push(user.uid);
      }
      await update(courseRef, { students });

      // 2. Update creator earnings (67% for creator, 33% for platform)
      const creatorRef = ref(db, `creators/${course?.creatorId}`);
      const creatorSnapshot = await get(creatorRef);
      if (creatorSnapshot.exists()) {
        const currentEarnings = creatorSnapshot.val().totalEarnings || 0;
        const creatorEarnings = Math.floor(course!.price * 0.67);
        await update(creatorRef, {
          totalEarnings: currentEarnings + creatorEarnings,
        });
      }

      // 3. Add course to user's purchases
      const viewerRef = ref(db, `viewers/${user.uid}`);
      const viewerSnapshot = await get(viewerRef);
      let purchasedCourseIds = viewerSnapshot.val()?.purchasedCourseIds || [];
      if (!purchasedCourseIds.includes(courseId)) {
        purchasedCourseIds.push(courseId);
      }
      await update(viewerRef, {
        purchasedCourseIds: purchasedCourseIds,
      });

      // Update UI
      setIsPurchased(true);
    } catch (error) {
      console.error('Error updating data:', error);
    }
  };

  // ✅ LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  // ✅ NOT LOGGED IN
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Login First</h2>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ✅ COURSE NOT FOUND
  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course Not Found</h2>
          <Link
            href="/courses"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 inline-block"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-md py-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <Link href="/courses" className="text-blue-600 hover:underline font-semibold">
            ← Back to Courses
          </Link>
          <button
            onClick={() => auth.signOut().then(() => router.push('/'))}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Course Details */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Course Thumbnail */}
          <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-9xl">
            🎬
          </div>

          {/* Course Info */}
          <div className="p-8">
            <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
            <p className="text-xl text-gray-600 mb-6">{course.description}</p>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 py-8 border-y">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Price</p>
                <p className="text-3xl font-bold text-blue-600">₹{course.price}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold">Content</p>
                <p className="text-3xl font-bold text-purple-600">{course.reelCount} Reels</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold">Students</p>
                <p className="text-3xl font-bold text-green-600">{course.students?.length || 0}</p>
              </div>
            </div>

            {/* Error Message */}
            {paymentError && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                ❌ {paymentError}
              </div>
            )}

            {/* Purchase Button */}
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
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {processingPayment ? '⏳ Processing Payment...' : '💳 Buy Now (Live Mode)'}
              </button>
            )}

            {/* Payment Info */}
            <p className="text-center text-sm text-gray-500 mt-4">
              💡 Safe and secure payment powered by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
