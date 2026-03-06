#!/usr/bin/env python3
"""
Bounced Email Handler
Automatically archives bounce notifications and marks leads as Closed Lost in Kommo
Run daily via cron
"""

import json
import requests
import re
from pathlib import Path
from datetime import datetime

# Paths
GMAIL_TOKEN = Path.home() / '.openclaw/workspace/credentials/google/gmail-token-sales-fixed.json'
KOMMO_DATA = Path.home() / '.openclaw/workspace/crm-dashboard/data/leads.json'
LOG_FILE = Path.home() / '.openclaw/workspace/scripts/bounced_emails.log'

def log(message):
    """Log to file and stdout"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_msg = f"[{timestamp}] {message}"
    print(log_msg)
    with open(LOG_FILE, 'a') as f:
        f.write(log_msg + '\n')

def get_gmail_headers():
    """Get Gmail API headers"""
    with open(GMAIL_TOKEN, 'r') as f:
        token = json.load(f)
    return {
        'Authorization': f"Bearer {token['access_token']}",
        'Content-Type': 'application/json'
    }

def extract_email_from_text(text):
    """Extract email address from bounce notification text"""
    match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
    return match.group(0) if match else None

def find_bounced_emails():
    """Find bounce notifications in Gmail"""
    headers = get_gmail_headers()
    
    # Search for bounce emails from last 7 days
    query = 'from:mailer-daemon OR from:postmaster OR subject:"Delivery Status Notification" OR subject:"Undelivered Mail" OR subject:"Mail Delivery Failed" newer_than:7d'
    
    response = requests.get(
        'https://www.googleapis.com/gmail/v1/users/me/messages',
        headers=headers,
        params={'q': query, 'maxResults': 100}
    )
    
    if response.status_code != 200:
        log(f"❌ Failed to fetch bounces: {response.status_code}")
        return []
    
    bounce_msgs = response.json().get('messages', [])
    log(f"📬 Found {len(bounce_msgs)} bounce notifications")
    
    bounces = []
    for msg in bounce_msgs:
        # Get message details
        msg_resp = requests.get(
            f"https://www.googleapis.com/gmail/v1/users/me/messages/{msg['id']}",
            headers=headers,
            params={'format': 'full'}
        )
        
        if msg_resp.status_code == 200:
            msg_data = msg_resp.json()
            snippet = msg_data.get('snippet', '')
            
            # Extract bounced email
            bounced_email = extract_email_from_text(snippet)
            
            if bounced_email:
                bounces.append({
                    'message_id': msg['id'],
                    'email': bounced_email.lower(),
                    'snippet': snippet[:100]
                })
    
    return bounces

def archive_bounce(message_id):
    """Archive a bounce notification (remove from INBOX)"""
    headers = get_gmail_headers()
    
    response = requests.post(
        f"https://www.googleapis.com/gmail/v1/users/me/messages/{message_id}/modify",
        headers=headers,
        json={'removeLabelIds': ['INBOX']}
    )
    
    return response.status_code == 200

def find_lead_in_kommo(email):
    """Find lead in Kommo CRM by email"""
    if not KOMMO_DATA.exists():
        return None
    
    with open(KOMMO_DATA, 'r') as f:
        data = json.load(f)
    
    leads = data.get('leads', [])
    for lead in leads:
        lead_email = lead.get('contact', {}).get('email', '').lower()
        if lead_email == email:
            return lead
    
    return None

def update_lead_to_closed_lost(lead_id, email):
    """
    Update lead status to Closed Lost in Kommo
    NOTE: This creates a log entry. Actual Kommo API update requires write permissions.
    """
    log(f"📋 Lead {lead_id} ({email}) should be moved to Closed Lost")
    
    # TODO: Implement Kommo API write call when write permissions are granted
    # For now, log the action for manual review
    
    action_log = Path.home() / '.openclaw/workspace/data/massdwell/sales/crm-action-log.json'
    
    action = {
        'timestamp': datetime.now().isoformat(),
        'action': 'SHOULD_UPDATE',
        'lead_id': lead_id,
        'email': email,
        'new_status': 'Closed Lost',
        'reason': 'Email bounced',
        'manual_action_required': True
    }
    
    # Append to action log
    actions = []
    if action_log.exists():
        with open(action_log, 'r') as f:
            actions = json.load(f)
    
    actions.append(action)
    
    action_log.parent.mkdir(parents=True, exist_ok=True)
    with open(action_log, 'w') as f:
        json.dump(actions, f, indent=2)
    
    return True

def main():
    log("🔄 Starting bounced email handler...")
    
    # Find bounces
    bounces = find_bounced_emails()
    
    if not bounces:
        log("✅ No new bounces found")
        return
    
    archived_count = 0
    updated_count = 0
    
    for bounce in bounces:
        email = bounce['email']
        message_id = bounce['message_id']
        
        # Archive the bounce
        if archive_bounce(message_id):
            archived_count += 1
            log(f"✅ Archived bounce for: {email}")
        else:
            log(f"❌ Failed to archive bounce for: {email}")
            continue
        
        # Find and update lead in CRM
        lead = find_lead_in_kommo(email)
        if lead:
            lead_id = lead.get('id')
            lead_name = lead.get('name', 'Unknown')
            
            if update_lead_to_closed_lost(lead_id, email):
                updated_count += 1
                log(f"📝 Queued CRM update for: {lead_name} ({email})")
        else:
            log(f"ℹ️ No CRM lead found for: {email}")
    
    log(f"\n✅ Summary: {archived_count} bounces archived, {updated_count} CRM updates queued")

if __name__ == '__main__':
    main()
