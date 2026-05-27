import { NextResponse } from 'next/server';
import { clearSessionCookie, getCurrentUserFromRequest } from '@/lib/auth/session';

export async function GET(request) {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    const response = NextResponse.json({ user: null }, { status: 401 });
    clearSessionCookie(response);
    return response;
  }

  return NextResponse.json({ user });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}
