#!/usr/bin/env python3
"""
MassDwell Sales Reply Monitor
Checks Gmail (sales@massdwell.com) for replies to campaign emails
- Identifies sender and finds lead in Kommo CRM
- Classifies sentiment (positive/neutral/negative)
- Logs activity as note in Kommo
- Alerts on positive replies needing immediate follow-up
Runs every 15 minutes
"""

import json
import sys
import base64
from pathlib import Path
from datetime import datetime, timedelta
import logging
import re

sys.path.insert(0, str(Path(__file__).parent))
from gmail_auth_handler import get_gmail_access_token

class SalesReplyMonitor:
    def __init__(self):
        self.setup_logging()
        self.load_data()
        self.gmail_api_url = "https://www.googleapis.com/gmail/v1/users/me/messages"
        
    def setup_logging(self):
        """Set up logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='[%(asctime)s] %(message)s',
            handlers=[
                logging.FileHandler('/Users/openclaw/.openclaw/workspace/scripts/sales_bot_reply_monitor.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def log(self, message):
        """Log with timestamp"""
        self.logger.info(message)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
    
    def load_data(self):
        """Load CRM data and Gmail token"""
        try:
            with open('/Users/openclaw/.openclaw/workspace/crm-dashboard/data/leads.json', 'r') as f:
                data = json.load(f)
                self.leads = {lead['contact_email'].lower(): lead for lead in data.get('leads', []) if 'contact_email' in lead}
            self.log(f"✅ Loaded {len(self.leads)} leads from CRM")
        except Exception as e:
            self.log(f"❌ Error loading CRM: {e}")
            self.leads = {}
        
        try:
            self.gmail_token = get_gmail_access_token()
            self.log("✅ Gmail authentication successful")
        except Exception as e:
            self.log(f"❌ Gmail auth failed: {e}")
            raise
    
    def get_recent_messages(self, hours=1):
        """Get recent messages from last N hours"""
        try:
            import requests
            
            # Extract token properly
            if isinstance(self.gmail_token, dict) and 'access_token' in self.gmail_token:
                token = self.gmail_token['access_token']
            else:
                token = str(self.gmail_token)
            
            headers = {
                'Authorization': f'Bearer {token}'
            }
            
            # Search for recent messages (not sent by us, after last check)
            # CRITICAL FIX: Gmail requires YYYY/MM/DD format, not Unix timestamp
            cutoff_date = (datetime.now() - timedelta(hours=hours)).strftime('%Y/%m/%d')
            
            # Exclude delivery failures and automated messages
            query = (
                f'to:sales@massdwell.com is:unread after:{cutoff_date} '
                f'-from:mailer-daemon -from:postmaster -from:noreply '
                f'-subject:"Delivery Status" -subject:"Undeliverable"'
            )
            
            self.log(f"🔍 Gmail query: {query}")
            
            response = requests.get(
                self.gmail_api_url,
                headers=headers,
                params={'q': query, 'maxResults': 50}
            )
            
            if response.status_code == 200:
                data = response.json()
                messages = data.get('messages', []) if isinstance(data, dict) else []
                self.log(f"📬 Found {len(messages)} new unread messages")
                return messages
            else:
                self.log(f"❌ Gmail API error: {response.status_code} - {response.text}")
                return []
        except Exception as e:
            self.log(f"❌ Error fetching messages: {e}")
            import traceback
            self.log(traceback.format_exc())
            return []
    
    def get_message_details(self, message_id):
        """Get full message content"""
        try:
            import requests
            
            # Extract token properly
            if isinstance(self.gmail_token, dict) and 'access_token' in self.gmail_token:
                token = self.gmail_token['access_token']
            else:
                token = str(self.gmail_token)
            
            headers = {
                'Authorization': f'Bearer {token}'
            }
            
            response = requests.get(
                f'{self.gmail_api_url}/{message_id}',
                headers=headers,
                params={'format': 'full'}
            )
            
            if response.status_code == 200:
                return response.json()
            return None
        except Exception as e:
            self.log(f"❌ Error getting message details: {e}")
            return None
    
    def extract_email_and_body(self, message_data):
        """Extract sender email and body from message"""
        try:
            headers = message_data.get('payload', {}).get('headers', [])
            sender_email = None
            subject = None
            
            for header in headers:
                if header['name'].lower() == 'from':
                    # Extract email from "Name <email>" format
                    match = re.search(r'<(.+?)>', header['value'])
                    sender_email = match.group(1) if match else header['value']
                elif header['name'].lower() == 'subject':
                    subject = header['value']
            
            # Extract body
            body = ""
            parts = message_data.get('payload', {}).get('parts', [])
            if parts:
                for part in parts:
                    if part.get('mimeType') == 'text/plain':
                        data = part.get('body', {}).get('data', '')
                        if data:
                            body = base64.urlsafe_b64decode(data).decode('utf-8')
                            break
            else:
                data = message_data.get('payload', {}).get('body', {}).get('data', '')
                if data:
                    body = base64.urlsafe_b64decode(data).decode('utf-8')
            
            return sender_email, subject, body
        except Exception as e:
            self.log(f"❌ Error parsing message: {e}")
            return None, None, None
    
    def classify_sentiment(self, body):
        """Classify reply sentiment (positive/neutral/negative)"""
        body_lower = body.lower()
        
        # Positive signals
        positive_words = ['interested', 'yes', 'love', 'great', 'perfect', 'let\'s', 'schedule', 
                         'move forward', 'when', 'available', 'sounds good', 'impressive', 
                         'impressive', 'excited', 'absolutely', 'definitely']
        
        # Negative signals
        negative_words = ['not interested', 'not for us', 'busy', 'no thanks', 'pass', 
                         'not a fit', 'wrong', 'unsubscribe', 'remove', 'can\'t', 'won\'t']
        
        positive_count = sum(1 for word in positive_words if word in body_lower)
        negative_count = sum(1 for word in negative_words if word in body_lower)
        
        if negative_count > positive_count and negative_count > 0:
            return "negative"
        elif positive_count > negative_count and positive_count > 0:
            return "positive"
        else:
            return "neutral"
    
    def mark_as_read(self, message_id):
        """Mark message as read"""
        try:
            import requests
            
            # Extract token properly
            if isinstance(self.gmail_token, dict) and 'access_token' in self.gmail_token:
                token = self.gmail_token['access_token']
            else:
                token = str(self.gmail_token)
            
            headers = {
                'Authorization': f'Bearer {token}'
            }
            
            requests.post(
                f'{self.gmail_api_url}/{message_id}/modify',
                headers=headers,
                json={'removeLabelIds': ['UNREAD']}
            )
        except Exception as e:
            self.log(f"⚠️  Could not mark message as read: {e}")
    
    def log_to_kommo(self, lead_id, sender_email, body, sentiment):
        """Log reply as note in Kommo"""
        try:
            import requests
            
            # Load Kommo token
            kommo_token_path = '/Users/openclaw/.openclaw/workspace/credentials/kommo-token.json'
            with open(kommo_token_path, 'r') as f:
                kommo_token = json.load(f)
            
            headers = {
                'Authorization': f'Bearer {kommo_token["access_token"]}',
                'Content-Type': 'application/json'
            }
            
            note_text = f"[REPLY - {sentiment.upper()}]\nFrom: {sender_email}\n\n{body[:500]}"
            
            response = requests.post(
                'https://massdwellcrm.kommo.com/api/v4/leads/{}/notes'.format(lead_id),
                headers=headers,
                json={'note': {'text': note_text}}
            )
            
            if response.status_code in [200, 201]:
                return True
            else:
                self.log(f"⚠️  Kommo note failed ({response.status_code})")
                return False
        except Exception as e:
            self.log(f"⚠️  Could not log to Kommo: {e}")
            return False
    
    def run(self):
        """Main monitoring loop"""
        self.log("🚀 SALES REPLY MONITOR STARTING")
        self.log("=" * 50)
        
        messages = self.get_recent_messages(hours=1)
        
        if not messages:
            self.log("✅ No new replies found")
            self.print_summary(0, 0, 0)
            return
        
        sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
        alerts = []
        
        for msg in messages:
            msg_details = self.get_message_details(msg['id'])
            if not msg_details:
                continue
            
            sender_email, subject, body = self.extract_email_and_body(msg_details)
            
            if not sender_email:
                self.log(f"⚠️  Could not extract sender email")
                continue
            
            # Find lead in CRM
            lead = self.leads.get(sender_email.lower())
            if not lead:
                self.log(f"⚠️  No lead found for {sender_email}")
                self.mark_as_read(msg['id'])
                continue
            
            # Classify sentiment
            sentiment = self.classify_sentiment(body)
            sentiment_counts[sentiment] += 1
            
            self.log(f"📧 {lead['name']} ({sender_email}) - {sentiment.upper()}")
            
            # Log to Kommo
            self.log_to_kommo(lead['id'], sender_email, body, sentiment)
            
            # Flag positive replies
            if sentiment == "positive":
                alerts.append({
                    'name': lead['name'],
                    'email': sender_email,
                    'subject': subject,
                    'snippet': body[:100]
                })
            
            # Mark as read
            self.mark_as_read(msg['id'])
        
        self.print_summary(
            len(messages),
            sentiment_counts['positive'],
            len(alerts)
        )
        
        # Alert on hot replies
        if alerts:
            self.log("🔥 HOT REPLIES NEEDING IMMEDIATE FOLLOW-UP:")
            for alert in alerts:
                self.log(f"  → {alert['name']} ({alert['email']})")
    
    def print_summary(self, total, positive, alerts):
        """Print monitoring summary"""
        self.log("=" * 50)
        self.log(f"📊 REPLY MONITOR SUMMARY:")
        self.log(f"   Total replies processed: {total}")
        self.log(f"   Positive responses: {positive}")
        self.log(f"   Hot leads requiring follow-up: {alerts}")
        self.log("=" * 50)

if __name__ == '__main__':
    try:
        monitor = SalesReplyMonitor()
        monitor.run()
    except Exception as e:
        print(f"❌ CRITICAL ERROR: {e}")
        sys.exit(1)
