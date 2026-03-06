#!/usr/bin/env python3
"""Pipedrive CRM integration for Atlantic Laser Sales"""

import json
import requests
from pathlib import Path
from datetime import datetime

WORKSPACE = Path.home() / '.openclaw/workspace'
CREDS_PATH = WORKSPACE / 'credentials/pipedrive/api-token.json'

def load_credentials():
    """Load Pipedrive API credentials"""
    with open(CREDS_PATH) as f:
        return json.load(f)

def create_deal(prospect, email_sent=False):
    """Create a new deal in Pipedrive for a prospect"""
    creds = load_credentials()
    
    # Check if person already exists
    existing_person_id = search_person_by_email(prospect['email'])
    
    if existing_person_id:
        person_id = existing_person_id
    else:
        # Create person first
        person_data = {
            'name': prospect['name'],
            'email': prospect['email']
        }
        
        person_response = requests.post(
            f"{creds['base_url']}/persons",
            params={'api_token': creds['api_token']},
            json=person_data
        )
        
        if person_response.status_code != 201:
            error_msg = person_response.json().get('error', 'Unknown error')
            return {'success': False, 'error': f'Failed to create person: {error_msg}'}
        
        person_id = person_response.json()['data']['id']
    
    # Create deal
    deal_title = f"{prospect['company']} - Theo Laser Demo"
    
    deal_data = {
        'title': deal_title,
        'person_id': person_id,
        'value': 25000,  # Average deal size for laser welder
        'currency': 'USD',
        'api_token': creds['api_token']
    }
    
    deal_response = requests.post(
        f"{creds['base_url']}/deals",
        params={'api_token': creds['api_token']},
        json=deal_data
    )
    
    if deal_response.status_code != 201:
        return {'success': False, 'error': 'Failed to create deal'}
    
    deal_id = deal_response.json()['data']['id']
    
    # Log activity if email was sent
    if email_sent:
        activity_data = {
            'subject': f"Cold email sent: 4x Faster Welding for {prospect['company']}",
            'done': 1,
            'type': 'email',
            'deal_id': deal_id,
            'person_id': person_id,
            'api_token': creds['api_token']
        }
        
        requests.post(
            f"{creds['base_url']}/activities",
            params={'api_token': creds['api_token']},
            json=activity_data
        )
    
    return {
        'success': True,
        'deal_id': deal_id,
        'person_id': person_id,
        'deal_title': deal_title
    }

def log_activity(deal_id, person_id, subject, note=''):
    """Log an activity for a deal"""
    creds = load_credentials()
    
    activity_data = {
        'subject': subject,
        'note': note,
        'done': 1,
        'type': 'email',
        'deal_id': deal_id,
        'person_id': person_id,
        'api_token': creds['api_token']
    }
    
    response = requests.post(
        f"{creds['base_url']}/activities",
        params={'api_token': creds['api_token']},
        json=activity_data
    )
    
    return response.status_code == 201

def update_deal_stage(deal_id, stage):
    """Update deal stage (e.g., 'Demo Scheduled', 'Quote Sent')"""
    creds = load_credentials()
    
    # Map stages to Pipedrive stage IDs (would need to be configured per account)
    stage_map = {
        'cold_email_sent': 1,
        'responded': 2,
        'demo_scheduled': 3,
        'quote_sent': 4,
        'closed_won': 5,
        'closed_lost': 6
    }
    
    stage_id = stage_map.get(stage, 1)
    
    response = requests.put(
        f"{creds['base_url']}/deals/{deal_id}",
        params={'api_token': creds['api_token']},
        json={'stage_id': stage_id}
    )
    
    return response.status_code == 200

def search_person_by_email(email):
    """Search for existing person by email"""
    creds = load_credentials()
    
    response = requests.get(
        f"{creds['base_url']}/persons/search",
        params={
            'term': email,
            'fields': 'email',
            'api_token': creds['api_token']
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        if data.get('data') and data['data'].get('items'):
            return data['data']['items'][0]['item']['id']
    
    return None

if __name__ == '__main__':
    # Test
    print('Testing Pipedrive integration...')
    
    test_prospect = {
        'name': 'Test Manager',
        'company': 'Test Fabrication Co',
        'email': 'test@example.com',
        'type': 'fabrication',
        'location': 'Boston, MA'
    }
    
    result = create_deal(test_prospect, email_sent=True)
    
    if result['success']:
        print(f"✅ Deal created: {result['deal_title']}")
        print(f"   Deal ID: {result['deal_id']}")
        print(f"   Person ID: {result['person_id']}")
    else:
        print(f"❌ Failed: {result.get('error')}")
