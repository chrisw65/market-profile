#!/bin/bash

# Test login functionality
# Usage: ./test-login.sh your-email@example.com your-password

EMAIL=${1:-"test@example.com"}
PASSWORD=${2:-"password123"}

echo "Testing login for: $EMAIL"
echo "================================"
echo ""

# Test the login API endpoint
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "Response Body:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Login successful!"
else
  echo "❌ Login failed!"
  echo ""
  echo "Common issues:"
  echo "1. Wrong email or password"
  echo "2. Email not confirmed (check Supabase dashboard)"
  echo "3. User doesn't exist (create account at /signup)"
fi
