import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isDemoMode, findDemoUserByProviderId } from '@/lib/demo/store';
import {
  createTempSessionToken,
  setSessionCookie,
  TEMP_SESSION_COOKIE,
  TEMP_SESSION_MAX_AGE
} from '@/lib/auth/session';

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  const savedState = request.cookies.get('hustfood_oauth_state')?.value;

  if (!state || !savedState || state !== savedState) {
    return NextResponse.json({ error: 'CSRF token mismatch' }, { status: 403 });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/auth/callback/google`;

  const error = url.searchParams.get('error');

  if (error || !code) {
    // If the user cancels the login, redirect back to the login page safely
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 1. Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });
    
    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error('Google token error:', err);
      return NextResponse.json({ error: 'Failed to exchange token' }, { status: 400 });
    }

    const { access_token } = await tokenResponse.json();

    // 2. Get user info
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    if (!profileResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 400 });
    }

    const profile = await profileResponse.json();
    const googleId = profile.sub;
    const email = profile.email;
    const name = profile.name;

    // 3. Find User
    let user = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          provider: 'google',
          providerAccountId: googleId
        }
      });
    } catch (dbError) {
      if (isDemoMode()) {
        user = findDemoUserByProviderId(googleId);
      } else {
        throw dbError; // re-throw if not demo mode
      }
    }

    let response;

    if (user) {
      // User exists, log them in and redirect to home
      response = NextResponse.redirect(new URL('/', request.url));
      setSessionCookie(response, user);
    } else {
      // User is new, setup temp token and redirect to registration setup
      response = NextResponse.redirect(new URL('/login/setup', request.url));
      const tempToken = createTempSessionToken({
        email,
        name,
        googleId
      });
      
      response.cookies.set({
        name: TEMP_SESSION_COOKIE,
        value: tempToken,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: TEMP_SESSION_MAX_AGE
      });
    }

    // Clean up state cookie
    response.cookies.delete('hustfood_oauth_state');

    return response;
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
