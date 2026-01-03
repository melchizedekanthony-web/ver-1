// Activity categories for workouts
export const ACTIVITY_CATEGORIES = [
  // Strength
  { id: 'weightlifting', name: 'Weightlifting', category: 'Strength' },
  { id: 'crossfit', name: 'CrossFit', category: 'Strength' },
  { id: 'strongman', name: 'Strongman', category: 'Strength' },
  { id: 'calisthenics', name: 'Calisthenics', category: 'Strength' },
  
  // Combat
  { id: 'mma', name: 'MMA', category: 'Combat' },
  { id: 'boxing', name: 'Boxing', category: 'Combat' },
  { id: 'kickboxing', name: 'Kickboxing', category: 'Combat' },
  { id: 'jiujitsu', name: 'Jiu-Jitsu', category: 'Combat' },
  
  // Cardio
  { id: 'running', name: 'Running', category: 'Cardio' },
  { id: 'cycling', name: 'Cycling', category: 'Cardio' },
  { id: 'swimming', name: 'Swimming', category: 'Cardio' },
  { id: 'rowing', name: 'Rowing', category: 'Cardio' },
  
  // Outdoor
  { id: 'hiking', name: 'Hiking', category: 'Outdoor' },
  { id: 'rockclimbing', name: 'Rock Climbing', category: 'Outdoor' },
  { id: 'kayaking', name: 'Kayaking', category: 'Outdoor' },
  { id: 'paddleboarding', name: 'Paddleboarding', category: 'Outdoor' },
  
  // Sports
  { id: 'tennis', name: 'Tennis', category: 'Sports' },
  { id: 'basketball', name: 'Basketball', category: 'Sports' },
  { id: 'soccer', name: 'Soccer', category: 'Sports' },
  { id: 'volleyball', name: 'Volleyball', category: 'Sports' },
  { id: 'baseball', name: 'Baseball', category: 'Sports' },
  { id: 'golf', name: 'Golf', category: 'Sports' },
  
  // Mind-Body
  { id: 'yoga', name: 'Yoga', category: 'Mind-Body' },
  { id: 'pilates', name: 'Pilates', category: 'Mind-Body' },
  { id: 'dance', name: 'Dance', category: 'Mind-Body' },
  { id: 'stretching', name: 'Stretching', category: 'Mind-Body' },
  
  // Specialty
  { id: 'triathlon', name: 'Triathlon', category: 'Specialty' },
  { id: 'marathon', name: 'Marathon Prep', category: 'Specialty' },
  { id: 'bootcamp', name: 'Bootcamp', category: 'Specialty' },
  { id: 'obstacleracing', name: 'Obstacle Racing', category: 'Specialty' },
];

// Fitness goals
export const FITNESS_GOALS = [
  { id: 'weightloss', name: 'Weight Loss' },
  { id: 'musclegain', name: 'Muscle Gain' },
  { id: 'endurance', name: 'Endurance' },
  { id: 'flexibility', name: 'Flexibility' },
  { id: 'competition', name: 'Competition Prep' },
  { id: 'general', name: 'General Fitness' },
];

// Session modes
export const SESSION_MODES = [
  { id: 'oneone', name: '1-on-1', min: 2, max: 2 },
  { id: 'small', name: 'Small Group', min: 3, max: 6 },
  { id: 'large', name: 'Large Group', min: 7, max: 20 },
];

// Looking for modes
export const LOOKING_FOR_MODES = [
  { id: 'buddy', name: 'Workout Buddy' },
  { id: 'trainer', name: 'Trainer' },
  { id: 'competitor', name: 'Competitor' },
  { id: 'open', name: 'Open to Anyone' },
];

// Subscription tiers
export const SUBSCRIPTION_TIERS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'Basic matching',
      '5 session requests/month',
      'Standard support',
    ],
  },
  {
    id: 'pro',
    name: 'FITTR Pro',
    price: 9.99,
    features: [
      'Unlimited sessions',
      'Advanced filters',
      'Priority matching',
      'Ad-free experience',
      'Session analytics',
    ],
  },
  {
    id: 'elite',
    name: 'FITTR Elite',
    price: 24.99,
    features: [
      'All Pro features',
      'AI workout generator (unlimited)',
      'Virtual coaching (2 sessions/month)',
      'Early access to features',
      '10% marketplace discount',
    ],
  },
];

// Days of week
export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

// Time slots
export const TIME_SLOTS = [
  '5:00 AM - 7:00 AM',
  '7:00 AM - 9:00 AM',
  '9:00 AM - 12:00 PM',
  '12:00 PM - 3:00 PM',
  '3:00 PM - 6:00 PM',
  '6:00 PM - 9:00 PM',
  '9:00 PM - 11:00 PM',
];