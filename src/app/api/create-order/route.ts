import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    console.log('--- RAZORPAY DEBUG ---');
    console.log('process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID =', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
    console.log('process.env.RAZORPAY_LIVE_KEY_SECRET exists =', !!process.env.RAZORPAY_KEY_SECRET);

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Env vars missing on server' },
        { status: 500 }
      );
    }

    const { amount, courseId, userId } = await request.json();

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const shortCourseId = String(courseId).slice(0, 10);
    const shortUserId = String(userId).slice(0, 10);
    
    const order = await razorpay.orders.create({
      amount,
      currency: 'INR',
      receipt: `c_${shortCourseId}_u_${shortUserId}_${Date.now().toString().slice(-6)}`,
      notes: { courseId, userId },
    });

    return NextResponse.json({ success: true, orderId: order.id }, { status: 200 });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
