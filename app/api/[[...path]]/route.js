import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { hash, compare } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import openai from '@/lib/openai';
import { createSession as createAuthSession, verifySession } from '@/lib/auth-simple';

// Helper function to get the real signed-in user from the request.
// Returns null when there is no valid session — callers already check
// `if (!user) return 401` everywhere, so null is the correct "not signed in"
// signal rather than silently substituting a shared demo account.
async function getCurrentUser(request) {
  try {
    // First check for Authorization header (from localStorage token)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const session = await verifySession(token);
      if (session) return session;
    }

    // Then check cookies (httpOnly session cookie set on sign in)
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {});

      const token = cookies.session;
      if (token) {
        const session = await verifySession(token);
        if (session) return session;
      }
    }
  } catch (error) {
    console.error('Get current user error:', error);
  }

  return null;
}


// ========== SIMPLE AUTH ROUTES ==========

// POST /api/signin - Simple sign in
async function simpleSignIn(request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing email or password' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ email });
    
    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const passwordMatch = await compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session token
    const token = await createAuthSession({
      id: user.id || user._id.toString(),
      email: user.email,
      name: user.name
    });

    // Set cookie
    const response = NextResponse.json({
      success: true,
      token: token, // Return token in response too
      user: {
        id: user.id || user._id.toString(),
        email: user.email,
        name: user.name
      }
    });

    response.cookies.set('session', token, {
      httpOnly: true,
      secure: false, // Changed for preview environment
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: 'An error occurred during sign in' },
      { status: 500 }
    );
  }
}

// POST /api/signout - Simple sign out
async function simpleSignOut(request) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('session');
  return response;
}

// GET /api/session - Get current session
async function getSessionData(request) {
  const session = await getCurrentUser(request);
  
  if (!session) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ 
    user: {
      id: session.id,
      email: session.email,
      name: session.name
    }
  });
}

// ========== AUTH ROUTES ==========

// POST /api/auth/register - User Registration
async function registerUser(request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;
    
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection('users');
    
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }
    
    const hashedPassword = await hash(password, 10);
    const userId = uuidv4();
    
    const result = await usersCollection.insertOne({
      id: userId,
      name,
      email,
      password: hashedPassword,
      onboardingComplete: false,
      radarCredits: 3, // starter Radar Boost credits — see monetization notes
      createdAt: new Date(),
    });
    
    return NextResponse.json(
      { 
        message: 'User registered successfully',
        userId: userId
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}

// ========== ONBOARDING ROUTES ==========

// GET /api/profile - Get user profile
async function getProfile(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    const profile = await usersCollection.findOne(
      { email: user.email },
      { projection: { password: 0 } }
    );

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Real stats — no more hardcoded "34 Activities / 28 Connections / 5.0
    // (42 Meetups)" shown to every user regardless of actual history.
    const activitiesCollection = db.collection('activities');
    const messagesCollection = db.collection('messages');
    const reviewsCollection = db.collection('reviews');

    const [activitiesCount, myMessages, ratingAgg] = await Promise.all([
      activitiesCollection.countDocuments({ userId: profile.id }),
      messagesCollection.find(
        { $or: [{ senderId: profile.id }, { recipientId: profile.id }] },
        { projection: { senderId: 1, recipientId: 1 } }
      ).toArray(),
      reviewsCollection.aggregate([
        { $match: { targetId: profile.id, targetType: 'user' } },
        { $group: { _id: '$targetId', avgRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }
      ]).toArray()
    ]);

    const connectionIds = new Set(
      myMessages.map(m => (m.senderId === profile.id ? m.recipientId : m.senderId))
    );

    const stats = {
      activitiesCount,
      connectionsCount: connectionIds.size,
      avgRating: ratingAgg.length ? Math.round(ratingAgg[0].avgRating * 10) / 10 : null,
      reviewCount: ratingAgg.length ? ratingAgg[0].reviewCount : 0
    };

    return NextResponse.json({ profile, stats });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// POST /api/profile/basic - Update basic info (Step 2)
async function updateBasicInfo(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, dob, gender, profilePhoto } = body;

    const db = await getDb();
    const usersCollection = db.collection('users');
    
    await usersCollection.updateOne(
      { email: user.email },
      { 
        $set: { 
          name,
          dob,
          gender,
          profilePhoto,
          onboardingStep: 2,
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({ message: 'Basic info updated' });
  } catch (error) {
    console.error('Update basic info error:', error);
    return NextResponse.json({ error: 'Failed to update basic info' }, { status: 500 });
  }
}

// POST /api/profile/fitness - Update fitness identity (Step 3)
async function updateFitnessIdentity(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fitnessLevel, goals, experienceYears } = body;

    const db = await getDb();
    const usersCollection = db.collection('users');
    
    await usersCollection.updateOne(
      { email: user.email },
      { 
        $set: { 
          fitnessLevel,
          goals,
          experienceYears,
          onboardingStep: 3,
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({ message: 'Fitness identity updated' });
  } catch (error) {
    console.error('Update fitness identity error:', error);
    return NextResponse.json({ error: 'Failed to update fitness identity' }, { status: 500 });
  }
}

// POST /api/profile/health - Update health metrics (Step 4)
async function updateHealthMetrics(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { height, weight, bodyFat, bloodGlucose } = body;

    const db = await getDb();
    const usersCollection = db.collection('users');
    const healthMetricsCollection = db.collection('healthMetrics');
    
    // Calculate BMI
    const heightInMeters = height / 100; // convert cm to meters
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);

    // Save health metrics to history
    await healthMetricsCollection.insertOne({
      userId: user.id,
      height,
      weight,
      bmi: parseFloat(bmi),
      bodyFat: bodyFat || null,
      bloodGlucose: bloodGlucose || null,
      recordedAt: new Date()
    });

    // Update user profile
    await usersCollection.updateOne(
      { email: user.email },
      { 
        $set: { 
          height,
          weight,
          bmi: parseFloat(bmi),
          bodyFat,
          onboardingStep: 4,
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({ message: 'Health metrics updated', bmi });
  } catch (error) {
    console.error('Update health metrics error:', error);
    return NextResponse.json({ error: 'Failed to update health metrics' }, { status: 500 });
  }
}

// POST /api/profile/preferences - Update activity preferences (Step 5)
async function updateActivityPreferences(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { activities, preferredDays, preferredTimes, searchRadius, location, lookingFor } = body;

    const db = await getDb();
    const usersCollection = db.collection('users');
    
    await usersCollection.updateOne(
      { email: user.email },
      { 
        $set: { 
          activities,
          preferredDays,
          preferredTimes,
          searchRadius,
          location,
          lookingFor,
          onboardingComplete: true,
          onboardingStep: 5,
          updatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({ message: 'Activity preferences updated, onboarding complete!' });
  } catch (error) {
    console.error('Update activity preferences error:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}

// ========== MATCHING ROUTES ==========

// GET /api/matches - Get compatible workout partners
async function getMatches(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activityFilter = searchParams.get('activity');
    const lookingForFilter = searchParams.get('lookingFor');

    const db = await getDb();
    const usersCollection = db.collection('users');
    
    // Get current user's profile
    const currentUser = await usersCollection.findOne(
      { email: user.email },
      { projection: { password: 0 } }
    );

    if (!currentUser || !currentUser.onboardingComplete) {
      return NextResponse.json({ error: 'Complete onboarding first' }, { status: 400 });
    }

    // Build query
    const query = {
      email: { $ne: user.email },
      onboardingComplete: true
    };

    if (activityFilter) {
      query.activities = activityFilter;
    }

    if (lookingForFilter) {
      query.lookingFor = lookingForFilter;
    }

    // Get potential matches
    const potentialMatches = await usersCollection
      .find(query, { projection: { password: 0 } })
      .limit(50)
      .toArray();

    // Calculate compatibility scores
    const matches = potentialMatches.map(match => {
      let score = 0;

      // Activity overlap (40 points)
      const commonActivities = (currentUser.activities || []).filter(a => 
        (match.activities || []).includes(a)
      );
      score += (commonActivities.length / Math.max((currentUser.activities || []).length, 1)) * 40;

      // Fitness level proximity (30 points)
      if (currentUser.fitnessLevel && match.fitnessLevel) {
        const levelDiff = Math.abs(currentUser.fitnessLevel - match.fitnessLevel);
        if (levelDiff <= 2) {
          score += 30 - (levelDiff * 10);
        }
      }

      // Schedule alignment (20 points)
      const commonDays = (currentUser.preferredDays || []).filter(d => 
        (match.preferredDays || []).includes(d)
      );
      score += (commonDays.length / 7) * 20;

      // Goal alignment (10 points)
      const commonGoals = (currentUser.goals || []).filter(g => 
        (match.goals || []).includes(g)
      );
      score += (commonGoals.length / Math.max((currentUser.goals || []).length, 1)) * 10;

      return {
        ...match,
        compatibilityScore: Math.round(score),
        commonActivities,
        distance: Math.floor(Math.random() * 20) + 1 // Mock distance for now — needs real per-user geo coords
      };
    });

    // Sort by compatibility score
    matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    // Attach real trust signals (average rating + review count) — this is
    // the actual reviews collection, not invented numbers. New users with
    // no reviews yet correctly show as unrated rather than getting a fake
    // "5.0" stamped on them.
    const reviewsCollection = db.collection('reviews');
    const matchIds = matches.map(m => m.id).filter(Boolean);
    const ratingAggregates = matchIds.length
      ? await reviewsCollection.aggregate([
          { $match: { targetId: { $in: matchIds }, targetType: 'user' } },
          { $group: { _id: '$targetId', avgRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }
        ]).toArray()
      : [];
    const ratingsById = new Map(ratingAggregates.map(r => [r._id, r]));

    const matchesWithTrust = matches.map(m => {
      const rating = ratingsById.get(m.id);
      return {
        ...m,
        avgRating: rating ? Math.round(rating.avgRating * 10) / 10 : null,
        reviewCount: rating ? rating.reviewCount : 0
      };
    });

    return NextResponse.json({ matches: matchesWithTrust });
  } catch (error) {
    console.error('Get matches error:', error);
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

// ========== SESSION ROUTES ==========

// POST /api/sessions - Create new session
async function createSession(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { activityType, mode, location, startTime, duration, notes, isPublic, invitedUsers } = body;

    const db = await getDb();
    const sessionsCollection = db.collection('sessions');
    const sessionId = uuidv4();

    const session = {
      id: sessionId,
      creatorId: user.id,
      activityType,
      mode,
      location,
      startTime: new Date(startTime),
      duration,
      notes,
      isPublic,
      status: 'pending',
      participants: [
        {
          userId: user.id,
          status: 'confirmed',
          joinedAt: new Date()
        }
      ],
      createdAt: new Date()
    };

    await sessionsCollection.insertOne(session);

    // Create notifications for invited users
    if (invitedUsers && invitedUsers.length > 0) {
      const notificationsCollection = db.collection('notifications');
      const notifications = invitedUsers.map(userId => ({
        id: uuidv4(),
        userId,
        type: 'session_invite',
        sessionId,
        message: `You've been invited to a ${activityType} session`,
        read: false,
        createdAt: new Date()
      }));
      await notificationsCollection.insertMany(notifications);
    }

    return NextResponse.json({ message: 'Session created', sessionId, session }, { status: 201 });
  } catch (error) {
    console.error('Create session error:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

// GET /api/sessions - Get user's sessions
async function getSessions(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // upcoming, past, all

    const db = await getDb();
    const sessionsCollection = db.collection('sessions');
    const usersCollection = db.collection('users');

    let query = {
      $or: [
        { creatorId: user.id },
        { 'participants.userId': user.id }
      ]
    };

    const now = new Date();
    if (filter === 'upcoming') {
      query.startTime = { $gte: now };
    } else if (filter === 'past') {
      query.startTime = { $lt: now };
    }

    const sessions = await sessionsCollection
      .find(query)
      .sort({ startTime: -1 })
      .limit(50)
      .toArray();

    // Enrich with user data
    const enrichedSessions = await Promise.all(
      sessions.map(async (session) => {
        const creator = await usersCollection.findOne(
          { id: session.creatorId },
          { projection: { name: 1, profilePhoto: 1 } }
        );

        const participants = await Promise.all(
          (session.participants || []).map(async (p) => {
            const participant = await usersCollection.findOne(
              { id: p.userId },
              { projection: { name: 1, profilePhoto: 1 } }
            );
            return {
              ...p,
              user: participant
            };
          })
        );

        return {
          ...session,
          creator,
          participants
        };
      })
    );

    return NextResponse.json({ sessions: enrichedSessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// GET /api/sessions/[id] - Get specific session
async function getSessionById(request, id) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const sessionsCollection = db.collection('sessions');
    const usersCollection = db.collection('users');

    const session = await sessionsCollection.findOne({ id });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Enrich with user data
    const creator = await usersCollection.findOne(
      { id: session.creatorId },
      { projection: { name: 1, profilePhoto: 1, email: 1 } }
    );

    const participants = await Promise.all(
      (session.participants || []).map(async (p) => {
        const participant = await usersCollection.findOne(
          { id: p.userId },
          { projection: { name: 1, profilePhoto: 1, email: 1 } }
        );
        return {
          ...p,
          user: participant
        };
      })
    );

    return NextResponse.json({
      session: {
        ...session,
        creator,
        participants
      }
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

// POST /api/sessions/[id]/join - Join a session
async function joinSession(request, id) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const sessionsCollection = db.collection('sessions');

    const session = await sessionsCollection.findOne({ id });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if already a participant
    const existingParticipant = (session.participants || []).find(p => p.userId === user.id);
    if (existingParticipant) {
      return NextResponse.json({ error: 'Already in session' }, { status: 400 });
    }

    // Add participant
    await sessionsCollection.updateOne(
      { id },
      {
        $push: {
          participants: {
            userId: user.id,
            status: 'confirmed',
            joinedAt: new Date()
          }
        }
      }
    );

    // Create notification for creator
    const notificationsCollection = db.collection('notifications');
    await notificationsCollection.insertOne({
      id: uuidv4(),
      userId: session.creatorId,
      type: 'session_joined',
      sessionId: id,
      message: `Someone joined your ${session.activityType} session`,
      read: false,
      createdAt: new Date()
    });

    return NextResponse.json({ message: 'Joined session successfully' });
  } catch (error) {
    console.error('Join session error:', error);
    return NextResponse.json({ error: 'Failed to join session' }, { status: 500 });
  }
}

// POST /api/sessions/[id]/complete - Mark session as complete
async function completeSession(request, id) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const sessionsCollection = db.collection('sessions');

    await sessionsCollection.updateOne(
      { id, creatorId: user.id },
      { $set: { status: 'completed', completedAt: new Date() } }
    );

    return NextResponse.json({ message: 'Session marked as complete' });
  } catch (error) {
    console.error('Complete session error:', error);
    return NextResponse.json({ error: 'Failed to complete session' }, { status: 500 });
  }
}

// ========== AI WORKOUT GENERATOR ==========

// POST /api/ai/generate-workout - Generate AI workout plan
async function generateWorkout(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fitnessLevel, goals, activityType, duration } = body;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are an expert fitness coach creating personalized workout plans. 
Generate a detailed, safe, and effective workout plan in JSON format with the following structure:
{
  "title": "Workout Plan Title",
  "description": "Brief description",
  "warmup": [
    {
      "exercise": "Exercise Name",
      "duration": "5 minutes",
      "instructions": "How to perform"
    }
  ],
  "workout": [
    {
      "exercise": "Exercise Name",
      "sets": 3,
      "reps": 12,
      "rest": "60 seconds",
      "instructions": "Detailed form instructions"
    }
  ],
  "cooldown": [
    {
      "exercise": "Cooldown Exercise",
      "duration": "5 minutes",
      "instructions": "How to perform"
    }
  ],
  "nutrition": {
    "preworkout": "Pre-workout meal suggestion",
    "postworkout": "Post-workout meal suggestion",
    "hydration": "Hydration goals"
  },
  "recovery": {
    "stretches": ["Stretch 1", "Stretch 2"],
    "tips": ["Recovery tip 1", "Recovery tip 2"]
  },
  "totalDuration": 45
}`;

    const userPrompt = `Create a ${duration} minute ${activityType} workout plan for:
Fitness Level: ${fitnessLevel}/10
Goals: ${goals.join(', ')}

The plan should be safe, effective, and achievable for this fitness level.`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },

      temperature: 0.7,
      max_tokens: 2000,
    });

    const workoutPlan = JSON.parse(response.choices[0].message.content);

    // Save generated workout
    const db = await getDb();
    const workoutsCollection = db.collection('workouts');
    await workoutsCollection.insertOne({
      id: uuidv4(),
      userId: user.id,
      ...workoutPlan,
      createdAt: new Date()
    });

    return NextResponse.json({ workoutPlan });
  } catch (error) {
    console.error('Workout generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate workout plan' },
      { status: 500 }
    );
  }
}

// ========== FEED ROUTES ==========

// GET /api/feed - Get social feed
async function getFeed(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const feedCollection = db.collection('feedPosts');
    const usersCollection = db.collection('users');

    const posts = await feedCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // Enrich with user data
    const enrichedPosts = await Promise.all(
      posts.map(async (post) => {
        const author = await usersCollection.findOne(
          { id: post.userId },
          { projection: { name: 1, profilePhoto: 1 } }
        );
        return {
          ...post,
          author
        };
      })
    );

    return NextResponse.json({ posts: enrichedPosts });
  } catch (error) {
    console.error('Get feed error:', error);
    return NextResponse.json({ error: 'Failed to fetch feed' }, { status: 500 });
  }
}

// POST /api/feed - Create feed post
async function createFeedPost(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contentType, content, mediaUrls } = body;

    const db = await getDb();
    const feedCollection = db.collection('feedPosts');
    const postId = uuidv4();

    const post = {
      id: postId,
      userId: user.id,
      contentType,
      content,
      mediaUrls: mediaUrls || [],
      likes: [],
      comments: [],
      createdAt: new Date()
    };

    await feedCollection.insertOne(post);

    return NextResponse.json({ message: 'Post created', postId, post }, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}

// POST /api/feed/[id]/like - Like a post
async function likePost(request, id) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const feedCollection = db.collection('feedPosts');

    const post = await feedCollection.findOne({ id });
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Toggle like
    const hasLiked = (post.likes || []).includes(user.id);
    if (hasLiked) {
      await feedCollection.updateOne(
        { id },
        { $pull: { likes: user.id } }
      );
    } else {
      await feedCollection.updateOne(
        { id },
        { $push: { likes: user.id } }
      );
    }

    return NextResponse.json({ message: hasLiked ? 'Unliked' : 'Liked' });
  } catch (error) {
    console.error('Like post error:', error);
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}

// POST /api/feed/[id]/comment - Comment on a post
async function commentOnPost(request, id) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { comment } = body;

    const db = await getDb();
    const feedCollection = db.collection('feedPosts');

    await feedCollection.updateOne(
      { id },
      {
        $push: {
          comments: {
            id: uuidv4(),
            userId: user.id,
            comment,
            createdAt: new Date()
          }
        }
      }
    );

    return NextResponse.json({ message: 'Comment added' });
  } catch (error) {
    console.error('Comment error:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}

// ========== RATING ROUTES ==========

// POST /api/reviews - Create review
async function createReview(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { targetId, targetType, rating, categories, reviewText } = body;

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const db = await getDb();
    const reviewsCollection = db.collection('reviews');
    const reviewId = uuidv4();

    const review = {
      id: reviewId,
      reviewerId: user.id,
      targetId,
      targetType,
      rating,
      categories,
      reviewText,
      createdAt: new Date()
    };

    await reviewsCollection.insertOne(review);

    // Update target's average rating
    const allReviews = await reviewsCollection.find({ targetId, targetType }).toArray();
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    if (targetType === 'user') {
      const usersCollection = db.collection('users');
      await usersCollection.updateOne(
        { id: targetId },
        { $set: { averageRating: avgRating.toFixed(1) } }
      );
    }

    return NextResponse.json({ message: 'Review submitted', reviewId }, { status: 201 });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}

// GET /api/reviews/[targetId] - Get reviews for a target
async function getReviews(request, targetId) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('type') || 'user';

    const db = await getDb();
    const reviewsCollection = db.collection('reviews');
    const usersCollection = db.collection('users');

    const reviews = await reviewsCollection
      .find({ targetId, targetType })
      .sort({ createdAt: -1 })
      .toArray();

    // Enrich with reviewer data
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const reviewer = await usersCollection.findOne(
          { id: review.reviewerId },
          { projection: { name: 1, profilePhoto: 1 } }
        );
        return {
          ...review,
          reviewer
        };
      })
    );

    return NextResponse.json({ reviews: enrichedReviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// ========== NOTIFICATIONS ==========

// GET /api/notifications - Get user notifications
async function getNotifications(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const notificationsCollection = db.collection('notifications');

    const notifications = await notificationsCollection
      .find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST /api/notifications/[id]/read - Mark notification as read
async function markNotificationRead(request, id) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const notificationsCollection = db.collection('notifications');

    await notificationsCollection.updateOne(
      { id, userId: user.id },
      { $set: { read: true } }
    );

    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
}

// ========== EMERGENCY SOS ==========

// POST /api/emergency/sos - Trigger emergency SOS
async function triggerSOS(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { location, sessionId } = body;

    const db = await getDb();
    const emergencyCollection = db.collection('emergencies');

    const emergency = {
      id: uuidv4(),
      userId: user.id,
      location,
      sessionId,
      status: 'active',
      triggeredAt: new Date()
    };

    await emergencyCollection.insertOne(emergency);

    // In production, this would:
    // 1. Send SMS to emergency contacts
    // 2. Notify session participants
    // 3. Call emergency services API

    return NextResponse.json({ 
      message: 'Emergency SOS triggered', 
      emergency 
    }, { status: 201 });
  } catch (error) {
    console.error('SOS trigger error:', error);
    return NextResponse.json({ error: 'Failed to trigger SOS' }, { status: 500 });
  }
}

// ========== SUBSCRIPTION ROUTES (MOCK) ==========

// POST /api/subscriptions/upgrade - Upgrade subscription
async function upgradeSubscription(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tier } = body;

    // Mock Stripe integration
    const db = await getDb();
    const usersCollection = db.collection('users');

    await usersCollection.updateOne(
      { email: user.email },
      { 
        $set: { 
          subscriptionTier: tier,
          subscriptionStatus: 'active',
          subscriptionUpdatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({ 
      message: `Upgraded to ${tier} tier`,
      // In production: return Stripe checkout URL
      checkoutUrl: '/dashboard?upgraded=true'
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    return NextResponse.json({ error: 'Failed to upgrade subscription' }, { status: 500 });
  }
}

// ========== PROFILE MEDIA ENDPOINTS ==========

// POST /api/profile/media - Upload profile media (photos/videos)
async function uploadProfileMedia(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mediaUrl, mediaType, isPrivate = false, caption = '' } = body;

    if (!mediaUrl || !mediaType) {
      return NextResponse.json({ error: 'Media URL and type are required' }, { status: 400 });
    }

    const db = await getDb();
    const mediaCollection = db.collection('profile_media');

    const mediaItem = {
      id: uuidv4(),
      userId: user.id,
      mediaUrl,
      mediaType, // 'photo' or 'video'
      isPrivate,
      caption,
      createdAt: new Date(),
      likes: [],
      comments: []
    };

    await mediaCollection.insertOne(mediaItem);

    return NextResponse.json({ 
      message: 'Media uploaded successfully',
      media: mediaItem 
    });
  } catch (error) {
    console.error('Upload media error:', error);
    return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 });
  }
}

// GET /api/profile/media - Get user's profile media
async function getProfileMedia(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;
    const isOwnProfile = userId === user.id;

    const db = await getDb();
    const mediaCollection = db.collection('profile_media');

    // If viewing someone else's profile, only show public media
    const query = isOwnProfile 
      ? { userId } 
      : { userId, isPrivate: false };

    const media = await mediaCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ media });
  } catch (error) {
    console.error('Get media error:', error);
    return NextResponse.json({ error: 'Failed to get media' }, { status: 500 });
  }
}

// DELETE /api/profile/media/:id - Delete media
async function deleteProfileMedia(request, mediaId) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const mediaCollection = db.collection('profile_media');

    const result = await mediaCollection.deleteOne({ 
      id: mediaId, 
      userId: user.id 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Media not found or not authorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Delete media error:', error);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}

// POST /api/profile/status - Update user activity status
async function updateProfileStatus(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, activity } = body; // status: 'active', 'looking', 'busy', 'offline'

    const db = await getDb();
    const usersCollection = db.collection('users');

    await usersCollection.updateOne(
      { id: user.id },
      { 
        $set: { 
          activityStatus: status,
          currentActivity: activity,
          statusUpdatedAt: new Date()
        } 
      }
    );

    return NextResponse.json({ 
      message: 'Status updated',
      status,
      activity
    });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

// ========== CALENDAR/AVAILABILITY ENDPOINTS ==========

// POST /api/calendar/availability - Save user availability
async function saveAvailability(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { slots, isPublic = true } = body;
    // slots: [{ day: 'Monday', startTime: '09:00', endTime: '17:00', activity: 'Running' }]

    const db = await getDb();
    const availabilityCollection = db.collection('availability');

    // Upsert availability for this user
    await availabilityCollection.updateOne(
      { userId: user.id },
      { 
        $set: { 
          userId: user.id,
          slots,
          isPublic,
          updatedAt: new Date()
        } 
      },
      { upsert: true }
    );

    return NextResponse.json({ 
      message: 'Availability saved',
      slots,
      isPublic
    });
  } catch (error) {
    console.error('Save availability error:', error);
    return NextResponse.json({ error: 'Failed to save availability' }, { status: 500 });
  }
}

// GET /api/calendar/availability - Get user availability
async function getAvailability(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || user.id;
    const isOwnProfile = userId === user.id;

    const db = await getDb();
    const availabilityCollection = db.collection('availability');

    const availability = await availabilityCollection.findOne({ userId });

    // If viewing someone else's availability and it's private, return empty
    if (!isOwnProfile && availability && !availability.isPublic) {
      return NextResponse.json({ 
        availability: null,
        message: 'This user\'s availability is private'
      });
    }

    return NextResponse.json({ 
      availability: availability || { slots: [], isPublic: true }
    });
  } catch (error) {
    console.error('Get availability error:', error);
    return NextResponse.json({ error: 'Failed to get availability' }, { status: 500 });
  }
}

// ========== ACTIVITIES ENDPOINTS ==========

// POST /api/activities - Create/save an activity card
async function createActivity(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, 
      activityType, 
      date, 
      time, 
      location,
      checklist = [],
      notes = '',
      isPublic = true,
      includInBroadcast = false
    } = body;

    const db = await getDb();
    const activitiesCollection = db.collection('activities');

    const activity = {
      id: uuidv4(),
      userId: user.id,
      title,
      activityType,
      date,
      time,
      location,
      checklist, // [{ item: 'Bring water', completed: false }]
      notes,
      isPublic,
      includInBroadcast,
      status: 'planned', // planned, in_progress, completed, cancelled
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await activitiesCollection.insertOne(activity);

    return NextResponse.json({ 
      message: 'Activity created',
      activity 
    });
  } catch (error) {
    console.error('Create activity error:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}

// GET /api/activities - Get user's activities
async function getActivities(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // filter by status
    const upcoming = searchParams.get('upcoming') === 'true';

    const db = await getDb();
    const activitiesCollection = db.collection('activities');

    let query = { userId: user.id };
    
    if (status) {
      query.status = status;
    }
    
    if (upcoming) {
      query.date = { $gte: new Date().toISOString().split('T')[0] };
    }

    const activities = await activitiesCollection
      .find(query)
      .sort({ date: 1, time: 1 })
      .toArray();

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Get activities error:', error);
    return NextResponse.json({ error: 'Failed to get activities' }, { status: 500 });
  }
}

// PUT /api/activities/:id - Update an activity
async function updateActivity(request, activityId) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, activityType, date, time, location, checklist, notes, isPublic, includInBroadcast, status } = body;

    const db = await getDb();
    const activitiesCollection = db.collection('activities');

    const updateData = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (activityType !== undefined) updateData.activityType = activityType;
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (location !== undefined) updateData.location = location;
    if (checklist !== undefined) updateData.checklist = checklist;
    if (notes !== undefined) updateData.notes = notes;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (includInBroadcast !== undefined) updateData.includInBroadcast = includInBroadcast;
    if (status !== undefined) updateData.status = status;

    const result = await activitiesCollection.updateOne(
      { id: activityId, userId: user.id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Activity updated' });
  } catch (error) {
    console.error('Update activity error:', error);
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
  }
}

// DELETE /api/activities/:id - Delete an activity
async function deleteActivity(request, activityId) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const activitiesCollection = db.collection('activities');

    const result = await activitiesCollection.deleteOne({ 
      id: activityId, 
      userId: user.id 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Activity deleted' });
  } catch (error) {
    console.error('Delete activity error:', error);
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 });
  }
}

// ========== BROADCAST ENDPOINTS ==========

// POST /api/broadcast - Create a broadcast to find companions
// ========== GEO HELPERS ==========
// Real distance in miles between two lat/lng points — replaces the
// Math.random() jitter that used to fake every "X mi away" label.
function haversineDistanceMiles(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some(v => typeof v !== 'number' || Number.isNaN(v))) {
    return null;
  }
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Finds OTHER users who currently have an active, unexpired broadcast within
// radiusMiles of (lat, lng) — real geolocation-based matching. If nobody is
// actually broadcasting nearby, this returns an empty list; the UI shows an
// honest "no one nearby right now" state rather than inventing people.
async function findNearbyBroadcasters(db, excludeUserId, lat, lng, radiusMiles, activity) {
  if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) {
    return [];
  }

  const broadcastsCollection = db.collection('broadcasts');
  const usersCollection = db.collection('users');
  const reviewsCollection = db.collection('reviews');

  const query = {
    userId: { $ne: excludeUserId },
    status: 'active',
    expiresAt: { $gt: new Date() },
    'location.lat': { $type: 'number' },
    'location.lng': { $type: 'number' }
  };
  if (activity) query.activity = activity;

  const broadcasts = await broadcastsCollection
    .find(query)
    .sort({ createdAt: -1 })
    .limit(200)
    .toArray();

  // Only the most recent active broadcast per user counts.
  const latestByUser = new Map();
  for (const b of broadcasts) {
    if (!latestByUser.has(b.userId)) latestByUser.set(b.userId, b);
  }

  const radius = typeof radiusMiles === 'number' && !Number.isNaN(radiusMiles) ? radiusMiles : 5;
  const withDistance = [...latestByUser.values()]
    .map(b => ({ broadcast: b, distance: haversineDistanceMiles(lat, lng, b.location.lat, b.location.lng) }))
    .filter(x => x.distance !== null && x.distance <= radius)
    .sort((a, b) => a.distance - b.distance);

  if (withDistance.length === 0) return [];

  const userIds = withDistance.map(x => x.broadcast.userId);
  const users = await usersCollection
    .find({ id: { $in: userIds } }, { projection: { password: 0 } })
    .toArray();
  const usersById = new Map(users.map(u => [u.id, u]));

  const ratingAggregates = userIds.length
    ? await reviewsCollection.aggregate([
        { $match: { targetId: { $in: userIds }, targetType: 'user' } },
        { $group: { _id: '$targetId', avgRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }
      ]).toArray()
    : [];
  const ratingsById = new Map(ratingAggregates.map(r => [r._id, r]));

  return withDistance
    .map(({ broadcast, distance }) => {
      const u = usersById.get(broadcast.userId);
      if (!u) return null;
      const rating = ratingsById.get(u.id);
      return {
        id: u.id,
        name: u.name,
        profilePhoto: u.profilePhoto,
        activities: u.activities,
        location: broadcast.location, // real coordinates the broadcaster shared, for the map marker
        activity: broadcast.activity,
        distance: Math.round(distance * 10) / 10,
        connectionType: broadcast.connectionType || null,
        avgRating: rating ? Math.round(rating.avgRating * 10) / 10 : null,
        reviewCount: rating ? rating.reviewCount : 0
      };
    })
    .filter(Boolean);
}

async function createBroadcast(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      category, // 'athletic' or 'non-athletic'
      activity,
      connectionType, // 'buddy', 'trainer', 'competitor', 'group', 'accessible'
      radius,
      location, // { lat, lng } — the broadcaster's real current position
      filters = {},
      message = ''
    } = body;

    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return NextResponse.json({ error: 'A real device location is required to broadcast' }, { status: 400 });
    }

    const db = await getDb();
    const broadcastsCollection = db.collection('broadcasts');

    const broadcast = {
      id: uuidv4(),
      userId: user.id,
      userName: user.name,
      category,
      activity,
      connectionType,
      radius,
      location,
      filters,
      message,
      status: 'active',
      responses: [],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour — matches how long someone is realistically "out and available"
    };

    await broadcastsCollection.insertOne(broadcast);

    // Real nearby matching: only people who are ALSO currently broadcasting,
    // within actual distance of the caller's real coordinates. No fabricated
    // "matches" — an empty result here is an honest empty result.
    const matches = await findNearbyBroadcasters(db, user.id, location.lat, location.lng, radius, activity);

    return NextResponse.json({
      message: 'Broadcast created',
      broadcast,
      matchesFound: matches.length,
      matches
    });
  } catch (error) {
    console.error('Create broadcast error:', error);
    return NextResponse.json({ error: 'Failed to create broadcast' }, { status: 500 });
  }
}

// GET /api/broadcasts/nearby - live preview count/list used while the user is
// still adjusting radius/activity, before they've committed to broadcasting.
async function getNearbyPreview(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    const radius = parseFloat(searchParams.get('radius')) || 5;
    const activity = searchParams.get('activity') || undefined;

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json({ matches: [] });
    }

    const db = await getDb();
    const matches = await findNearbyBroadcasters(db, user.id, lat, lng, radius, activity);
    return NextResponse.json({ matches });
  } catch (error) {
    console.error('Get nearby preview error:', error);
    return NextResponse.json({ error: 'Failed to load nearby users' }, { status: 500 });
  }
}

// GET /api/broadcasts - Get active broadcasts
async function getBroadcasts(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activity = searchParams.get('activity');

    const db = await getDb();
    const broadcastsCollection = db.collection('broadcasts');

    let query = { 
      status: 'active',
      expiresAt: { $gt: new Date() }
    };

    if (category) query.category = category;
    if (activity) query.activity = activity;

    const broadcasts = await broadcastsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ broadcasts });
  } catch (error) {
    console.error('Get broadcasts error:', error);
    return NextResponse.json({ error: 'Failed to get broadcasts' }, { status: 500 });
  }
}

// POST /api/broadcasts/:id/respond - Respond to a broadcast
async function respondToBroadcast(request, broadcastId) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message = '' } = body;

    const db = await getDb();
    const broadcastsCollection = db.collection('broadcasts');

    const response = {
      userId: user.id,
      userName: user.name,
      message,
      respondedAt: new Date()
    };

    await broadcastsCollection.updateOne(
      { id: broadcastId },
      { $push: { responses: response } }
    );

    // Create notification for broadcast owner
    const broadcast = await broadcastsCollection.findOne({ id: broadcastId });
    if (broadcast) {
      const notificationsCollection = db.collection('notifications');
      await notificationsCollection.insertOne({
        id: uuidv4(),
        userId: broadcast.userId,
        type: 'broadcast_response',
        title: 'New Response to Your Broadcast',
        message: `${user.name} responded to your ${broadcast.activity} broadcast`,
        data: { broadcastId, responderId: user.id },
        read: false,
        createdAt: new Date()
      });
    }

    return NextResponse.json({ 
      message: 'Response sent',
      response 
    });
  } catch (error) {
    console.error('Respond to broadcast error:', error);
    return NextResponse.json({ error: 'Failed to respond to broadcast' }, { status: 500 });
  }
}

// ========== MESSAGING ROUTES ==========
// Real per-user message persistence, replacing the frontend mock chat data.

// GET /api/messages/:otherUserId - full thread between the current user and one other user
async function getMessageThread(request, otherUserId) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const messagesCollection = db.collection('messages');

    const thread = await messagesCollection
      .find({
        $or: [
          { senderId: user.id, recipientId: otherUserId },
          { senderId: otherUserId, recipientId: user.id }
        ]
      })
      .sort({ createdAt: 1 })
      .toArray();

    // Mark messages sent to me as read now that I've opened the thread
    await messagesCollection.updateMany(
      { senderId: otherUserId, recipientId: user.id, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({
      messages: thread.map(m => ({
        id: m.id,
        senderId: m.senderId,
        recipientId: m.recipientId,
        text: m.text,
        createdAt: m.createdAt,
        read: m.read
      }))
    });
  } catch (error) {
    console.error('Get message thread error:', error);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}

// POST /api/messages - send a message to another user
async function sendMessage(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipientId, text } = body;

    if (!recipientId || !text || !text.trim()) {
      return NextResponse.json({ error: 'recipientId and text are required' }, { status: 400 });
    }

    const db = await getDb();
    const messagesCollection = db.collection('messages');

    const message = {
      id: uuidv4(),
      senderId: user.id,
      recipientId,
      text: text.trim().slice(0, 2000),
      read: false,
      createdAt: new Date()
    };

    await messagesCollection.insertOne(message);

    const notificationsCollection = db.collection('notifications');
    await notificationsCollection.insertOne({
      id: uuidv4(),
      userId: recipientId,
      type: 'new_message',
      title: 'New message',
      message: `${user.name} sent you a message`,
      data: { senderId: user.id },
      read: false,
      createdAt: new Date()
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

// GET /api/conversations - one row per person the current user has an actual
// message thread with, each carrying the real last message/time/unread count.
// This is what the Messages list should render instead of matches dressed up
// with invented preview text.
async function getConversations(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const messagesCollection = db.collection('messages');
    const usersCollection = db.collection('users');

    const myMessages = await messagesCollection
      .find({ $or: [{ senderId: user.id }, { recipientId: user.id }] })
      .sort({ createdAt: -1 })
      .toArray();

    const byPartner = new Map();
    for (const m of myMessages) {
      const partnerId = m.senderId === user.id ? m.recipientId : m.senderId;
      if (!byPartner.has(partnerId)) {
        byPartner.set(partnerId, {
          partnerId,
          lastMessage: m.text,
          lastMessageTime: m.createdAt,
          unreadCount: 0
        });
      }
      const entry = byPartner.get(partnerId);
      if (m.recipientId === user.id && !m.read) {
        entry.unreadCount += 1;
      }
    }

    const partnerIds = Array.from(byPartner.keys());
    const partners = partnerIds.length
      ? await usersCollection
          .find({ id: { $in: partnerIds } }, { projection: { password: 0 } })
          .toArray()
      : [];
    const partnersById = new Map(partners.map(p => [p.id, p]));

    const conversations = partnerIds
      .map(id => {
        const entry = byPartner.get(id);
        const partner = partnersById.get(id);
        if (!partner) return null;
        return {
          id: partner.id,
          name: partner.name,
          profilePhoto: partner.profilePhoto || null,
          lastMessage: entry.lastMessage,
          lastMessageTime: entry.lastMessageTime,
          unread: entry.unreadCount > 0,
          unreadCount: entry.unreadCount
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
  }
}

// ========== RADAR BOOSTS (monetization) ==========
// Credits are a simple in-app currency: every account starts with 3 free
// ones (see registerUser). Spending them activates a temporary boost.
// There is no real payment processing wired up yet — "buying" more credits
// needs a Stripe (or similar) account connected before it can charge a real
// card, so the frontend intentionally does not claim to sell anything yet.

const BOOST_DURATION_MS = 60 * 60 * 1000; // 1 hour
const BOOST_TYPES = {
  radius: { label: 'Radius Boost', radiusMultiplier: 2, priorityPlacement: false },
  priority: { label: 'Priority Placement', radiusMultiplier: 1, priorityPlacement: true }
};

// GET /api/boosts - current credit balance + any active boost
async function getBoostStatus(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const usersCollection = db.collection('users');
    const boostsCollection = db.collection('boosts');

    const dbUser = await usersCollection.findOne({ id: user.id }, { projection: { radarCredits: 1 } });
    const credits = dbUser?.radarCredits ?? 3;

    const activeBoost = await boostsCollection.findOne({
      userId: user.id,
      expiresAt: { $gt: new Date() }
    });

    return NextResponse.json({
      credits,
      activeBoost: activeBoost ? {
        type: activeBoost.type,
        label: BOOST_TYPES[activeBoost.type]?.label,
        radiusMultiplier: activeBoost.radiusMultiplier,
        priorityPlacement: activeBoost.priorityPlacement,
        expiresAt: activeBoost.expiresAt
      } : null
    });
  } catch (error) {
    console.error('Get boost status error:', error);
    return NextResponse.json({ error: 'Failed to load boost status' }, { status: 500 });
  }
}

// POST /api/boosts/activate - spend 1 credit to activate a boost for BOOST_DURATION_MS
async function activateBoost(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const type = BOOST_TYPES[body?.type] ? body.type : 'radius';
    const config = BOOST_TYPES[type];

    const db = await getDb();
    const usersCollection = db.collection('users');
    const boostsCollection = db.collection('boosts');

    // Backfill accounts created before radarCredits existed, so the credit
    // count they see on GET /api/boosts (which defaults to 3) matches what
    // they can actually spend here.
    await usersCollection.updateOne(
      { id: user.id, radarCredits: { $exists: false } },
      { $set: { radarCredits: 3 } }
    );

    // Atomically decrement — only succeeds if the user actually has a credit
    // to spend, which avoids a race where two rapid clicks both succeed.
    // Note: mongodb driver v6 returns the document directly here (not the
    // older {value: doc} wrapper) since includeResultMetadata defaults false.
    const decremented = await usersCollection.findOneAndUpdate(
      { id: user.id, radarCredits: { $gt: 0 } },
      { $inc: { radarCredits: -1 } },
      { returnDocument: 'after' }
    );

    if (!decremented) {
      return NextResponse.json({ error: 'No Radar Boost credits remaining' }, { status: 402 });
    }

    const expiresAt = new Date(Date.now() + BOOST_DURATION_MS);
    const boost = {
      id: uuidv4(),
      userId: user.id,
      type,
      radiusMultiplier: config.radiusMultiplier,
      priorityPlacement: config.priorityPlacement,
      createdAt: new Date(),
      expiresAt
    };
    await boostsCollection.insertOne(boost);

    return NextResponse.json({
      credits: decremented.radarCredits,
      activeBoost: {
        type,
        label: config.label,
        radiusMultiplier: config.radiusMultiplier,
        priorityPlacement: config.priorityPlacement,
        expiresAt
      }
    });
  } catch (error) {
    console.error('Activate boost error:', error);
    return NextResponse.json({ error: 'Failed to activate boost' }, { status: 500 });
  }
}

// ========== ROUTE HANDLER ==========

export async function GET(request, { params }) {
  const path = params?.path?.join('/') || '';

  // Route matching
  if (path === 'session') {
    return getSessionData(request);
  } else if (path === 'profile') {
    return getProfile(request);
  } else if (path === 'profile/media') {
    return getProfileMedia(request);
  } else if (path === 'matches') {
    return getMatches(request);
  } else if (path === 'sessions') {
    return getSessions(request);
  } else if (path.startsWith('sessions/') && path.endsWith('/reviews')) {
    const id = path.split('/')[1];
    return getReviews(request, id);
  } else if (path.startsWith('sessions/')) {
    const id = path.split('/')[1];
    return getSessionById(request, id);
  } else if (path === 'feed') {
    return getFeed(request);
  } else if (path.startsWith('reviews/')) {
    const targetId = path.split('/')[1];
    return getReviews(request, targetId);
  } else if (path === 'notifications') {
    return getNotifications(request);
  } else if (path === 'calendar/availability') {
    return getAvailability(request);
  } else if (path === 'activities') {
    return getActivities(request);
  } else if (path === 'broadcasts/nearby') {
    return getNearbyPreview(request);
  } else if (path === 'broadcasts') {
    return getBroadcasts(request);
  } else if (path === 'conversations') {
    return getConversations(request);
  } else if (path.startsWith('messages/')) {
    const otherUserId = path.split('/')[1];
    return getMessageThread(request, otherUserId);
  } else if (path === 'boosts') {
    return getBoostStatus(request);
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function POST(request, { params }) {
  const path = params?.path?.join('/') || '';

  // Route matching
  if (path === 'signin') {
    return simpleSignIn(request);
  } else if (path === 'signout') {
    return simpleSignOut(request);
  } else if (path === 'register') {
    return registerUser(request);
  } else if (path === 'profile/basic') {
    return updateBasicInfo(request);
  } else if (path === 'profile/fitness') {
    return updateFitnessIdentity(request);
  } else if (path === 'profile/health') {
    return updateHealthMetrics(request);
  } else if (path === 'profile/preferences') {
    return updateActivityPreferences(request);
  } else if (path === 'profile/media') {
    return uploadProfileMedia(request);
  } else if (path === 'profile/status') {
    return updateProfileStatus(request);
  } else if (path === 'calendar/availability') {
    return saveAvailability(request);
  } else if (path === 'activities') {
    return createActivity(request);
  } else if (path === 'broadcast') {
    return createBroadcast(request);
  } else if (path.startsWith('broadcasts/') && path.endsWith('/respond')) {
    const id = path.split('/')[1];
    return respondToBroadcast(request, id);
  } else if (path === 'sessions') {
    return createSession(request);
  } else if (path.startsWith('sessions/') && path.endsWith('/join')) {
    const id = path.split('/')[1];
    return joinSession(request, id);
  } else if (path.startsWith('sessions/') && path.endsWith('/complete')) {
    const id = path.split('/')[1];
    return completeSession(request, id);
  } else if (path === 'ai/generate-workout') {
    return generateWorkout(request);
  } else if (path === 'feed') {
    return createFeedPost(request);
  } else if (path.startsWith('feed/') && path.endsWith('/like')) {
    const id = path.split('/')[1];
    return likePost(request, id);
  } else if (path.startsWith('feed/') && path.endsWith('/comment')) {
    const id = path.split('/')[1];
    return commentOnPost(request, id);
  } else if (path === 'reviews') {
    return createReview(request);
  } else if (path.startsWith('notifications/') && path.endsWith('/read')) {
    const id = path.split('/')[1];
    return markNotificationRead(request, id);
  } else if (path === 'emergency/sos') {
    return triggerSOS(request);
  } else if (path === 'subscriptions/upgrade') {
    return upgradeSubscription(request);
  } else if (path === 'messages') {
    return sendMessage(request);
  } else if (path === 'boosts/activate') {
    return activateBoost(request);
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

export async function PUT(request, { params }) {
  const path = params?.path?.join('/') || '';
  
  // Route matching for PUT requests
  if (path.startsWith('activities/')) {
    const id = path.split('/')[1];
    return updateActivity(request, id);
  }
  
  // Fall back to POST for other routes (backward compatibility)
  return POST(request, { params });
}

export async function DELETE(request, { params }) {
  const path = params?.path?.join('/') || '';
  
  // Route matching for DELETE requests
  if (path.startsWith('profile/media/')) {
    const mediaId = path.split('/')[2];
    return deleteProfileMedia(request, mediaId);
  } else if (path.startsWith('activities/')) {
    const id = path.split('/')[1];
    return deleteActivity(request, id);
  }
  
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
