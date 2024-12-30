import type { NextAuthConfig } from 'next-auth';
import Credential from 'next-auth/providers/credentials'
 
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  // middleware
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLogedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if(isOnDashboard) {
        // If the user is authenticated, return true
        if (isLogedIn) return true;
        return false;
      } else if(isLogedIn) {
        // If the user is authenticated, redirect to the dashboard
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      return true;
    }
  },
  providers: [Credential({})] // add providers here
} satisfies NextAuthConfig;
