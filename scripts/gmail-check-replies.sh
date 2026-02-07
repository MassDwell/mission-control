#!/bin/bash
ACCESS=$(cat /tmp/new-token.json | grep access_token | cut -d'"' -f4)

echo "Checking cold campaign replies in inbox..."
echo ""

# Get message list
curl -s "https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in%3Ainbox+subject%3A%22Still+thinking+about+an+ADU%22&maxResults=50" \
  -H "Authorization: Bearer $ACCESS" > /tmp/inbox-msgs.json

# Extract IDs properly using node
node -e "
const data = require('/tmp/inbox-msgs.json');
if (data.messages) {
  data.messages.forEach(m => console.log(m.id));
}
" > /tmp/msg-ids.txt

COUNT=$(wc -l < /tmp/msg-ids.txt | tr -d ' ')
echo "Found $COUNT messages in inbox"
echo ""

while read ID; do
  RESP=$(curl -s "https://gmail.googleapis.com/gmail/v1/users/me/messages/$ID?format=full" \
    -H "Authorization: Bearer $ACCESS")
  
  FROM=$(echo "$RESP" | node -e "
    const d=require('fs').readFileSync(0,'utf8');
    const j=JSON.parse(d);
    const h=j.payload?.headers?.find(h=>h.name==='From');
    console.log(h?.value||'unknown');
  ")
  
  SNIPPET=$(echo "$RESP" | node -e "
    const d=require('fs').readFileSync(0,'utf8');
    const j=JSON.parse(d);
    console.log(j.snippet?.substring(0,120)||'');
  ")
  
  echo "ID: $ID"
  echo "From: $FROM"
  echo "Snippet: $SNIPPET"
  echo "---"
done < /tmp/msg-ids.txt
