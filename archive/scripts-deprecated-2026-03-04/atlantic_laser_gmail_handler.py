#!/usr/bin/env python3
"""Gmail handler for Atlantic Laser Sales - team@atlanticlasersolutions.com"""

import json
import sys
from pathlib import Path
import requests
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

sys.path.insert(0, str(Path(__file__).parent / 'lib'))
from dnc_check import is_dnc

WORKSPACE = Path.home() / '.openclaw/workspace'
TOKEN_PATH = WORKSPACE / 'credentials/google/gmail-token-atlantic-laser.json'

def get_access_token():
    """Get fresh Gmail access token for Atlantic Laser"""
    token_data = json.load(open(TOKEN_PATH))
    return token_data['access_token']

def send_email(to_email, subject, body_html, body_text=None):
    """Send email via Gmail API"""
    # DNC check — ultimate safety net at the send layer
    if is_dnc(to_email, 'atlantic_laser_gmail_handler'):
        return {'success': False, 'error': 'Blocked by do-not-contact list'}

    token = get_access_token()
    
    # Create message
    msg = MIMEMultipart('alternative')
    msg['From'] = 'team@atlanticlasersolutions.com'
    msg['To'] = to_email
    msg['Subject'] = subject
    
    # Add text and HTML versions
    if body_text:
        msg.attach(MIMEText(body_text, 'plain'))
    msg.attach(MIMEText(body_html, 'html'))
    
    # Encode and send
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    
    response = requests.post(
        'https://www.googleapis.com/gmail/v1/users/me/messages/send',
        headers={'Authorization': f'Bearer {token}'},
        json={'raw': raw}
    )
    
    if response.status_code == 200:
        return {'success': True, 'message_id': response.json().get('id')}
    else:
        return {'success': False, 'error': response.text}

def check_inbox(max_results=20):
    """Check inbox for new messages"""
    token = get_access_token()
    
    response = requests.get(
        'https://www.googleapis.com/gmail/v1/users/me/messages',
        headers={'Authorization': f'Bearer {token}'},
        params={'labelIds': 'INBOX', 'maxResults': max_results}
    )
    
    if response.status_code != 200:
        return []
    
    messages = response.json().get('messages', [])
    
    # Get details for each message
    results = []
    for msg in messages:
        detail = requests.get(
            f'https://www.googleapis.com/gmail/v1/users/me/messages/{msg["id"]}',
            headers={'Authorization': f'Bearer {token}'},
            params={'format': 'metadata', 'metadataHeaders': ['From', 'Subject', 'Date']}
        ).json()
        
        headers = {h['name']: h['value'] for h in detail.get('payload', {}).get('headers', [])}
        
        results.append({
            'id': msg['id'],
            'from': headers.get('From', ''),
            'subject': headers.get('Subject', ''),
            'date': headers.get('Date', '')
        })
    
    return results

if __name__ == '__main__':
    # Test
    print('Testing Atlantic Laser Gmail access...')
    inbox = check_inbox(5)
    print(f'✅ Found {len(inbox)} messages')
    for msg in inbox:
        print(f'  - {msg["subject"][:50]} from {msg["from"][:30]}')
