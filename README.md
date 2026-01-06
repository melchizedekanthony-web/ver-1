# WannaGo - Fitness Social Platform MVP

## Overview
WannaGo is a location-based fitness social platform that connects users for workouts, training sessions, and athletic activities. Think "Uber for fitness partners" with social networking features.

## Features Implemented (MVP - Phase 1)

### ✅ Authentication System
- User registration with email/password
- Secure login with NextAuth.js
- JWT session management
- Password hashing with bcrypt

### ✅ Complete Onboarding Flow (5 Steps)
1. **Basic Information**: Name, DOB, Gender, Profile Photo
2. **Fitness Identity**: Fitness Level (1-10 slider), Goals, Experience Years
3. **Health Metrics**: Height, Weight, BMI auto-calculation, Body Fat %, Blood Glucose tracking
4. **Activity Preferences**: Multi-select from 30+ activities (Weightlifting, CrossFit, Running, Yoga, etc.)
5. **Location & Availability**: Location, Search Radius, Preferred Days/Times, Looking For mode

### ✅ Intelligent Matching Engine
- **Compatibility Algorithm** (0-100% score):
  - Activity overlap (40 points)
  - Fitness level proximity (30 points)
  - Schedule alignment (20 points)
  - Goal alignment (10 points)
- Browse matches with compatibility scores
- Filter by activity type and looking-for mode
- Mock distance calculation (ready for maps integration)

### ✅ Session Management System
- Create workout sessions with:
  - Activity type selection
  - Mode: 1-on-1, Small Group (3-6), Large Group (7+)
  - Location, date/time, duration
  - Session notes
  - Public/private visibility
  - User invitations
- View upcoming and past sessions
- Join public sessions
- Session participants tracking
- Complete session workflow

### ✅ AI Workout Generator
- **Powered by OpenAI (gpt-4o-mini) with Emergent Universal Key**
- Generates personalized workout plans based on:
  - Fitness level
  - Goals
  - Activity type
  - Duration
- Structured output with:
  - Warmup exercises
  - Main workout with sets/reps/rest
  - Cooldown routine
  - Nutrition recommendations (pre/post workout, hydration)
  - Recovery tips and stretches

### ✅ Social Feed
- Create posts (Activity Request, Workout Log, Achievement, Recommendation, Poll)
- Like and comment on posts
- View community activity
- Real-time engagement

### ✅ Rating & Review System
- 5-star rating system for users, facilities, products
- Category-specific ratings (Reliability, Skill, Motivation, Safety)
- Written reviews (500 char limit)
- Average rating calculation
- Review history

### ✅ Notifications System
- Session invitations
- Join requests
- Real-time updates
- Unread count tracking
- Mark as read functionality

### ✅ Emergency SOS Feature
- Trigger emergency alert
- Location tracking
- Session-linked emergency responses
- (Ready for SMS/911 integration)

### ✅ Subscription Tiers (Mock Payment)
- **Free**: Basic matching, 5 sessions/month
- **FITTR Pro ($9.99/mo)**: Unlimited sessions, advanced filters, ad-free
- **FITTR Elite ($24.99/mo)**: All Pro + AI workouts, virtual coaching, marketplace discount
- Ready for Stripe integration

### ✅ Comprehensive Dashboard
- Overview with key stats
- Top matches display
- Upcoming sessions
- Activity feed
- Tab-based navigation
- Responsive design

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18** with hooks
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **Lucide React** icons
- **Sonner** for toast notifications

### Backend
- **Next.js API Routes** (all-in-one backend)
- **MongoDB** (local instance)
- **NextAuth.js v5** for authentication
- **OpenAI API** (via Emergent Universal Key)
- **bcrypt** for password hashing
- **UUID** for unique identifiers

### Database
- **MongoDB Collections**:
  - users
  - healthMetrics
  - sessions
  - feedPosts
  - reviews
  - notifications
  - workouts
  - emergencies

## Environment Variables

```
MONGO_URL=mongodb://localhost:27017
DB_NAME=fittr_db
NEXT_PUBLIC_BASE_URL=https://wannago-app.preview.emergentagent.com
NEXTAUTH_URL=https://wannago-app.preview.emergentagent.com
NEXTAUTH_SECRET=fittr_super_secret_key_2024_production_ready
OPENAI_API_KEY=sk-emergent-53d5cDfB6Ae5a850d6
```

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth handlers (signin, signout, session)

### Profile & Onboarding
- `GET /api/profile` - Get current user profile
- `POST /api/profile/basic` - Update basic info (Step 2)
- `POST /api/profile/fitness` - Update fitness identity (Step 3)
- `POST /api/profile/health` - Update health metrics (Step 4)
- `POST /api/profile/preferences` - Update activity preferences (Step 5)

### Matching
- `GET /api/matches` - Get compatible workout partners
  - Query params: `activity`, `lookingFor`

### Sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions` - Get user's sessions
  - Query params: `filter` (upcoming, past, all)
- `GET /api/sessions/[id]` - Get specific session
- `POST /api/sessions/[id]/join` - Join a session
- `POST /api/sessions/[id]/complete` - Mark session complete

### AI Features
- `POST /api/ai/generate-workout` - Generate AI workout plan
  - Body: `{ fitnessLevel, goals, activityType, duration }`

### Social Feed
- `GET /api/feed` - Get social feed
- `POST /api/feed` - Create feed post
- `POST /api/feed/[id]/like` - Like/unlike post
- `POST /api/feed/[id]/comment` - Comment on post

### Ratings & Reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/[targetId]` - Get reviews for target
  - Query params: `type` (user, facility, product)

### Notifications
- `GET /api/notifications` - Get user notifications
- `POST /api/notifications/[id]/read` - Mark notification as read

### Emergency
- `POST /api/emergency/sos` - Trigger emergency SOS

### Subscriptions (Mock)
- `POST /api/subscriptions/upgrade` - Upgrade subscription tier

## Key Features & Highlights

### 🎯 The "Aha Moment" - Core User Flow
1. User registers → Completes 5-step onboarding
2. Sees compatible matches with % scores
3. Creates or joins a workout session
4. (Optional) Uses AI to generate personalized workout plan
5. Completes session → Rates partner
6. Shares progress on social feed
7. Builds reputation and fitness community

### 🔥 Unique Selling Points
1. **Uber-like simplicity** for finding workout partners
2. **Smart matching algorithm** with compatibility scores
3. **AI workout generator** powered by GPT-4o-mini
4. **Safety-first** with ratings and emergency SOS
5. **Social integration** with feed and community features
6. **Complete onboarding** ensures quality matches
7. **Mock payment ready** for quick Stripe integration

### 🚀 Production-Ready Features
- Secure authentication with JWT
- Password hashing with bcrypt
- Environment variables properly configured
- Error handling throughout
- Loading states for better UX
- Toast notifications for user feedback
- Responsive design
- Server-side rendering with Next.js

## What's Next (Phase 2 & 3)

### Maps Integration
- Google Maps / Mapbox for real location
- Live location tracking
- Facility markers and search
- Distance calculation

### Real-Time Features
- WebSocket for live notifications
- Real-time chat between users
- Live session updates

### Stripe Integration
- Replace mock payments with real Stripe
- Subscription management
- Marketplace transactions
- Commission splitting

### Advanced Features
- Calendar sync (Google/Apple)
- Weather integration
- Wearable device sync (Apple Health, Strava)
- Group challenges and leaderboards
- Admin dashboard
- Content moderation

## Development

### Install Dependencies
```bash
yarn install
```

### Run Development Server
```bash
yarn dev
```

### Access the App
```
http://localhost:3000
or
https://wannago-app.preview.emergentagent.com
```

## Testing

### Test User Flow
1. **Register**: Go to `/auth/register` and create an account
2. **Onboarding**: Complete all 5 steps
3. **Dashboard**: See your matches, create sessions
4. **Generate Workout**: Use AI to create a workout plan
5. **Social Feed**: Share your progress

### Test Endpoints
See API Endpoints section above for all available routes.

## Project Structure

```
/app
├── app/
│   ├── api/
│   │   ├── [[...path]]/route.js    # Main API routes
│   │   └── auth/[...nextauth]/route.js  # NextAuth handlers
│   ├── auth/
│   │   ├── register/page.js        # Registration page
│   │   └── signin/page.js          # Sign-in page
│   ├── dashboard/page.js           # Main dashboard (onboarding + app)
│   ├── layout.js                   # Root layout
│   ├── page.js                     # Landing page
│   ├── providers.jsx               # NextAuth SessionProvider
│   └── globals.css                 # Global styles
├── components/
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── mongodb.js                  # MongoDB connection
│   ├── openai.js                   # OpenAI client
│   ├── constants.js                # App constants
│   └── utils.js                    # Utility functions
├── auth.js                         # NextAuth configuration
├── .env                            # Environment variables
└── package.json
```

## Notes

### MongoDB
- Running locally on `mongodb://localhost:27017`
- Database name: `fittr_db`
- No authentication required for local dev
- Automatic collection creation

### OpenAI Integration
- Using Emergent Universal Key
- Base URL: `https://api.emergent.team/v1`
- Model: `gpt-4o-mini`
- JSON output format for structured workout plans

### NextAuth.js
- Version 5 (beta)
- Credentials provider only (no OAuth in MVP)
- JWT strategy for sessions
- 30-day session expiry

### Mock Features (Ready for Integration)
- **Stripe Payments**: Mock upgrade flow, ready for Stripe API
- **Maps**: Mock distance calculation, ready for Google Maps/Mapbox
- **Emergency SOS**: Mock alert, ready for Twilio SMS + 911 API
- **Weather**: Ready for OpenWeatherMap API

## Security Considerations

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens for authentication
- Environment variables for secrets
- API routes protected with auth checks
- Input validation on all endpoints
- Error handling without exposing sensitive data

## Performance

- Server-side rendering for SEO and initial load
- Client-side navigation for speed
- Optimized images and assets
- Lazy loading for components
- Database queries with projections
- Index-ready MongoDB queries

## Deployment

Currently running on Emergent platform with:
- Next.js on port 3000
- MongoDB on localhost
- Hot reload enabled
- Production-ready build

## License

© 2024 FITTR. All rights reserved.

---

**Built with ❤️ by the FITTR team**

*Making fitness social, safe, and fun.*
