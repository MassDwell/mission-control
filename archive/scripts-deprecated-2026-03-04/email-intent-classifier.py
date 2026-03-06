#!/usr/bin/env python3
"""
Email Intent Classification System
Classifies incoming emails and scores them for action
"""

import json
import os
import pickle
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.api_core import retry
import googleapiclient.discovery as discovery
from datetime import datetime, timedelta
import base64
from email.mime.text import MIMEText

SCOPES = ['https://www.googleapis.com/auth/gmail.modify']

class EmailIntentClassifier:
    def __init__(self, account_email):
        self.account_email = account_email
        self.service = self._get_gmail_service()
        self.log_path = f"data/massdwell/sales/email-processing-log.json"
        self.load_log()
        
    def _get_gmail_service(self):
        """Authenticate and return Gmail service"""
        token_path = 'credentials/google/gmail-token.json'
        oauth_creds_path = 'credentials/google/gmail-oauth-credentials.json'
        
        with open(token_path, 'r') as f:
            token_data = json.load(f)
        
        with open(oauth_creds_path, 'r') as f:
            oauth_data = json.load(f)
        
        # Merge token data with oauth client info
        client_config = oauth_data.get('installed', oauth_data)
        token_data['client_id'] = client_config.get('client_id')
        token_data['client_secret'] = client_config.get('client_secret')
        
        # Create credentials object from combined data
        creds_obj = Credentials.from_authorized_user_info(token_data, SCOPES)
        return discovery.build('gmail', 'v1', credentials=creds_obj)
    
    def load_log(self):
        """Load email processing log"""
        if os.path.exists(self.log_path):
            with open(self.log_path, 'r') as f:
                self.log = json.load(f)
        else:
            self.log = {'emails': []}
    
    def save_log(self):
        """Save email processing log"""
        os.makedirs(os.path.dirname(self.log_path), exist_ok=True)
        with open(self.log_path, 'w') as f:
            json.dump(self.log, f, indent=2)
    
    def get_recent_emails(self, minutes=30):
        """Get emails from last N minutes"""
        try:
            # Get emails from the last period
            after_timestamp = int((datetime.now() - timedelta(minutes=minutes)).timestamp())
            query = f'after:{after_timestamp}'
            
            results = self.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=50
            ).execute()
            
            messages = results.get('messages', [])
            
            emails = []
            for message in messages:
                msg_data = self._get_message_details(message['id'])
                if msg_data:
                    emails.append(msg_data)
            
            return emails
        except Exception as e:
            print(f"❌ Error fetching emails: {e}")
            return []
    
    def _get_message_details(self, msg_id):
        """Get full message details"""
        try:
            msg = self.service.users().messages().get(
                userId='me',
                id=msg_id,
                format='full'
            ).execute()
            
            headers = msg['payload']['headers']
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), '')
            sender = next((h['value'] for h in headers if h['name'] == 'From'), '')
            to = next((h['value'] for h in headers if h['name'] == 'To'), '')
            date = next((h['value'] for h in headers if h['name'] == 'Date'), '')
            
            # Get body
            body = self._get_message_body(msg)
            
            return {
                'id': msg_id,
                'subject': subject,
                'sender': sender,
                'to': to,
                'date': date,
                'body': body,
                'thread_id': msg['threadId']
            }
        except Exception as e:
            print(f"Error getting message {msg_id}: {e}")
            return None
    
    def _get_message_body(self, message):
        """Extract body from message"""
        try:
            if 'parts' in message['payload']:
                parts = message['payload']['parts']
                body = ''
                for part in parts:
                    if part['mimeType'] == 'text/plain':
                        if 'data' in part['body']:
                            body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                            break
                return body
            elif 'body' in message['payload'] and 'data' in message['payload']['body']:
                return base64.urlsafe_b64decode(message['payload']['body']['data']).decode('utf-8')
        except:
            pass
        return ''
    
    def load_dnc_list(self):
        """Load do-not-contact list"""
        try:
            with open('data/massdwell/sales/do-not-contact-list.json', 'r') as f:
                dnc_data = json.load(f)
                return [contact['email'].lower() for contact in dnc_data.get('contacts', [])]
        except:
            return []

    def classify_intent(self, email):
        """Classify email intent based on content"""
        # Check DNC list first
        dnc_list = self.load_dnc_list()
        sender_email = email['sender'].lower().split('<')[-1].strip('>')
        
        if sender_email in dnc_list:
            self.log(f"⏭️ SKIPPING {sender_email} (on do-not-contact list)")
            return None, None
        
        subject = email['subject'].lower()
        body = email['body'].lower()
        sender = email['sender'].lower()
        
        combined_text = f"{subject} {body}"
        
        # Check for sales leads (MASSDWELL)
        massdwell_keywords = ['adu', 'accessory dwelling', 'modular home', 'prefab', 'pricing', 'quote', 'inquiry', 'interested', 'demo']
        if any(kw in combined_text for kw in massdwell_keywords):
            return 'SALES_LEAD', 'P0'
        
        # Check for laser sales (ATLANTIC LASER)
        laser_keywords = ['laser weld', 'welding', 'machine', 'equipment', 'pricing', 'quote', 'demo', 'interested']
        if any(kw in combined_text for kw in laser_keywords):
            return 'SALES_LEAD', 'P0'
        
        # Check for support
        support_keywords = ['issue', 'problem', 'broken', 'not working', 'help', 'support', 'delivery', 'status', 'technical']
        if any(kw in combined_text for kw in support_keywords):
            return 'CUSTOMER_SUPPORT', 'P1'
        
        # Check for vendor/shipping
        vendor_keywords = ['shipping', 'carrier', 'supplier', 'invoice', 'order status', 'delivery']
        if any(kw in combined_text for kw in vendor_keywords) and 'no-reply' not in sender and '@' in sender:
            return 'VENDOR', 'P2'
        
        # Check for finance/legal (strict - must have multiple indicators)
        finance_keywords = ['invoice', 'payment', 'banking', 'wire', 'ach', 'tax', 'refund']
        finance_count = sum(1 for kw in finance_keywords if kw in combined_text)
        if finance_count >= 2:  # Must have 2+ finance keywords
            return 'FINANCE_OR_LEGAL', 'P0'
        
        # Check for newsletters/marketing
        marketing_keywords = ['unsubscribe', 'newsletter', 'promotion', 'deal', 'offer', 'discount']
        if any(kw in combined_text for kw in marketing_keywords):
            return 'NEWSLETTER_OR_MARKETING', 'P2'
        
        # Check for spam
        if 'no-reply' in sender or 'noreply' in sender:
            return 'NEWSLETTER_OR_MARKETING', 'P2'
        
        # Default
        return 'GENERAL', 'P1'
    
    def apply_labels(self, msg_id, intent, priority):
        """Apply labels to message"""
        labels_map = {
            'SALES_LEAD': ['NEW_LEAD', 'ACTION_TODAY'],
            'CUSTOMER_SUPPORT': ['ACTION_REQUIRED'],
            'VENDOR': ['VENDOR'],
            'FINANCE_OR_LEGAL': ['ESCALATE', 'SENSITIVE'],
            'NEWSLETTER_OR_MARKETING': ['READ_LATER'],
            'GENERAL': ['ACTION_TODAY']
        }
        
        labels_to_apply = labels_map.get(intent, [])
        
        try:
            # Get or create labels
            results = self.service.users().labels().list(userId='me').execute()
            existing_labels = {label['name']: label['id'] for label in results.get('labels', [])}
            
            label_ids = []
            for label_name in labels_to_apply:
                if label_name not in existing_labels:
                    # Create label
                    label_obj = {
                        'name': label_name,
                        'labelListVisibility': 'labelShow',
                        'messageListVisibility': 'show'
                    }
                    created = self.service.users().labels().create(userId='me', body=label_obj).execute()
                    label_ids.append(created['id'])
                else:
                    label_ids.append(existing_labels[label_name])
            
            # Apply labels
            if label_ids:
                self.service.users().messages().modify(
                    userId='me',
                    id=msg_id,
                    body={'addLabelIds': label_ids}
                ).execute()
            
            return label_ids
        except Exception as e:
            print(f"Error applying labels: {e}")
            return []
    
    def process_emails(self):
        """Main processing loop"""
        print(f"\n📧 EMAIL INTENT CLASSIFIER - {self.account_email}")
        print(f"   Time: {datetime.now().isoformat()}")
        print("")
        
        emails = self.get_recent_emails(minutes=30)
        
        if not emails:
            print("   No new emails found")
            return {'processed': 0, 'leads': 0, 'support': 0}
        
        print(f"   Found {len(emails)} emails")
        print("")
        
        stats = {'processed': 0, 'leads': 0, 'support': 0, 'vendor': 0, 'finance': 0, 'marketing': 0}
        
        for email in emails:
            intent, priority = self.classify_intent(email)
            labels = self.apply_labels(email['id'], intent, priority)
            
            # Log
            log_entry = {
                'timestamp': datetime.now().isoformat(),
                'email_id': email['id'],
                'sender': email['sender'],
                'subject': email['subject'],
                'intent': intent,
                'priority': priority,
                'labels': labels,
                'confidence': 0.85
            }
            self.log['emails'].append(log_entry)
            
            # Print result
            print(f"   ✓ {email['subject'][:50]}")
            print(f"     Intent: {intent} | Priority: {priority}")
            
            stats['processed'] += 1
            if intent == 'SALES_LEAD':
                stats['leads'] += 1
            elif intent == 'CUSTOMER_SUPPORT':
                stats['support'] += 1
            elif intent == 'VENDOR':
                stats['vendor'] += 1
            elif intent == 'FINANCE_OR_LEGAL':
                stats['finance'] += 1
            elif intent == 'NEWSLETTER_OR_MARKETING':
                stats['marketing'] += 1
        
        self.save_log()
        
        print(f"\n📊 SUMMARY:")
        print(f"   Processed: {stats['processed']}")
        print(f"   Sales Leads: {stats['leads']}")
        print(f"   Support: {stats['support']}")
        print(f"   Vendor: {stats['vendor']}")
        print(f"   Finance: {stats['finance']}")
        print(f"   Marketing: {stats['marketing']}")
        
        return stats

if __name__ == '__main__':
    accounts = [
        'vettoristeve@gmail.com',
        'sales@massdwell.com',
        'team@atlanticlasersolutions.com'
    ]
    
    for account in accounts:
        try:
            classifier = EmailIntentClassifier(account)
            classifier.process_emails()
        except Exception as e:
            print(f"❌ Error processing {account}: {e}")
