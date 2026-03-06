#!/usr/bin/env python3
"""
Gmail Cleanup Script - Python Direct API Version
Cleans promotions, social, newsletters, and spam from personal Gmail account
Uses direct Gmail API calls to bypass GOG authentication issues
"""

import json
import sys
import requests
from datetime import datetime
from pathlib import Path

# Use personal Gmail token (steve.vettori@gmail.com)
TOKEN_PATH = Path.home() / '.openclaw/workspace/credentials/google/gmail-token-steve.vettori.json'
CREDENTIALS_PATH = Path.home() / '.openclaw/workspace/credentials/google/gmail-oauth-credentials.json'

def refresh_token():
    """Refresh expired access token"""
    with open(TOKEN_PATH, 'r') as f:
        token_data = json.load(f)
    
    with open(CREDENTIALS_PATH, 'r') as f:
        creds = json.load(f)
        client_data = creds.get('installed', creds.get('web', creds))
    
    # Refresh the token
    refresh_url = 'https://oauth2.googleapis.com/token'
    payload = {
        'client_id': client_data['client_id'],
        'client_secret': client_data['client_secret'],
        'refresh_token': token_data['refresh_token'],
        'grant_type': 'refresh_token'
    }
    
    response = requests.post(refresh_url, data=payload)
    response.raise_for_status()
    new_token_data = response.json()
    
    # Update token file
    token_data['access_token'] = new_token_data['access_token']
    token_data['expires_in'] = new_token_data.get('expires_in', 3600)
    
    with open(TOKEN_PATH, 'w') as f:
        json.dump(token_data, f, indent=2)
    
    print("🔄 Token refreshed successfully")
    return token_data['access_token']

def get_gmail_headers():
    """Get Gmail API headers with access token (token should be pre-refreshed)"""
    with open(TOKEN_PATH, 'r') as f:
        token_data = json.load(f)
    
    return {
        'Authorization': f"Bearer {token_data['access_token']}",
        'Content-Type': 'application/json'
    }

class GmailCleaner:
    """Direct Gmail API cleanup using OAuth"""
    
    def __init__(self, email="vettoristeve@gmail.com"):
        self.email = email
        self.api_url = "https://www.googleapis.com/gmail/v1/users/me"
        try:
            self.headers = get_gmail_headers()
        except Exception as e:
            print(f"❌ Failed to load Gmail token: {e}")
            print(f"   Token path: {TOKEN_PATH}")
            raise
        self.results = {
            'archived': 0,
            'trashed': 0,
            'kept': 0
        }
    
    def search_messages(self, query, max_results=50):
        """Search for messages matching query"""
        search_url = f"{self.api_url}/messages"
        params = {
            'q': query,
            'maxResults': max_results
        }
        
        try:
            response = requests.get(search_url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get('messages', [])
        except requests.exceptions.RequestException as e:
            print(f"❌ Search error: {e}")
            return []
    
    def modify_message(self, message_id, labels_to_add=None, labels_to_remove=None):
        """Modify message labels"""
        modify_url = f"{self.api_url}/messages/{message_id}/modify"
        payload = {}
        
        if labels_to_add:
            payload['addLabelIds'] = labels_to_add
        if labels_to_remove:
            payload['removeLabelIds'] = labels_to_remove
        
        try:
            response = requests.post(
                modify_url,
                headers=self.headers,
                json=payload
            )
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            print(f"❌ Modify error for {message_id}: {e}")
            return False
    
    def trash_messages(self, query, category_name):
        """Find and trash messages matching query"""
        print(f"🔍 Searching for {category_name}...")
        messages = self.search_messages(query)
        
        if not messages:
            print(f"   → No {category_name} found")
            return
        
        count = 0
        for msg in messages:
            # Add TRASH label, remove INBOX
            if self.modify_message(
                msg['id'],
                labels_to_add=['TRASH'],
                labels_to_remove=['INBOX']
            ):
                count += 1
        
        self.results['trashed'] += count
        print(f"   ✅ Trashed {count} {category_name}")
    
    def run(self):
        """Execute cleanup"""
        print(f"📧 Gmail Cleanup Started - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"   Account: {self.email}\n")
        
        # Cleanup queries
        cleanup_queries = [
            ("in:inbox category:promotions", "promotional emails"),
            ("in:inbox category:social", "social notifications"),
            ("in:inbox category:updates", "update notifications"),
            ("in:inbox from:noreply", "no-reply emails"),
            ("in:inbox from:newsletter", "newsletters"),
            ("in:inbox (from:unsubscribe OR subject:unsubscribe)", "marketing emails"),
        ]
        
        # Run cleanup
        for query, description in cleanup_queries:
            self.trash_messages(query, description)
        
        # Report results
        print(f"\n📊 Cleanup Results:")
        print(f"   Trashed:  {self.results['trashed']} messages")
        print(f"   Archived: {self.results['archived']} messages")
        print(f"   Kept:     {self.results['kept']} messages")
        print(f"\n✅ Gmail cleanup complete!")
        
        return self.results


if __name__ == '__main__':
    try:
        cleaner = GmailCleaner()
        results = cleaner.run()
        sys.exit(0)
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        sys.exit(1)
