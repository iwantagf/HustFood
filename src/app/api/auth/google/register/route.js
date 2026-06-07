import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDemoMode, addDemoUser } from '@/lib/demo/store';
import { createSessionToken, verifyTempSessionToken, SESSION_COOKIE } from '@/lib/auth/session';
import { sanitizeUser } from '@/lib/auth/users';

export async function POST(request) {
  try {
    const tempToken = request.cookies.get('hustfood_oauth_temp')?.value;
    
    if (!tempToken) {
      return NextResponse.json({ error: 'Phiên đăng ký đã hết hạn. Vui lòng thử đăng nhập lại bằng Google.' }, { status: 401 });
    }

    const decoded = verifyTempSessionToken(tempToken);
    if (!decoded) {
      return NextResponse.json({ error: 'Token không hợp lệ hoặc đã hết hạn.' }, { status: 401 });
    }

    const { email, name, googleId } = decoded;

    const body = await request.json();
    let { username, role } = body;

    if (!username) {
      return NextResponse.json({ error: 'Vui lòng nhập Username' }, { status: 400 });
    }

    // Whitelist check
    if (!['customer', 'seller', 'shipper'].includes(role)) {
      role = 'customer';
    }

    const newUserObj = {
      email,
      username,
      displayName: name || username,
      role,
      status: 'active',
      provider: 'google',
      providerAccountId: googleId
    };

    let user;
    try {
      user = await prisma.user.create({
        data: newUserObj
      });
    } catch (dbError) {
      if (isDemoMode()) {
        addDemoUser(newUserObj);
        user = {
          id: `demo-user-${Date.now()}`,
          ...newUserObj
        };
      } else {
        console.error('Database error on user creation:', dbError);
        return NextResponse.json({ error: 'Lỗi hệ thống khi tạo tài khoản' }, { status: 500 });
      }
    }

    const response = NextResponse.json({ 
      success: true, 
      user: sanitizeUser(user), 
      redirectUrl: role === 'customer' ? '/' : `/${role}` 
    });

    response.cookies.set({
      name: SESSION_COOKIE,
      value: createSessionToken(user),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    response.cookies.delete('hustfood_oauth_temp');

    return response;
  } catch (error) {
    console.error('Google Register Error:', error);
    return NextResponse.json({ error: 'Đã có lỗi xảy ra' }, { status: 500 });
  }
}
