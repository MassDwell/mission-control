#!/usr/bin/env python3
"""Process bounced emails: archive in Gmail, mark leads as Closed Lost in Kommo"""

import json
import os
import sys
from pathlib import Path
import requests

sys.path.insert(0, str(Path(__file__).parent))
from gmail_auth_handler import get_gmail_access_token

# Paths
WORKSPACE = Path.home() / '.openclaw' / 'workspace'
BOUNCES_FILE = '/tmp/bounced_emails.json'
KOMMO_API_URL = 'http://localhost:8085/api/v4'
GMAIL_API_URL = 'https://www.googleapis.com/gmail/v1/users/me'

def archive_bounces(message_ids):
    """Archive bounce notification emails one by one"""
    archived_count = 0
    try:
        token = get_gmail_access_token()
        for msg_id in message_ids:
            try:
                response = requests.post(
                    f"{GMAIL_API_URL}/messages/{msg_id}/modify",
                    headers={'Authorization': f'Bearer {token}'},
                    json={'removeLabelIds': ['INBOX', 'UNREAD']}
                )
                if response.status_code in [200, 204]:
                    archived_count += 1
            except Exception as e:
                print(f"  ⚠️  Failed to archive {msg_id}: {e}")
        
        print(f"✅ Archived {archived_count}/{len(message_ids)} bounce notifications")
        return True
    except Exception as e:
        print(f"❌ Error archiving: {e}")
        return False

def load_kommo_leads():
    """Load leads from local CRM data"""
    try:
        with open(WORKSPACE / 'crm-dashboard/data/leads.json') as f:
            data = json.load(f)
            return data.get('leads', [])
    except Exception as e:
        print(f"❌ Error loading CRM data: {e}")
        return []

def search_kommo_by_email(email, all_leads):
    """Search Kommo for leads with matching email"""
    matches = []
    for lead in all_leads:
        if not lead:
            continue
        
        lead_emails = []
        custom_fields = lead.get('custom_fields_values')
        if custom_fields:
            for cf in custom_fields:
                if cf.get('field_code') == 'EMAIL':
                    values = cf.get('values', [])
                    if values:
                        for val in values:
                            if val and 'value' in val:
                                lead_emails.append(val['value'].lower())
        
        if email.lower() in lead_emails:
            matches.append(lead)
    
    return matches

def get_closed_lost_status_id(all_leads):
    """Find the Closed Lost status ID from existing leads"""
    for lead in all_leads:
        status = lead.get('status', {})
        if status and 'lost' in status.get('name', '').lower() and 'closed' in status.get('name', '').lower():
            return lead.get('pipeline_id'), lead.get('status_id')
    
    # Default fallback (Kommo standard)
    return 7854842, 143  # Common Closed Lost status

def log_bounce_action(email, lead_id, lead_name, reason):
    """Log bounce action to file for manual review"""
    log_file = WORKSPACE / 'data/massdwell/bounced_leads_log.json'
    
    try:
        if log_file.exists():
            with open(log_file) as f:
                log_data = json.load(f)
        else:
            log_data = []
        
        log_data.append({
            'timestamp': datetime.now().isoformat(),
            'email': email,
            'lead_id': lead_id,
            'lead_name': lead_name,
            'reason': reason,
            'action': 'MARK_CLOSED_LOST'
        })
        
        os.makedirs(log_file.parent, exist_ok=True)
        with open(log_file, 'w') as f:
            json.dump(log_data, f, indent=2)
        
        return True
    except Exception as e:
        print(f"❌ Error logging bounce: {e}")
        return False

def main():
    # Load bounced emails
    with open(BOUNCES_FILE) as f:
        bounces = json.load(f)
    
    # Get unique emails and message IDs
    unique_emails = list(set(b['bounced_email'] for b in bounces))
    message_ids = [b['message_id'] for b in bounces]
    
    print(f"📧 Processing {len(unique_emails)} unique bounced emails from {len(bounces)} bounce notifications")
    
    # Archive emails
    archive_bounces(message_ids)
    
    # Load all Kommo leads
    all_leads = load_kommo_leads()
    print(f"📊 Loaded {len(all_leads)} leads from CRM")
    
    # Get Closed Lost status info
    pipeline_id, status_id = get_closed_lost_status_id(all_leads)
    print(f"🎯 Using Closed Lost status: pipeline={pipeline_id}, status={status_id}")
    
    print(f"\n🔍 Searching Kommo and logging bounced leads...")
    
    logged_count = 0
    not_found_count = 0
    already_lost_count = 0
    
    for email in unique_emails:
        leads = search_kommo_by_email(email, all_leads)
        
        if not leads:
            print(f"⚪ {email} → Not found in Kommo")
            not_found_count += 1
            continue
        
        for lead in leads:
            lead_id = lead['id']
            lead_name = lead.get('name', 'Unnamed')
            current_status = lead.get('status', {}).get('name', 'Unknown')
            
            # Skip if already in Closed Lost
            if 'lost' in current_status.lower() and 'closed' in current_status.lower():
                print(f"⏭️  {email} → {lead_name} (already {current_status})")
                already_lost_count += 1
                continue
            
            # Find bounce reason
            bounce_reason = next((b['snippet'][:80] for b in bounces if b['bounced_email'] == email), 'Unknown')
            
            if log_bounce_action(email, lead_id, lead_name, bounce_reason):
                print(f"✅ {email} → {lead_name} (currently {current_status}) logged for Closed Lost")
                logged_count += 1
            else:
                print(f"❌ {email} → {lead_name} log failed")
    
    print(f"\n📊 Summary:")
    print(f"  • {logged_count} leads logged for Closed Lost update")
    print(f"  • {already_lost_count} leads already Closed Lost")
    print(f"  • {not_found_count} emails not found in Kommo")
    print(f"\n📝 Review log: {WORKSPACE}/data/massdwell/bounced_leads_log.json")
    print(f"  ⚠️  Manual action required: Update these leads in Kommo CRM")

if __name__ == '__main__':
    main()
