import { authOptions as nextAuthOptions } from './next-auth';

// Create the auth function for NextAuth v5
export async function auth() {
  // For now, return a mock session
  // In a real app, this would validate the session token
  return {
    user: {
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin',
    },
  };
}

export { nextAuthOptions as authOptions };
