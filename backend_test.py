import requests
import sys
import json
from datetime import datetime
import time

class FantasyFootballAPITester:
    def __init__(self, base_url="https://fantasy-league-12.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.manager_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_data = {
            "username": f"test_user_{datetime.now().strftime('%H%M%S')}",
            "email": f"test{datetime.now().strftime('%H%M%S')}@manager.com",
            "password": "testpass123",
            "team_name": "Test FC"
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        print(f"   Method: {method}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            print(f"   Status Code: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ FAILED - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            return False, {}

    def test_register(self):
        """Test user registration"""
        success, response = self.run_test(
            "User Registration",
            "POST",
            "register",
            200,
            data=self.test_user_data
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            if 'manager' in response:
                self.manager_id = response['manager']['id']
            print(f"   ✅ Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_login(self):
        """Test user login"""
        login_data = {
            "email": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        }
        success, response = self.run_test(
            "User Login",
            "POST",
            "login",
            200,
            data=login_data
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            if 'manager' in response:
                self.manager_id = response['manager']['id']
            print(f"   ✅ Login successful, token: {self.token[:20]}...")
            return True
        return False

    def test_get_players(self):
        """Test getting all players"""
        success, response = self.run_test(
            "Get All Players",
            "GET",
            "players",
            200
        )
        if success:
            print(f"   ✅ Found {len(response)} players")
            return True, response
        return False, []

    def test_seed_players(self):
        """Test seeding initial players"""
        success, response = self.run_test(
            "Seed Initial Players",
            "POST",
            "seed-players",
            200
        )
        if success:
            print(f"   ✅ Players seeded successfully")
            return True
        return False

    def test_create_auction(self, player_id):
        """Test creating an auction"""
        auction_data = {
            "player_id": player_id,
            "starting_bid": 5.0,
            "duration_minutes": 5
        }
        success, response = self.run_test(
            "Create Auction",
            "POST",
            "auctions",
            200,
            data=auction_data
        )
        if success and 'id' in response:
            print(f"   ✅ Auction created with ID: {response['id']}")
            return True, response['id']
        return False, None

    def test_get_auctions(self):
        """Test getting all auctions"""
        success, response = self.run_test(
            "Get All Auctions",
            "GET",
            "auctions",
            200
        )
        if success:
            print(f"   ✅ Found {len(response)} auctions")
            return True, response
        return False, []

    def test_place_bid(self, auction_id):
        """Test placing a bid on an auction"""
        bid_data = {
            "auction_id": auction_id,
            "bidder_id": self.manager_id,
            "amount": 10.0
        }
        success, response = self.run_test(
            "Place Bid",
            "POST",
            f"auctions/{auction_id}/bid",
            200,
            data=bid_data
        )
        if success:
            print(f"   ✅ Bid placed successfully")
            return True
        return False

    def test_get_my_squad(self):
        """Test getting user's squad"""
        success, response = self.run_test(
            "Get My Squad",
            "GET",
            "my-squad",
            200
        )
        if success:
            print(f"   ✅ Squad retrieved, {len(response)} players")
            return True, response
        return False, []

    def test_get_manager_profile(self):
        """Test getting manager profile"""
        if not self.manager_id:
            print("❌ No manager ID available for profile test")
            return False
            
        success, response = self.run_test(
            "Get Manager Profile",
            "GET",
            f"managers/{self.manager_id}",
            200
        )
        if success:
            print(f"   ✅ Manager profile retrieved")
            return True
        return False

def main():
    print("🚀 Starting Fantasy Football API Tests")
    print("=" * 50)
    
    tester = FantasyFootballAPITester()
    
    # Test 1: Registration
    if not tester.test_register():
        print("❌ Registration failed, stopping tests")
        return 1

    # Test 2: Login (using same credentials)
    if not tester.test_login():
        print("❌ Login failed, stopping tests")
        return 1

    # Test 3: Get players (might be empty initially)
    players_success, players = tester.test_get_players()
    
    # Test 4: Seed players if none exist
    if players_success and len(players) == 0:
        if not tester.test_seed_players():
            print("❌ Seeding players failed")
            return 1
        # Get players again after seeding
        players_success, players = tester.test_get_players()

    # Test 5: Get auctions
    auctions_success, auctions = tester.test_get_auctions()

    # Test 6: Create auction (if we have players)
    auction_id = None
    if players_success and len(players) > 0:
        # Find a player without owner
        available_player = None
        for player in players:
            if not player.get('current_owner'):
                available_player = player
                break
        
        if available_player:
            auction_success, auction_id = tester.test_create_auction(available_player['id'])
            
            # Test 7: Place bid (if auction was created)
            if auction_success and auction_id:
                tester.test_place_bid(auction_id)

    # Test 8: Get my squad
    tester.test_get_my_squad()

    # Test 9: Get manager profile
    tester.test_get_manager_profile()

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} TESTS FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())