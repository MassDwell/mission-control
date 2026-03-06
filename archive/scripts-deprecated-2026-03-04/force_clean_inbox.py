#!/usr/bin/env python3
import sys
sys.path.insert(0, '.')
from gmail_auth_handler import get_gmail_access_token
import requests

token = get_gmail_access_token()

KEEP = ['hikemike72@yahoo.com', 'bethdaunis@gmail.com', 'elizabugandcody@gmail.com', 
        'parsonspaige17@gmail.com', 'futurelot.com']

total = 0
for batch in range(100):
    resp = requests.get(
        'https://www.googleapis.com/gmail/v1/users/me/messages',
        headers={'Authorization': f'Bearer {token}'},
        params={'labelIds': 'INBOX', 'maxResults': 100}
    ).json()
    
    msgs = resp.get('messages', [])
    if not msgs:
        break
    
    for msg in msgs:
        detail = requests.get(
            f'https://www.googleapis.com/gmail/v1/users/me/messages/{msg["id"]}',
            headers={'Authorization': f'Bearer {token}'},
            params={'format': 'metadata', 'metadataHeaders': ['From']}
        ).json()
        
        sender = ''
        for h in detail.get('payload', {}).get('headers', []):
            if h.get('name') == 'From':
                sender = h.get('value', '').lower()
                break
        
        keep = any(k in sender for k in KEEP)
        
        if not keep:
            requests.post(
                f'https://www.googleapis.com/gmail/v1/users/me/messages/{msg["id"]}/trash',
                headers={'Authorization': f'Bearer {token}'}
            )
            total += 1
    
    print(f'{total} trashed so far...', flush=True)

print(f'DONE: {total} total trashed')
