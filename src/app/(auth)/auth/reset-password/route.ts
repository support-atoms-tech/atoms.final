import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
        return NextResponse.redirect(new URL('/forgot-password', request.url));
    }

    // Redirect to the reset password page with the token
    return NextResponse.redirect(
        new URL(`/auth/reset-password?token=${token}`, request.url),
    );
}
