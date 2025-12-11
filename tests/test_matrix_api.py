import sys
import os
import json

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api.index import app

def run_tests():
    app.config['TESTING'] = True
    client = app.test_client()
    
    print("Testing Determinant...")
    res = client.post('/api/matrix', json={"matrix": [[1, 2], [3, 4]], "operation": "determinant"})
    data = res.get_json()
    print(f"Status: {res.status_code}, Result: {data}")
    if res.status_code != 200 or data.get('solution_raw') != "-2":
        print("FAIL: Determinant test failed")
        return

    print("\nTesting Inverse...")
    res = client.post('/api/matrix', json={"matrix": [[1, 2], [3, 4]], "operation": "inverse"})
    data = res.get_json()
    print(f"Status: {res.status_code}, Result: {data}")
    if res.status_code != 200:
        print("FAIL: Inverse test failed")
        return

    print("\nTesting Singular Error...")
    res = client.post('/api/matrix', json={"matrix": [[1, 1], [1, 1]], "operation": "inverse"})
    data = res.get_json()
    print(f"Status: {res.status_code}, Error: {data.get('error')}")
    if res.status_code != 400 or "singular" not in data.get('error', ''):
        print("FAIL: Singular error test failed")
        return

    print("\nTesting RREF...")
    res = client.post('/api/matrix', json={"matrix": [[1, 2, 1], [2, 4, 3]], "operation": "rref"})
    data = res.get_json()
    print(f"Status: {res.status_code}, Result: {data}")
    if res.status_code != 200:
        print("FAIL: RREF test failed")
        return

    print("\nALL TESTS PASSED ✅")

if __name__ == "__main__":
    run_tests()
