import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const { amount, courseId, userId } = await request.json();

    // ✅ Initialize with LIVE keys
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_LIVE_KEY_ID!, // ✅ Live key
      key_secret: process.env.RAZORPAY_LIVE_KEY_SECRET!, // ✅ Live secret
    });

    // Create Razorpay Order
    const order = await razorpay.orders.create({
      amount: amount, // in paise
      currency: 'INR',
      receipt: `course_${courseId}_user_${userId}`,
      notes: {
        courseId,
        userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
