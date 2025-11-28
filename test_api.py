import sys
import os

# Add current directory to path so we can import api.index
sys.path.append(os.getcwd())

from api.index import app

def test_derivative():
    print("Testing /api/derivative...")
    with app.test_client() as client:
        # Test case 1: Simple polynomial
        print("\n--- Test Case 1: x^2 ---")
        response = client.get('/api/derivative?equation=x^2')
        print(f"Status: {response.status_code}")
        print(f"Response: {response.get_json()}")
        
        # Test case 2: Trig function
        print("\n--- Test Case 2: sin(x) ---")
        response = client.get('/api/derivative?equation=sin(x)')
        print(f"Status: {response.status_code}")
        print(f"Response: {response.get_json()}")

if __name__ == "__main__":
    test_derivative()
