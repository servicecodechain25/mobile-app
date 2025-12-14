import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: ['/admin', '/admin/:path*', '/dashboard', '/dashboard/:path*', '/brands', '/brands/:path*', '/stock', '/stock/:path*', '/reports', '/reports/:path*', '/staff', '/staff/:path*', '/profile', '/profile/:path*', '/activity', '/activity/:path*'],
};

