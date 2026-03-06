#!/usr/bin/env python3
"""
Gmail OAuth Token Auto-Refresh Handler
Automatically refreshes expired tokens before making API calls
"""

import json
import time
import requests
from pathlib import Path
from datetime import datetime, timedelta

WORKSPACE = Path.home() / '.openclaw/workspace'
TOKEN_PATH = WORKSPACE / 'credentials/google/gmail-token-sales-fixed.json'
CREDENTIALS_PATH = WORKSPACE / 'credentials/google/gmail-oauth-credentials.json'

class GmailAuthHandler:
    """Handles Gmail OAuth with automatic token refresh"""
    
    def __init__(self, token_path=TOKEN_PATH, credentials_path=CREDENTIALS_PATH):
        self.token_path = token_path
        self.credentials_path = credentials_path
        self.token_data = None
        self.credentials = None
        self.last_refresh = None
        self._load_credentials()
    
    def _load_credentials(self):
        """Load OAuth credentials"""
        with open(self.credentials_path, 'r') as f:
            creds = json.load(f)
            self.credentials = creds.get('installed', creds.get('web', creds))
    
    def _load_token(self):
        """Load current token from file"""
        with open(self.token_path, 'r') as f:
            self.token_data = json.load(f)
    
    def _save_token(self):
        """Save refreshed token to file"""
        with open(self.token_path, 'w') as f:
            json.dump(self.token_data, f, indent=2)
    
    def _is_token_expired(self):
        """Check if access token is expired or about to expire"""
        if not self.token_data:
            return True
        
        # If we just refreshed in the last 30 minutes, assume it's still good
        if self.last_refresh and (datetime.now() - self.last_refresh).seconds < 1800:
            return False
        
        # Check expiry time if available
        expires_in = self.token_data.get('expires_in', 0)
        if expires_in and expires_in < 300:  # Less than 5 minutes left
            return True
        
        # If no expiry info, assume it needs refresh after 45 minutes
        # (Google tokens last 1 hour, we refresh at 45 min to be safe)
        if self.last_refresh and (datetime.now() - self.last_refresh).seconds > 2700:
            return True
        
        return False
    
    def _refresh_access_token(self):
        """Refresh the access token using refresh token"""
        if not self.token_data or 'refresh_token' not in self.token_data:
            raise Exception("No refresh_token available. Re-authentication required.")
        
        data = {
            'client_id': self.credentials['client_id'],
            'client_secret': self.credentials['client_secret'],
            'refresh_token': self.token_data['refresh_token'],
            'grant_type': 'refresh_token'
        }
        
        response = requests.post('https://oauth2.googleapis.com/token', data=data)
        
        if response.status_code != 200:
            raise Exception(f"Token refresh failed: {response.text}")
        
        new_token = response.json()
        
        if 'error' in new_token:
            raise Exception(f"OAuth error: {new_token['error']} - {new_token.get('error_description', '')}")
        
        # Update token data (keep refresh_token as it's not always returned)
        self.token_data['access_token'] = new_token['access_token']
        self.token_data['expires_in'] = new_token.get('expires_in', 3599)
        if 'refresh_token' in new_token:
            self.token_data['refresh_token'] = new_token['refresh_token']
        
        self._save_token()
        self.last_refresh = datetime.now()
        
        return self.token_data['access_token']
    
    def get_valid_access_token(self):
        """Get a valid access token, refreshing if necessary"""
        # Load current token if not already loaded
        if not self.token_data:
            self._load_token()
        
        # Check if token needs refresh
        if self._is_token_expired():
            print("🔄 Gmail token expired or expiring soon, refreshing...")
            self._refresh_access_token()
            print("✅ Gmail token refreshed successfully")
        
        return self.token_data['access_token']
    
    def get_gmail_headers(self):
        """Get headers with valid access token for Gmail API requests"""
        token = self.get_valid_access_token()
        return {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }


# Convenience function for quick usage
def get_gmail_access_token():
    """Get a valid Gmail access token (auto-refreshes if needed)"""
    handler = GmailAuthHandler()
    return handler.get_valid_access_token()


def get_gmail_headers():
    """Get Gmail API headers with valid token (auto-refreshes if needed)"""
    handler = GmailAuthHandler()
    return handler.get_gmail_headers()


if __name__ == '__main__':
    # Test the handler
    print("Testing Gmail Auth Handler...")
    try:
        handler = GmailAuthHandler()
        token = handler.get_valid_access_token()
        print(f"✅ Valid access token obtained: {token[:30]}...")
        print("✅ Gmail Auth Handler working correctly")
    except Exception as e:
        print(f"❌ Error: {e}")
