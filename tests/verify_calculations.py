import unittest
import sys
import os
import json

# Add parent directory to path so we can import api.index
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from api.index import app

class TestDerivativeCalculator(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def _test_endpoint(self, endpoint, equation, expected_raw_snippet, kwargs=None):
        """Helper to test an endpoint and check if result contains expected snippet."""
        params = {'equation': equation, 'include_ai': 'false'}
        if kwargs:
            params.update(kwargs)
            
        response = self.app.get(f'/api/{endpoint}', query_string=params)
        data = json.loads(response.data)
        
        self.assertEqual(response.status_code, 200, f"Failed for {equation}: {data.get('error')}")
        self.assertIn('solution', data)
        self.assertIn('solution_raw', data)
        
        # Check if the raw solution contains the expected mathematical snippet
        # We check for containment because formatting might vary slightly (e.g. spaces)
        self.assertIn(expected_raw_snippet, data['solution_raw'].replace(' ', ''), 
                      f"Mismatch for {equation}. Got {data['solution_raw']}")
        print(f"✅ {endpoint.capitalize()}: {equation} -> {data['solution_raw']}")

    def test_derivatives(self):
        print("\n--- Testing Derivatives ---")
        cases = [
            ("x^2", "2*x"),
            ("sin(x)", "cos(x)"),
            ("ln(x)", "1/x"),
            ("exp(x)", "exp(x)"),
            ("x^3 + 2*x", "3*x**2+2"),  # Sympy often outputs ** for power in str()
        ]
        for eq, expected in cases:
            self._test_endpoint('derivative', eq, expected)

    def test_integrals(self):
        print("\n--- Testing Integrals ---")
        cases = [
            ("2*x", "x**2"),
            ("cos(x)", "sin(x)"),
            ("1/x", "log(x)"), # Sympy integrates 1/x to log(x)
        ]
        for eq, expected in cases:
            self._test_endpoint('integral', eq, expected)

    def test_limits(self):
        print("\n--- Testing Limits ---")
        # Direct limits
        self._test_endpoint('limit', '(x^2-1)/(x-1)', "2", {'to': '1'})
        self._test_endpoint('limit', 'sin(x)/x', "1", {'to': '0'})
        self._test_endpoint('limit', '1/x', "0", {'to': 'oo'}) # Infinity

    def test_chain_rule(self):
        print("\n--- Testing Chain Rule ---")
        # d/dx sin(x^2) -> 2*x*cos(x^2)
        self._test_endpoint('derivative', 'sin(x^2)', "2*x*cos(x**2)")

    def test_mass_verification(self):
        print("\n--- Mass Verification (problems.json) ---")
        problems_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'problems.json')
        if not os.path.exists(problems_path):
            print(f"⚠️ Warning: {problems_path} not found. Skipping mass verification.")
            return

        with open(problems_path, 'r') as f:
            problems = json.load(f)

        print(f"Found {len(problems)} problems defined in database. Testing all...")
        
        success_count = 0
        for i, p in enumerate(problems):
            eq = p['formula']
            try:
                # We don't check for specific expected output string here because we blindly trust SymPy
                # We just verify that the API returns 200 OK and a solution key
                response = self.app.get(f'/api/derivative?equation={eq}&include_ai=false')
                data = json.loads(response.data)
                
                if response.status_code == 200 and 'solution' in data:
                    # print(f"✅ [{i+1}/{len(problems)}] {p['slug']}: {eq}") # Optional: simple dot per success
                    sys.stdout.write('.')
                    sys.stdout.flush()
                    success_count += 1
                else:
                    print(f"\n❌ FAILED [{i+1}/{len(problems)}] {p['slug']}: {eq} -> {data.get('error')}")
            except Exception as e:
                print(f"\n❌ CRASH [{i+1}/{len(problems)}] {p['slug']}: {eq} -> {str(e)}")

        print(f"\n\nTest Result: {success_count}/{len(problems)} passed successfully.")
        self.assertEqual(success_count, len(problems), "Not all problems in database passed verification.")

if __name__ == '__main__':
    unittest.main()
