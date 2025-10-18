import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_complete_api_flow():
    """Complete API testing flow - FIXED VERSION"""
    
    print("🚀 Starting GameHub API Test Flow")
    print("=" * 50)
    
    # Step 1: Create sample data (THIS CREATES THE ORGANIZER ACCOUNT)
    print("\n1️⃣ Creating sample data...")
    response = requests.post(f"{BASE_URL}/test/create-sample-data")
    if response.status_code == 200:
        print("✅ Sample data created successfully")
        sample_data = response.json()
        print(f"   📧 Organizer: {sample_data['organizer_email']}")
        print(f"   🔑 Password: {sample_data['password']}")
    else:
        print(f"❌ Failed to create sample data: {response.text}")
        return
    
    # Step 2: Login as ORGANIZER (CRITICAL - MUST BE ORGANIZER!)
    print("\n2️⃣ Logging in as ORGANIZER...")
    organizer_login = {
        "email": "organizer@test.com",  # ← ORGANIZER email
        "password": "password123"
    }
    
    response = requests.post(f"{BASE_URL}/test/login", json=organizer_login)
    if response.status_code == 200:
        organizer_token = response.json()["access_token"]
        print("✅ Organizer login successful")
        print(f"   🎫 Token: {organizer_token[:50]}...")
    else:
        print(f"❌ Organizer login failed: {response.text}")
        return
    
    # Step 3: Create event as ORGANIZER
    print("\n3️⃣ Creating event as organizer...")
    headers = {"Authorization": f"Bearer {organizer_token}"}  # ← ORGANIZER token
    event_data = {
        "title": "Valorant Championship",
        "description": "Epic tournament",
        "category": "esports",
        "date": "2025-12-15",
        "time": "18:00",
        "location": "Online Gaming Arena",
        "max_participants": 64
    }
    
    response = requests.post(f"{BASE_URL}/test/create-event", json=event_data, headers=headers)
    if response.status_code == 200:
        event = response.json()
        print("✅ Event created successfully!")
        print(f"   🎮 Event ID: {event['id']}")
        print(f"   📝 Title: {event['title']}")
        event_id = event["id"]
    else:
        print(f"❌ Event creation failed: {response.text}")
        return
    
    print("\n🎉 EVENT CREATION SUCCESSFUL!")
    return event_id

if __name__ == "__main__":
    test_complete_api_flow()
