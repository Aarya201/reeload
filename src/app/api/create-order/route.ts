import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    console.log('--- RAZORPAY PROD DEBUG ---');
    console.log('NEXT_PUBLIC_RAZORPAY_KEY_ID =', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
    console.log('RAZORPAY_KEY_SECRET exists =', !!process.env.RAZORPAY_KEY_SECRET);

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Env vars missing on server');
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

    console.log('Order created (PROD):', order.id);

    return NextResponse.json({ success: true, orderId: order.id }, { status: 200 });
  } catch (error: any) {
    console.error('Order creation error (PROD):', {
      message: error?.message,
      code: error?.code,
      statusCode: error?.statusCode,
      description: error?.description,
      full: error,
    });

    const msg =
      error?.description ||
      error?.message ||
      error?.code ||
      'Unknown error (no message from Razorpay)';

    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
