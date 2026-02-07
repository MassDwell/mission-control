#!/bin/bash
# Script to upload photos from Google Drive to Softr
# Uses gog CLI for Drive access and curl for Softr API

SOFTR_API_KEY="whjv2GyLPK61bRclOjw8kaetG"
DATABASE_ID="7a809503-2b58-4764-b34a-a3660b474f8e"
TABLE_ID="g8JlnfHDfWmyIe"

# Function to update a Softr record with an image URL
update_softr_photo() {
    local record_id="$1"
    local image_name="$2"
    local image_url="$3"
    
    echo "Updating $record_id with $image_name..."
    
    response=$(curl -s -X PATCH "https://tables-api.softr.io/api/v1/databases/${DATABASE_ID}/tables/${TABLE_ID}/records/${record_id}" \
        -H "Softr-Api-Key: ${SOFTR_API_KEY}" \
        -H "Content-Type: application/json" \
        -d "{
            \"fields\": {
                \"EWdoC\": {
                    \"name\": \"${image_name}\",
                    \"url\": \"${image_url}\",
                    \"type\": \"image/jpeg\"
                }
            }
        }")
    
    # Check if successful
    if echo "$response" | jq -e '.data.fields.EWdoC' > /dev/null 2>&1; then
        echo "  ✓ Success"
    else
        echo "  ✗ Failed: $response"
    fi
}

# Get records that need photos
echo "Fetching records needing photos..."
records=$(curl -s -X GET "https://tables-api.softr.io/api/v1/databases/${DATABASE_ID}/tables/${TABLE_ID}/records?limit=50" \
    -H "Softr-Api-Key: ${SOFTR_API_KEY}" | \
    jq -r '.data[] | select(.fields["EWdoC"] == null and .fields["94Pst"] != null) | "\(.id)|\(.fields["94Pst"])|\(.fields["tOPG4"].label // "unknown")"')

echo "Records needing photos:"
echo "$records"
