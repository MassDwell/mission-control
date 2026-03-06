#!/usr/bin/env python3
"""
Atlantic Laser Prospector - Pull leads from existing Pipedrive database
Uses the 3,000+ contacts already in Pipedrive instead of scraping
"""

import json
import requests
from pathlib import Path
from datetime import datetime

WORKSPACE = Path.home() / '.openclaw/workspace'
CREDS_PATH = WORKSPACE / 'credentials/pipedrive/api-token.json'
CONTACTED_LOG = WORKSPACE / 'data/atlantic-laser/prospects/pipedrive-contacted.json'

def load_credentials():
    """Load Pipedrive API credentials"""
    with open(CREDS_PATH) as f:
        return json.load(f)

def get_contacted_log():
    """Load list of already-contacted Pipedrive person IDs"""
    if CONTACTED_LOG.exists():
        with open(CONTACTED_LOG) as f:
            return json.load(f)
    return {'contacted_ids': [], 'contacted_emails': []}

def save_contacted_log(log):
    """Save contacted log"""
    CONTACTED_LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(CONTACTED_LOG, 'w') as f:
        json.dump(log, f, indent=2)

def fetch_pipedrive_leads(limit=100, offset=0):
    """Fetch leads from Pipedrive"""
    creds = load_credentials()
    
    response = requests.get(
        f"{creds['base_url']}/persons",
        params={
            'api_token': creds['api_token'],
            'limit': limit,
            'start': offset
        }
    )
    
    if response.status_code != 200:
        return []
    
    data = response.json()
    return data.get('data', [])

def filter_valid_prospects(persons):
    """
    Filter Pipedrive persons for valid Atlantic Laser prospects
    
    Criteria:
    - Has valid email address
    - Has company name
    - Not already contacted
    - Looks like a potential fabrication/manufacturing/welding company
    """
    contacted_log = get_contacted_log()
    valid = []
    
    for person in persons:
        # Check if has email
        emails = person.get('email', [])
        if not emails or not emails[0].get('value'):
            continue
        
        email = emails[0]['value']
        person_id = person['id']
        
        # Skip if already contacted
        if person_id in contacted_log['contacted_ids']:
            continue
        if email in contacted_log['contacted_emails']:
            continue
        
        # Check if has company
        org_name = person.get('org_name')
        if not org_name:
            continue
        
        # Optional: Filter by company type (fabrication, welding, manufacturing, etc.)
        # For now, include all contacts with email + company
        
        valid.append({
            'pipedrive_id': person_id,
            'name': person.get('name', 'Contact'),
            'email': email,
            'company': org_name,
            'phone': person.get('phone', [{}])[0].get('value', ''),
            'location': person.get('postal_address_locality', 'Unknown')
        })
    
    return valid

def identify_prospects_from_pipedrive(count=20):
    """
    Pull N prospects from Pipedrive database
    Returns list of prospects ready for outreach
    """
    all_prospects = []
    offset = 0
    batch_size = 100
    
    # Keep fetching until we have enough valid prospects
    while len(all_prospects) < count:
        batch = fetch_pipedrive_leads(limit=batch_size, offset=offset)
        
        if not batch:
            break  # No more leads
        
        valid = filter_valid_prospects(batch)
        all_prospects.extend(valid)
        
        offset += batch_size
        
        # Safety limit - don't fetch more than 1000 at once
        if offset >= 1000:
            break
    
    return all_prospects[:count]

def mark_as_contacted(prospect):
    """Mark a prospect as contacted in the log"""
    log = get_contacted_log()
    
    log['contacted_ids'].append(prospect['pipedrive_id'])
    log['contacted_emails'].append(prospect['email'])
    
    save_contacted_log(log)

def get_stats():
    """Get statistics on Pipedrive prospecting"""
    creds = load_credentials()
    
    # Get total persons
    response = requests.get(
        f"{creds['base_url']}/persons",
        params={'api_token': creds['api_token'], 'limit': 1}
    )
    
    data = response.json()
    total_persons = data.get('additional_data', {}).get('pagination', {}).get('more_items_in_collection', False)
    
    # Get contacted count
    log = get_contacted_log()
    contacted = len(log['contacted_ids'])
    
    return {
        'total_in_pipedrive': 'Checking...',
        'contacted': contacted,
        'remaining': 'Calculating...'
    }

if __name__ == '__main__':
    print('🔍 Fetching prospects from Pipedrive...')
    print()
    
    prospects = identify_prospects_from_pipedrive(20)
    
    print(f'✅ Found {len(prospects)} valid prospects:')
    print()
    
    for i, p in enumerate(prospects[:10], 1):
        print(f'{i}. {p["name"]} at {p["company"]}')
        print(f'   Email: {p["email"]}')
        print(f'   Location: {p["location"]}')
        print()
    
    stats = get_stats()
    print(f'📊 Stats:')
    print(f'   Contacted so far: {stats["contacted"]}')
    print(f'   Available in Pipedrive: {stats["total_in_pipedrive"]}')
