import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import clientPromise from './lib/mongodb';
import { compare } from 'bcrypt';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('[AUTH] Authorize called with email:', credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials');
          return null;
        }

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'fittr_db');
        const usersCollection = db.collection('users');
        
        const user = await usersCollection.findOne({ 
          email: credentials.email 
        });
        
        console.log('[AUTH] User found:', user ? 'Yes' : 'No');
        
        if (!user || !user.password) {
          console.log('[AUTH] User not found or no password');
          return null;
        }

        const passwordMatch = await compare(
          credentials.password,
          user.password
        );

        console.log('[AUTH] Password match:', passwordMatch);

        if (!passwordMatch) {
          console.log('[AUTH] Password mismatch');
          return null;
        }

        console.log('[AUTH] Authentication successful for:', user.email);
        return {
          id: user.id || user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        };
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
      }
      return session;
    }
  }
});