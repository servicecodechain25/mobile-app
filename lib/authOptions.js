import CredentialsProvider from 'next-auth/providers/credentials';
import { findUserByEmail } from './db';
import bcrypt from 'bcryptjs';

/**
 * NextAuth configuration with credentials provider
 * Handles user authentication and session management
 */
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await findUserByEmail(credentials.email);
          if (!user) return null;

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;

          // Permissions are already parsed by findUserByEmail
          // Ensure permissions is always an object (never null or array)
          let parsedPermissions = user.permissions;
          
          // Debug: Log what we received from findUserByEmail
          console.log('authOptions - Received from findUserByEmail:', {
            email: user.email,
            role: user.role,
            permissionsType: typeof parsedPermissions,
            permissionsValue: parsedPermissions,
            isNull: parsedPermissions === null,
            isUndefined: parsedPermissions === undefined,
            isObject: parsedPermissions && typeof parsedPermissions === 'object',
            isArray: Array.isArray(parsedPermissions)
          });
          
          // Only convert to {} if it's null, undefined, or invalid
          // If it's a valid object with permissions, keep it!
          if (parsedPermissions === null || parsedPermissions === undefined) {
            console.log('Permissions is null/undefined, setting to empty object');
            parsedPermissions = {};
          } else if (Array.isArray(parsedPermissions)) {
            console.log('Permissions is array (invalid), setting to empty object');
            parsedPermissions = {};
          } else if (typeof parsedPermissions !== 'object') {
            console.log('Permissions is not an object, setting to empty object');
            parsedPermissions = {};
          } else {
            console.log('Permissions is valid object, keeping it:', parsedPermissions);
          }

          // Final debug logging
          console.log('authOptions - Final permissions for session:', parsedPermissions);

          return { 
            id: String(user.id), 
            name: user.name, 
            email: user.email, 
            role: user.role,
            permissions: parsedPermissions
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        // Ensure permissions is always an object
        token.permissions = user.permissions || {};
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id;
        session.user.role = token.role;
        // Ensure permissions is always an object, not null
        session.user.permissions = token.permissions || {};
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If redirecting to login page, preserve the callbackUrl
      if (url.includes('/login')) {
        return url;
      }
      // For other redirects, remove callbackUrl parameter
      try {
        const urlObj = new URL(url, baseUrl);
        urlObj.searchParams.delete('callbackUrl');
        const cleanUrl = urlObj.toString().replace(baseUrl, '') || '/dashboard';
        return cleanUrl.startsWith('/') ? cleanUrl : '/dashboard';
      } catch {
        // If URL parsing fails, return dashboard
        return '/dashboard';
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

