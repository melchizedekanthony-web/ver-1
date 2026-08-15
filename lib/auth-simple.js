import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

// SECURITY: this signs every user's session token. There must be no hardcoded
// fallback here — a fallback that ships in the source code isn't a secret at
// all, and anyone who can read the repo can forge a valid session for any
// user. Fail loudly instead of silently signing with a known, guessable
// value. Set NEXTAUTH_SECRET to a long random string (e.g. `openssl rand
// -base64 32`) in the real deployment environment, not in source.
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    'NEXTAUTH_SECRET is not set. Refusing to start: session tokens must not be signed with a default/guessable secret.'
  );
}

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

export async function createSession(user) {
  const token = await new SignJWT({ 
    id: user.id,
    email: user.email,
    name: user.name 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);

  return token;
}

export async function verifySession(token) {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload;
  } catch (err) {
    return null;
  }
}

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get('session')?.value;
  
  if (!token) return null;
  
  return await verifySession(token);
}
