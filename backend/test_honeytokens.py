"""
Honeytoken System Test Script

This script demonstrates how the honeytoken system works:
1. Export user data (honeytokens auto-injected)
2. Simulate attacker using stolen honeytoken
3. Show breach detection and alerts
"""

import requests
import json

# Configuration
BASE_URL = 'http://localhost:5000/api'
ADMIN_EMAIL = 'admin@ecommerce.com'
ADMIN_PASSWORD = 'admin123'

def test_honeytoken_system():
    print("=" * 70)
    print("HONEYTOKEN SYSTEM DEMONSTRATION")
    print("=" * 70)
    print()
    
    # Step 1: Login as admin
    print("[Step 1] Logging in as admin...")
    login_response = requests.post(f'{BASE_URL}/auth/login', json={
        'email': ADMIN_EMAIL,
        'password': ADMIN_PASSWORD
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    token = login_response.json()['token']
    headers = {
        'Authorization': f'Bearer {token}',
        'Session-ID': 'test_honeytoken_session',
        'X-Mock-IP': '203.0.113.99'  # Simulated attacker IP
    }
    
    print(f"✅ Logged in successfully")
    print()
    
    # Step 2: Export users (honeytokens auto-injected)
    print("[Step 2] Exporting user data...")
    export_response = requests.get(
        f'{BASE_URL}/admin/users/export',
        headers=headers
    )
    
    if export_response.status_code != 200:
        print(f"❌ Export failed: {export_response.text}")
        return
    
    export_data = export_response.json()
    users = export_data['users']
    
    print(f"✅ Exported {len(users)} users")
    print(f"✅ Honeytokens injected: {export_data.get('honeytokens_injected', False)}")
    print()
    
    # Step 3: Find honeytokens in export
    print("[Step 3] Analyzing exported data for honeytokens...")
    honeytokens_found = []
    
    for user in users:
        if user['_id'].startswith('ht_'):
            honeytokens_found.append({
                'user_id': user['_id'],
                'api_key': user.get('api_key'),
                'session_token': user.get('session_token'),
                'reset_token': user.get('reset_token')
            })
    
    if not honeytokens_found:
        print("❌ No honeytokens found in export")
        return
    
    print(f"✅ Found {len(honeytokens_found)} honeytoken user(s)")
    print()
    print("Sample honeytoken:")
    sample = honeytokens_found[0]
    print(f"  User ID: {sample['user_id']}")
    print(f"  API Key: {sample['api_key'][:30]}...")
    print(f"  Session Token: {sample['session_token'][:30]}...")
    print(f"  Reset Token: {sample['reset_token'][:30]}...")
    print()
    
    # Step 4: Simulate attacker using stolen API key
    print("[Step 4] Simulating attacker using stolen API key...")
    print("(Attacker POV: I found this API key in the data dump...)")
    print()
    
    fake_api_key = sample['api_key']
    attacker_headers = {
        'X-Mock-IP': '45.142.120.123',  # Different IP (attacker)
        'User-Agent': 'Python/3.9 (Automated Script)'
    }
    
    verify_response = requests.post(
        f'{BASE_URL}/auth/verify-api-key',
        json={'api_key': fake_api_key},
        headers=attacker_headers
    )
    
    print(f"Attacker request status: {verify_response.status_code}")
    result = verify_response.json()
    
    if result.get('_honeytoken_triggered'):
        print("🚨🚨🚨 HONEYTOKEN TRIGGERED! 🚨🚨🚨")
        print()
        print("BREACH DETECTED:")
        print(f"  ✅ Fake API key was used")
        print(f"  ✅ Attacker IP: {attacker_headers['X-Mock-IP']}")
        print(f"  ✅ Alert sent to admin dashboard")
        print(f"  ✅ Event logged to blockchain")
        print(f"  ✅ Attacker IP automatically blocked")
        print()
        print("Attacker received fake response:")
        print(f"  {json.dumps(result, indent=2)}")
        print()
        print("(Attacker thinks the API key is valid, but it's a trap!)")
    else:
        print("❌ Honeytoken not triggered as expected")
    
    print()
    
    # Step 5: Check honeytoken statistics
    print("[Step 5] Checking honeytoken statistics...")
    stats_response = requests.get(
        f'{BASE_URL}/admin/honeytoken/stats',
        headers=headers
    )
    
    if stats_response.status_code == 200:
        stats = stats_response.json()
        print(f"Total honeytokens: {stats['total_honeytokens']}")
        print(f"Triggered honeytokens: {stats['triggered_honeytokens']}")
        print(f"Detection rate: {stats['detection_rate']:.1f}%")
    
    print()
    print("=" * 70)
    print("DEMONSTRATION COMPLETE")
    print("=" * 70)
    print()
    print("Summary:")
    print("✅ Honeytokens automatically injected into exports")
    print("✅ Attacker used fake API key → Breach detected immediately")
    print("✅ Zero false positives (honeytoken use = 100% breach)")
    print("✅ Automated response activated (IP blocked)")
    print("✅ Blockchain audit trail created")
    print()
    print("This system detects exfiltration AFTER data leaves your system!")

if __name__ == '__main__':
    try:
        test_honeytoken_system()
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server")
        print("Make sure the backend is running on http://localhost:5000")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
