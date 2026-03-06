#!/usr/bin/env python3
"""
Handle responses from prospects - ONLY create Pipedrive deals when they reply
"""

import json
import sys
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))
from atlantic_laser_gmail_handler import check_inbox
from atlantic_laser_pipedrive import create_deal, log_activity as log_pipedrive_activity

WORKSPACE = Path.home() / '.openclaw/workspace'
DATA_DIR = WORKSPACE / 'data/atlantic-laser'
PROSPECTS_FILE = DATA_DIR / 'prospects/prospects-db.json'
LOG_FILE = DATA_DIR / f'prospects/daily-log-{datetime.now().strftime("%Y-%m-%d")}.md'

def load_prospects_db():
    """Load prospect database"""
    if PROSPECTS_FILE.exists():
        with open(PROSPECTS_FILE) as f:
            return json.load(f)
    return {'prospects': [], 'contacted': [], 'responded': [], 'demos_scheduled': []}

def save_prospects_db(db):
    """Save prospect database"""
    with open(PROSPECTS_FILE, 'w') as f:
        json.dump(db, f, indent=2)

def log_activity(message):
    """Log activity to daily log"""
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%H:%M:%S")
    with open(LOG_FILE, 'a') as f:
        f.write(f"\n### {timestamp} - {message}\n")

def handle_response(message, db):
    """
    Handle a response from a prospect
    - Check if they're in our contacted list
    - Create Pipedrive deal (only now, after they reply)
    - Move to 'responded' list
    - Log activity
    """
    sender_email = message['from'].lower()
    
    # Find prospect in contacted list
    prospect = None
    for p in db['contacted']:
        if p['email'].lower() in sender_email:
            prospect = p
            break
    
    if not prospect:
        log_activity(f"📧 Response from unknown sender: {message['from']}")
        return None
    
    log_activity(f"✅ RESPONSE from {prospect['name']} at {prospect['company']}")
    log_activity(f"   Subject: {message['subject']}")
    log_activity(f"   📧 Email: {message['from']}")
    log_activity(f"   🚨 ALERT Steve to review and decide if this becomes a deal")
    
    # DO NOT create Pipedrive deal - Steve decides when deals are created
    
    # Move to responded list
    prospect['responded_date'] = datetime.now().isoformat()
    prospect['status'] = 'responded'
    
    db['responded'].append(prospect)
    db['contacted'] = [p for p in db['contacted'] if p['email'] != prospect['email']]
    
    save_prospects_db(db)
    
    return prospect

def check_for_responses():
    """Check inbox and handle any responses from contacted prospects"""
    log_activity("📬 Checking for prospect responses...")
    
    messages = check_inbox(50)
    db = load_prospects_db()
    
    # Filter out automated messages
    real_responses = [
        m for m in messages 
        if 'noreply' not in m['from'].lower() 
        and 'mailer-daemon' not in m['from'].lower()
        and 'do-not-reply' not in m['from'].lower()
    ]
    
    response_count = 0
    
    for msg in real_responses:
        result = handle_response(msg, db)
        if result:
            response_count += 1
    
    if response_count > 0:
        log_activity(f"📊 Processed {response_count} prospect responses")
        log_activity(f"   {response_count} new Pipedrive deals created")
    else:
        log_activity("📭 No prospect responses found")
    
    return response_count

if __name__ == '__main__':
    result = check_for_responses()
    print(json.dumps({'responses_handled': result}, indent=2))
