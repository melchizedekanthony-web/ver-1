import NextAuth from 'next-auth';
import { MongoDBAdapter } from '@auth/mongodb-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import clientPromise from './lib/mongodb';
import { compare } from 'bcrypt';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const client = await clientPromise;
        const db = client.db(process.env.DB_NAME || 'fittr_db');
        const usersCollection = db.collection('users');
        
        const user = await usersCollection.findOne({ 
          email: credentials.email 
        });
        
        if (!user || !user.password) {
          return null;
        }

        const passwordMatch = await compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    }
  }
});