
#!/bin/bash
BASE_URL="http://localhost:3000"
USER_ID="debug_user_$(date +%s)"

echo "1. Creating Receipt..."
CREATE_RES=$(curl -s -X POST "$BASE_URL/api/receipt/manual" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\"}")

ID=$(echo $CREATE_RES | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$ID" ]; then
  echo "Failed to create receipt. Response: $CREATE_RES"
  exit 1
fi

echo "Created ID: $ID"

echo "2. Listing Receipts (verify creation)..."
LIST_RES_1=$(curl -s "$BASE_URL/api/receipt/list?userId=$USER_ID")
if [[ $LIST_RES_1 == *"$ID"* ]]; then
  echo "Found in list: YES"
else
  echo "Found in list: NO"
  exit 1
fi

echo "3. Deleting Receipt..."
DELETE_RES=$(curl -s -X DELETE "$BASE_URL/api/receipt/$ID")
echo "Delete Response: $DELETE_RES"

echo "4. Listing Receipts Again (verify deletion)..."
LIST_RES_2=$(curl -s "$BASE_URL/api/receipt/list?userId=$USER_ID")

if [[ $LIST_RES_2 == *"$ID"* ]]; then
  echo "TEST FAILED: Item still exists in list!"
else
  echo "TEST PASSED: Item gone from list."
fi
