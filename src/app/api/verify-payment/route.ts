import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebase';
import { ref, get, update } from 'firebase/database';

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courseId,
      userId,
      creatorId,
      coursePrice,
    } = await request.json();

    // ✅ VERIFY SIGNATURE - CRITICAL FOR LIVE MODE
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_LIVE_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Signature verified - update database
    // (Removed from frontend for security)
    const courseRef = ref(db, `courses/${courseId}`);
    const courseSnapshot = await get(courseRef);
    
    if (!courseSnapshot.exists()) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    const course = courseSnapshot.val();
    const students = course.students || [];

    if (!students.includes(userId)) {
      students.push(userId);
    }

    await update(courseRef, { students });

    // Update creator earnings
    const creatorRef = ref(db, `creators/${creatorId}`);
    const creatorSnapshot = await get(creatorRef);
    
    if (creatorSnapshot.exists()) {
      const currentEarnings = creatorSnapshot.val().totalEarnings || 0;
      const creatorEarnings = Math.floor(coursePrice * 0.67);
      await update(creatorRef, {
        totalEarnings: currentEarnings + creatorEarnings,
      });
    }

    // Add to user's purchases
    const viewerRef = ref(db, `viewers/${userId}`);
    const viewerSnapshot = await get(viewerRef);
    let purchasedCourseIds = viewerSnapshot.val()?.purchasedCourseIds || [];
    
    if (!purchasedCourseIds.includes(courseId)) {
      purchasedCourseIds.push(courseId);
    }

    await update(viewerRef, {
      purchasedCourseIds,
    });

    return NextResponse.json(
      { success: true, message: 'Payment verified and recorded' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
