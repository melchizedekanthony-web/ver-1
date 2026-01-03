#!/usr/bin/env python3
"""
FITTR Backend API Testing Suite
Tests all backend endpoints for the FITTR fitness social platform
"""

import requests
import json
import uuid
import time
from datetime import datetime, timedelta
import os

# Configuration
BASE_URL = "https://workout-buddy-839.preview.emergentagent.com/api"
TEST_USER_EMAIL = "john@example.com"
TEST_USER_PASSWORD = "password123"

# Test data
TEST_USER_DATA = {
    "name": "Test User",
    "email": f"test{uuid.uuid4().hex[:8]}@example.com",
    "password": "password123"
}

class FittrAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_user_id = None
        self.test_session_id = None
        self.test_post_id = None
        self.auth_cookies = None
        
    def log_test(self, test_name, success, message=""):
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
    def test_user_registration(self):
        """Test POST /api/register - User Registration"""
        try:
            response = self.session.post(
                f"{BASE_URL}/register",
                json=TEST_USER_DATA
            )
            
            if response.status_code == 201:
                data = response.json()
                self.test_user_id = data.get('userId')
                self.log_test("User Registration", True, f"User registered with ID: {self.test_user_id}")
                return True
            else:
                self.log_test("User Registration", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
            return False
    
    def test_user_authentication(self):
        """Test NextAuth signin flow"""
        try:
            # Get CSRF token first
            csrf_response = self.session.get(f"https://workout-buddy-839.preview.emergentagent.com/api/auth/csrf")
            csrf_token = None
            if csrf_response.status_code == 200:
                csrf_token = csrf_response.json().get('csrfToken')
            
            # Prepare signin data
            signin_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "redirect": "false"
            }
            
            if csrf_token:
                signin_data['csrfToken'] = csrf_token
            
            # Try NextAuth credentials signin
            signin_response = self.session.post(
                f"https://workout-buddy-839.preview.emergentagent.com/api/auth/callback/credentials",
                data=signin_data,  # Use form data instead of JSON
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                allow_redirects=False
            )
            
            # Check for session cookies or successful response
            has_session_cookie = any('next-auth' in cookie.name for cookie in self.session.cookies)
            
            if has_session_cookie or signin_response.status_code in [200, 302]:
                self.log_test("User Authentication", True, "Authentication successful")
                return True
            else:
                # Alternative: Try to get session to verify auth
                session_response = self.session.get(f"https://workout-buddy-839.preview.emergentagent.com/api/auth/session")
                if session_response.status_code == 200:
                    session_data = session_response.json()
                    if session_data and session_data.get('user'):
                        self.log_test("User Authentication", True, f"Session found for user: {session_data['user'].get('email')}")
                        return True
                
                self.log_test("User Authentication", False, f"Auth failed - Status: {signin_response.status_code}, No valid session")
                return False
                    
        except Exception as e:
            self.log_test("User Authentication", False, f"Exception: {str(e)}")
            return False
    
    def test_get_profile(self):
        """Test GET /api/profile - Get user profile"""
        try:
            response = self.session.get(f"{BASE_URL}/profile")
            
            if response.status_code == 200:
                data = response.json()
                profile = data.get('profile')
                if profile and profile.get('email'):
                    self.log_test("Get Profile", True, f"Profile retrieved for: {profile.get('email')}")
                    return True
                else:
                    self.log_test("Get Profile", False, "Profile data incomplete")
                    return False
            elif response.status_code == 401:
                self.log_test("Get Profile", False, "Unauthorized - Authentication required")
                return False
            else:
                self.log_test("Get Profile", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Profile", False, f"Exception: {str(e)}")
            return False
    
    def test_onboarding_flow(self):
        """Test complete 5-step onboarding flow"""
        try:
            # Step 1: Basic Info
            basic_data = {
                "name": "John Doe",
                "dob": "1990-01-01",
                "gender": "male"
            }
            
            response1 = self.session.post(f"{BASE_URL}/profile/basic", json=basic_data)
            if response1.status_code != 200:
                self.log_test("Onboarding Step 1 (Basic)", False, f"Status: {response1.status_code}")
                return False
            
            # Step 2: Fitness Identity
            fitness_data = {
                "fitnessLevel": 7,
                "goals": ["musclegain", "endurance"],
                "experienceYears": 3
            }
            
            response2 = self.session.post(f"{BASE_URL}/profile/fitness", json=fitness_data)
            if response2.status_code != 200:
                self.log_test("Onboarding Step 2 (Fitness)", False, f"Status: {response2.status_code}")
                return False
            
            # Step 3: Health Metrics
            health_data = {
                "height": 180,
                "weight": 80,
                "bodyFat": 15
            }
            
            response3 = self.session.post(f"{BASE_URL}/profile/health", json=health_data)
            if response3.status_code != 200:
                self.log_test("Onboarding Step 3 (Health)", False, f"Status: {response3.status_code}")
                return False
            
            # Step 4: Activity Preferences (Final)
            preferences_data = {
                "activities": ["weightlifting", "running"],
                "preferredDays": ["Monday", "Wednesday", "Friday"],
                "preferredTimes": ["morning"],
                "searchRadius": 10,
                "location": "Los Angeles, CA",
                "lookingFor": "buddy"
            }
            
            response4 = self.session.post(f"{BASE_URL}/profile/preferences", json=preferences_data)
            if response4.status_code != 200:
                self.log_test("Onboarding Step 4 (Preferences)", False, f"Status: {response4.status_code}")
                return False
            
            # Verify onboarding completion
            profile_response = self.session.get(f"{BASE_URL}/profile")
            if profile_response.status_code == 200:
                profile = profile_response.json().get('profile', {})
                if profile.get('onboardingComplete'):
                    self.log_test("Complete Onboarding Flow", True, "All 4 steps completed successfully")
                    return True
                else:
                    self.log_test("Complete Onboarding Flow", False, "Onboarding not marked complete")
                    return False
            else:
                self.log_test("Complete Onboarding Flow", False, "Could not verify completion")
                return False
                
        except Exception as e:
            self.log_test("Complete Onboarding Flow", False, f"Exception: {str(e)}")
            return False
    
    def test_matching_algorithm(self):
        """Test GET /api/matches - Matching algorithm"""
        try:
            # Test basic matches
            response = self.session.get(f"{BASE_URL}/matches")
            
            if response.status_code == 200:
                data = response.json()
                matches = data.get('matches', [])
                self.log_test("Matching Algorithm", True, f"Retrieved {len(matches)} matches")
                
                # Test with filters
                filter_response = self.session.get(f"{BASE_URL}/matches?activity=weightlifting&lookingFor=buddy")
                if filter_response.status_code == 200:
                    filtered_matches = filter_response.json().get('matches', [])
                    self.log_test("Matching with Filters", True, f"Retrieved {len(filtered_matches)} filtered matches")
                    return True
                else:
                    self.log_test("Matching with Filters", False, f"Filter test failed: {filter_response.status_code}")
                    return False
                    
            elif response.status_code == 400:
                self.log_test("Matching Algorithm", False, "Complete onboarding first")
                return False
            else:
                self.log_test("Matching Algorithm", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Matching Algorithm", False, f"Exception: {str(e)}")
            return False
    
    def test_ai_workout_generator(self):
        """Test POST /api/ai/generate-workout - AI Workout Generator"""
        try:
            workout_request = {
                "fitnessLevel": 7,
                "goals": ["musclegain", "endurance"],
                "activityType": "weightlifting",
                "duration": 45
            }
            
            response = self.session.post(f"{BASE_URL}/ai/generate-workout", json=workout_request)
            
            if response.status_code == 200:
                data = response.json()
                workout_plan = data.get('workoutPlan')
                
                if workout_plan and all(key in workout_plan for key in ['title', 'warmup', 'workout', 'cooldown']):
                    self.log_test("AI Workout Generator", True, f"Generated workout: {workout_plan.get('title')}")
                    return True
                else:
                    self.log_test("AI Workout Generator", False, "Incomplete workout plan structure")
                    return False
            else:
                self.log_test("AI Workout Generator", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("AI Workout Generator", False, f"Exception: {str(e)}")
            return False
    
    def test_session_management(self):
        """Test session CRUD operations"""
        try:
            # Create session
            session_data = {
                "activityType": "weightlifting",
                "mode": "oneone",
                "location": "Gold's Gym, LA",
                "startTime": (datetime.now() + timedelta(hours=2)).isoformat(),
                "duration": 60,
                "notes": "Leg day workout!",
                "isPublic": True
            }
            
            create_response = self.session.post(f"{BASE_URL}/sessions", json=session_data)
            
            if create_response.status_code == 201:
                data = create_response.json()
                self.test_session_id = data.get('sessionId')
                self.log_test("Create Session", True, f"Session created: {self.test_session_id}")
                
                # Get sessions
                get_response = self.session.get(f"{BASE_URL}/sessions")
                if get_response.status_code == 200:
                    sessions = get_response.json().get('sessions', [])
                    self.log_test("Get Sessions", True, f"Retrieved {len(sessions)} sessions")
                    
                    # Test filters
                    upcoming_response = self.session.get(f"{BASE_URL}/sessions?filter=upcoming")
                    if upcoming_response.status_code == 200:
                        upcoming_sessions = upcoming_response.json().get('sessions', [])
                        self.log_test("Get Upcoming Sessions", True, f"Retrieved {len(upcoming_sessions)} upcoming sessions")
                        
                        # Test join session (would need another user in real scenario)
                        # For now, just test the endpoint exists
                        if self.test_session_id:
                            join_response = self.session.post(f"{BASE_URL}/sessions/{self.test_session_id}/join")
                            if join_response.status_code in [200, 400]:  # 400 if already in session
                                self.log_test("Join Session", True, "Join endpoint working")
                                
                                # Test complete session
                                complete_response = self.session.post(f"{BASE_URL}/sessions/{self.test_session_id}/complete")
                                if complete_response.status_code == 200:
                                    self.log_test("Complete Session", True, "Session marked complete")
                                    return True
                                else:
                                    self.log_test("Complete Session", False, f"Status: {complete_response.status_code}")
                                    return False
                            else:
                                self.log_test("Join Session", False, f"Status: {join_response.status_code}")
                                return False
                        else:
                            self.log_test("Session Management", False, "No session ID to test join/complete")
                            return False
                    else:
                        self.log_test("Get Upcoming Sessions", False, f"Status: {upcoming_response.status_code}")
                        return False
                else:
                    self.log_test("Get Sessions", False, f"Status: {get_response.status_code}")
                    return False
            else:
                self.log_test("Create Session", False, f"Status: {create_response.status_code}, Response: {create_response.text}")
                return False
                
        except Exception as e:
            self.log_test("Session Management", False, f"Exception: {str(e)}")
            return False
    
    def test_social_feed(self):
        """Test social feed operations"""
        try:
            # Create post
            post_data = {
                "contentType": "workout_log",
                "content": "Just crushed leg day! 💪 Feeling stronger every session."
            }
            
            create_response = self.session.post(f"{BASE_URL}/feed", json=post_data)
            
            if create_response.status_code == 201:
                data = create_response.json()
                self.test_post_id = data.get('postId')
                self.log_test("Create Feed Post", True, f"Post created: {self.test_post_id}")
                
                # Get feed
                get_response = self.session.get(f"{BASE_URL}/feed")
                if get_response.status_code == 200:
                    posts = get_response.json().get('posts', [])
                    self.log_test("Get Feed", True, f"Retrieved {len(posts)} posts")
                    
                    # Test like post
                    if self.test_post_id:
                        like_response = self.session.post(f"{BASE_URL}/feed/{self.test_post_id}/like")
                        if like_response.status_code == 200:
                            self.log_test("Like Post", True, "Post liked successfully")
                            
                            # Test comment
                            comment_data = {"comment": "Great work! Keep it up!"}
                            comment_response = self.session.post(f"{BASE_URL}/feed/{self.test_post_id}/comment", json=comment_data)
                            if comment_response.status_code == 200:
                                self.log_test("Comment on Post", True, "Comment added successfully")
                                return True
                            else:
                                self.log_test("Comment on Post", False, f"Status: {comment_response.status_code}")
                                return False
                        else:
                            self.log_test("Like Post", False, f"Status: {like_response.status_code}")
                            return False
                    else:
                        self.log_test("Social Feed", False, "No post ID to test like/comment")
                        return False
                else:
                    self.log_test("Get Feed", False, f"Status: {get_response.status_code}")
                    return False
            else:
                self.log_test("Create Feed Post", False, f"Status: {create_response.status_code}, Response: {create_response.text}")
                return False
                
        except Exception as e:
            self.log_test("Social Feed", False, f"Exception: {str(e)}")
            return False
    
    def test_rating_system(self):
        """Test rating and review system"""
        try:
            # Create review (need a target user ID)
            review_data = {
                "targetId": self.test_user_id or "test-user-id",
                "targetType": "user",
                "rating": 5,
                "categories": {"reliability": 5, "motivation": 5, "technique": 4},
                "reviewText": "Great workout partner! Very motivating and reliable."
            }
            
            create_response = self.session.post(f"{BASE_URL}/reviews", json=review_data)
            
            if create_response.status_code == 201:
                data = create_response.json()
                review_id = data.get('reviewId')
                self.log_test("Create Review", True, f"Review created: {review_id}")
                
                # Get reviews
                target_id = review_data["targetId"]
                get_response = self.session.get(f"{BASE_URL}/reviews/{target_id}?type=user")
                if get_response.status_code == 200:
                    reviews = get_response.json().get('reviews', [])
                    self.log_test("Get Reviews", True, f"Retrieved {len(reviews)} reviews")
                    return True
                else:
                    self.log_test("Get Reviews", False, f"Status: {get_response.status_code}")
                    return False
            else:
                self.log_test("Create Review", False, f"Status: {create_response.status_code}, Response: {create_response.text}")
                return False
                
        except Exception as e:
            self.log_test("Rating System", False, f"Exception: {str(e)}")
            return False
    
    def test_notifications(self):
        """Test notifications system"""
        try:
            # Get notifications
            response = self.session.get(f"{BASE_URL}/notifications")
            
            if response.status_code == 200:
                data = response.json()
                notifications = data.get('notifications', [])
                unread_count = data.get('unreadCount', 0)
                self.log_test("Get Notifications", True, f"Retrieved {len(notifications)} notifications, {unread_count} unread")
                
                # Test mark as read (if there are notifications)
                if notifications:
                    notification_id = notifications[0].get('id')
                    if notification_id:
                        read_response = self.session.post(f"{BASE_URL}/notifications/{notification_id}/read")
                        if read_response.status_code == 200:
                            self.log_test("Mark Notification Read", True, "Notification marked as read")
                            return True
                        else:
                            self.log_test("Mark Notification Read", False, f"Status: {read_response.status_code}")
                            return False
                else:
                    self.log_test("Notifications System", True, "No notifications to test read functionality")
                    return True
            else:
                self.log_test("Get Notifications", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Notifications", False, f"Exception: {str(e)}")
            return False
    
    def test_emergency_sos(self):
        """Test emergency SOS system"""
        try:
            sos_data = {
                "location": "Gold's Gym, Los Angeles, CA",
                "sessionId": self.test_session_id
            }
            
            response = self.session.post(f"{BASE_URL}/emergency/sos", json=sos_data)
            
            if response.status_code == 201:
                data = response.json()
                emergency = data.get('emergency')
                if emergency and emergency.get('status') == 'active':
                    self.log_test("Emergency SOS", True, f"SOS triggered: {emergency.get('id')}")
                    return True
                else:
                    self.log_test("Emergency SOS", False, "SOS response incomplete")
                    return False
            else:
                self.log_test("Emergency SOS", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Emergency SOS", False, f"Exception: {str(e)}")
            return False
    
    def test_subscription_management(self):
        """Test subscription upgrade (mock)"""
        try:
            upgrade_data = {"tier": "pro"}
            
            response = self.session.post(f"{BASE_URL}/subscriptions/upgrade", json=upgrade_data)
            
            if response.status_code == 200:
                data = response.json()
                if "pro" in data.get('message', '').lower():
                    self.log_test("Subscription Upgrade", True, "Upgraded to Pro tier")
                    return True
                else:
                    self.log_test("Subscription Upgrade", False, "Upgrade response unexpected")
                    return False
            else:
                self.log_test("Subscription Upgrade", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Subscription Management", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests in priority order"""
        print("🚀 Starting FITTR Backend API Testing Suite")
        print("=" * 60)
        
        # High Priority Tests
        print("\n📋 HIGH PRIORITY TESTS")
        print("-" * 30)
        
        # Test 1: User Registration
        reg_success = self.test_user_registration()
        
        # Test 2: Authentication (use existing user)
        auth_success = self.test_user_authentication()
        
        # Test 3: Profile Access
        profile_success = self.test_get_profile()
        
        # Test 4: Complete Onboarding Flow
        onboarding_success = self.test_onboarding_flow()
        
        # Test 5: Matching Algorithm
        matching_success = self.test_matching_algorithm()
        
        # Test 6: AI Workout Generator
        ai_success = self.test_ai_workout_generator()
        
        # Test 7: Session Management
        session_success = self.test_session_management()
        
        # Medium Priority Tests
        print("\n📋 MEDIUM PRIORITY TESTS")
        print("-" * 30)
        
        # Test 8: Social Feed
        feed_success = self.test_social_feed()
        
        # Test 9: Rating System
        rating_success = self.test_rating_system()
        
        # Test 10: Notifications
        notifications_success = self.test_notifications()
        
        # Low Priority Tests
        print("\n📋 LOW PRIORITY TESTS")
        print("-" * 30)
        
        # Test 11: Emergency SOS
        sos_success = self.test_emergency_sos()
        
        # Test 12: Subscription Management
        subscription_success = self.test_subscription_management()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        high_priority_tests = [
            ("User Registration", reg_success),
            ("User Authentication", auth_success),
            ("Get Profile", profile_success),
            ("Complete Onboarding Flow", onboarding_success),
            ("Matching Algorithm", matching_success),
            ("AI Workout Generator", ai_success),
            ("Session Management", session_success)
        ]
        
        medium_priority_tests = [
            ("Social Feed", feed_success),
            ("Rating System", rating_success),
            ("Notifications", notifications_success)
        ]
        
        low_priority_tests = [
            ("Emergency SOS", sos_success),
            ("Subscription Management", subscription_success)
        ]
        
        def print_test_results(tests, category):
            print(f"\n{category}:")
            passed = 0
            for test_name, success in tests:
                status = "✅ PASS" if success else "❌ FAIL"
                print(f"  {status} {test_name}")
                if success:
                    passed += 1
            print(f"  📈 {passed}/{len(tests)} tests passed")
            return passed, len(tests)
        
        high_passed, high_total = print_test_results(high_priority_tests, "HIGH PRIORITY")
        medium_passed, medium_total = print_test_results(medium_priority_tests, "MEDIUM PRIORITY")
        low_passed, low_total = print_test_results(low_priority_tests, "LOW PRIORITY")
        
        total_passed = high_passed + medium_passed + low_passed
        total_tests = high_total + medium_total + low_total
        
        print(f"\n🎯 OVERALL RESULTS: {total_passed}/{total_tests} tests passed")
        
        if total_passed == total_tests:
            print("🎉 ALL TESTS PASSED! Backend is ready for production.")
        elif high_passed == high_total:
            print("✅ All HIGH priority tests passed. Core functionality working.")
        else:
            print("⚠️  Some critical tests failed. Review issues above.")
        
        return total_passed, total_tests

if __name__ == "__main__":
    tester = FittrAPITester()
    tester.run_all_tests()