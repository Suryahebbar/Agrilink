import { JWT } from 'next-auth/jwt';
import { signAuthToken, verifyAuthToken, type AuthTokenPayload } from './auth';

// Define the auth options type locally for NextAuth v5
export interface AuthOptions {
  providers: any[];
  session: {
    strategy: 'jwt';
    maxAge: number;
  };
  callbacks: {
    jwt: (params: { token: any; user?: any }) => Promise<any>;
    session: (params: { session: any; token: any }) => Promise<any>;
  };
  pages: {
    signIn: string;
    error: string;
  };
  secret: string;
}

export const authOptions: AuthOptions = {
  providers: [
    // Add your authentication providers here
    // For example: Email/Password, Google, etc.
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Add user info to the token on sign in
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Add token data to session
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key', // In production, use environment variable
};

// Helper function to get the current user from the token
export async function getCurrentUser(token: string): Promise<AuthTokenPayload | null> {
  try {
    return await verifyAuthToken(token);
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

// Helper function to create a session token
export async function createSessionToken(payload: AuthTokenPayload): Promise<string> {
  return signAuthToken(payload);
}
