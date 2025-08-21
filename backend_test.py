import requests
import sys
import json
from datetime import datetime
import time

class KingsEvolutionLeagueAPITester:
    def __init__(self, base_url="https://fantasy-league-12.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.manager_id = None
        self.president_token = None
        self.president_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_data = {
            "username": f"test_manager_{datetime.now().strftime('%H%M%S')}",
            "email": f"testmgr{datetime.now().strftime('%H%M%S')}@manager.com",
            "password": "testpass123",
            "team_name": "Test FC"
        }
        self.president_data = {
            "username": "presidente",
            "email": "presidente@kingsevolution.com",
            "password": "admin123"
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

    def test_create_president(self):
        """Test creating president account"""
        success, response = self.run_test(
            "Create President Account",
            "POST",
            "create-president",
            200
        )
        if success:
            print(f"   ✅ President account created or already exists")
            return True
        return False

    def test_president_login(self):
        """Test president login"""
        login_data = {
            "email": self.president_data["email"],
            "password": self.president_data["password"]
        }
        success, response = self.run_test(
            "President Login",
            "POST",
            "login",
            200,
            data=login_data
        )
        if success and 'access_token' in response:
            self.president_token = response['access_token']
            if 'manager' in response:
                self.president_id = response['manager']['id']
                president_role = response['manager'].get('role')
                if president_role == 'PRESIDENT':
                    print(f"   ✅ President login successful, role: {president_role}")
                    return True
                else:
                    print(f"   ❌ Expected PRESIDENT role, got: {president_role}")
            return True
        return False

    def test_add_player(self):
        """Test adding a new player"""
        # Switch to president token for this test
        original_token = self.token
        self.token = self.president_token if self.president_token else self.token
        
        player_data = {
            "name": f"Test Player {datetime.now().strftime('%H%M%S')}",
            "position": "MID",
            "team": "Test Team",
            "base_price": 15.0
        }
        success, response = self.run_test(
            "Add New Player",
            "POST",
            "players",
            200,
            data=player_data
        )
        
        # Restore original token
        self.token = original_token
        
        if success and 'id' in response:
            print(f"   ✅ Player added with ID: {response['id']}")
            return True, response['id']
        return False, None

    def test_create_custom_auction(self, player_id, duration_minutes=10):
        """Test creating auction with custom duration"""
        auction_data = {
            "player_id": player_id,
            "starting_bid": 8.0,
            "duration_minutes": duration_minutes
        }
        success, response = self.run_test(
            f"Create Custom Auction ({duration_minutes} min)",
            "POST",
            "auctions",
            200,
            data=auction_data
        )
        if success and 'id' in response:
            print(f"   ✅ Custom auction created with ID: {response['id']}, duration: {duration_minutes} min")
            return True, response['id']
        return False, None

    def test_auction_history(self, auction_id):
        """Test getting auction bid history"""
        success, response = self.run_test(
            "Get Auction History",
            "GET",
            f"auctions/{auction_id}/history",
            200
        )
        if success:
            print(f"   ✅ Auction history retrieved, {len(response)} bids")
            return True, response
        return False, []

    def test_all_managers(self):
        """Test getting all managers (president only)"""
        # Switch to president token
        original_token = self.token
        self.token = self.president_token if self.president_token else self.token
        
        success, response = self.run_test(
            "Get All Managers (President Only)",
            "GET",
            "all-managers",
            200
        )
        
        # Restore original token
        self.token = original_token
        
        if success:
            print(f"   ✅ All managers retrieved, count: {len(response)}")
            return True, response
        return False, []

    def test_update_manager_budget(self, manager_id, new_budget=150.0):
        """Test updating manager budget (president only)"""
        # Switch to president token
        original_token = self.token
        self.token = self.president_token if self.president_token else self.token
        
        budget_data = {
            "manager_id": manager_id,
            "new_budget": new_budget
        }
        success, response = self.run_test(
            "Update Manager Budget (President Only)",
            "PUT",
            "manager-budget",
            200,
            data=budget_data
        )
        
        # Restore original token
        self.token = original_token
        
        if success:
            print(f"   ✅ Manager budget updated to €{new_budget}")
            return True
        return False

    def test_all_squads(self):
        """Test getting all squads/roses"""
        success, response = self.run_test(
            "Get All Squads/Roses",
            "GET",
            "all-squads",
            200
        )
        if success:
            print(f"   ✅ All squads retrieved, count: {len(response)}")
            # Check if president is marked correctly
            for squad in response:
                if squad['manager'].get('role') == 'PRESIDENT':
                    print(f"   ✅ Found president squad: {squad['manager']['username']}")
            return True, response
        return False, []

    def test_multiple_bids_for_history(self, auction_id):
        """Test placing multiple bids to create history"""
        bid_amounts = [12.0, 15.0, 18.0]
        for i, amount in enumerate(bid_amounts):
            bid_data = {
                "auction_id": auction_id,
                "bidder_id": self.manager_id,
                "amount": amount
            }
            success, response = self.run_test(
                f"Place Bid #{i+1} (€{amount})",
                "POST",
                f"auctions/{auction_id}/bid",
                200,
                data=bid_data
            )
            if success:
                print(f"   ✅ Bid #{i+1} placed: €{amount}")
                time.sleep(1)  # Small delay between bids
            else:
                print(f"   ❌ Bid #{i+1} failed")
                break
        return True

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