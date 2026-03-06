#!/usr/bin/env python3
"""
Atlantic Laser Sales Bot - Daily Prospecting Engine
Identifies fabrication shops, manufacturers, and welding companies in New England
"""

import json
import sys
from pathlib import Path
from datetime import datetime
import random

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent / 'lib'))
from atlantic_laser_gmail_handler import send_email, check_inbox
from atlantic_laser_pipedrive import create_deal, log_activity, search_person_by_email
from dnc_check import is_dnc, filter_dnc

WORKSPACE = Path.home() / '.openclaw/workspace'
DATA_DIR = WORKSPACE / 'data/atlantic-laser'
PROSPECTS_FILE = DATA_DIR / 'prospects/prospects-db.json'
LOG_FILE = DATA_DIR / f'prospects/daily-log-{datetime.now().strftime("%Y-%m-%d")}.md'

# Email templates
COLD_EMAIL_TEMPLATE = """
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
<p>Hi {name},</p>

<p>I'm reaching out from Atlantic Laser Solutions because I think your team at {company} could benefit from a technology that's revolutionizing metal fabrication.</p>

<p><strong>What if you could weld 4x faster while using 80% less energy?</strong></p>

<p>The Theo MA1 handheld laser welder is changing the game for fabrication shops across New England:</p>

<ul>
<li>✅ <strong>4x faster</strong> than traditional arc welding</li>
<li>✅ <strong>80% less energy</strong> than TIG/arc</li>
<li>✅ <strong>Minimal distortion</strong> - cleaner welds, less rework</li>
<li>✅ <strong>Train operators in hours</strong>, not weeks</li>
</ul>

<p>We're the authorized New England distributor for Theo Laser, and I'd love to show you how this technology could improve your operation.</p>

<p><strong>Would you be open to a quick 15-minute demo?</strong> (We can come to your shop or do it virtually)</p>

<p>Best regards,<br>
Atlantic Laser Solutions<br>
team@atlanticlasersolutions.com<br>
atlanticlasersolutions.com</p>

<p style="font-size: 11px; color: #666; margin-top: 20px;">
If you'd prefer not to receive future emails, just let me know.
</p>
</body>
</html>
"""

# Expanded prospect database (in production, this would come from a real source)
SAMPLE_PROSPECTS = [
    {"name": "Shop Manager", "company": "Boston Metal Fabrication", "email": "info@bostonmetal.example", "type": "fabrication", "location": "Boston, MA"},
    {"name": "Production Manager", "company": "New England Welding Co", "email": "contact@newenglandweld.example", "type": "welding", "location": "Providence, RI"},
    {"name": "Operations Director", "company": "Precision Metal Works", "email": "ops@precisionmetal.example", "type": "manufacturing", "location": "Manchester, NH"},
    {"name": "Plant Manager", "company": "Hartford Metal Works", "email": "manager@hartfordmetal.example", "type": "fabrication", "location": "Hartford, CT"},
    {"name": "Shop Foreman", "company": "Vermont Fabrication", "email": "shop@vermontfab.example", "type": "fabrication", "location": "Burlington, VT"},
    {"name": "Owner", "company": "Rhode Island Welding Supply", "email": "owner@riwelding.example", "type": "welding", "location": "Warwick, RI"},
    {"name": "Operations Manager", "company": "Cape Cod Metal Fabricators", "email": "ops@capecodmetal.example", "type": "fabrication", "location": "Hyannis, MA"},
    {"name": "Production Supervisor", "company": "Maine Industrial Welding", "email": "production@maineweld.example", "type": "welding", "location": "Portland, ME"},
    {"name": "Plant Supervisor", "company": "Worcester Precision Metals", "email": "supervisor@worcestermetal.example", "type": "manufacturing", "location": "Worcester, MA"},
    {"name": "Shop Owner", "company": "Springfield Metal Services", "email": "info@springfieldmetal.example", "type": "fabrication", "location": "Springfield, MA"},
    {"name": "Manager", "company": "Lowell Manufacturing", "email": "manager@lowellmfg.example", "type": "manufacturing", "location": "Lowell, MA"},
    {"name": "Director", "company": "New Bedford Fabrication", "email": "director@newbedfordfab.example", "type": "fabrication", "location": "New Bedford, MA"},
    {"name": "Operations", "company": "Brockton Metal Works", "email": "ops@brocktonmetal.example", "type": "fabrication", "location": "Brockton, MA"},
    {"name": "Owner", "company": "Cambridge Welding & Fab", "email": "owner@cambridgeweld.example", "type": "welding", "location": "Cambridge, MA"},
    {"name": "Manager", "company": "Quincy Industrial Metals", "email": "manager@quincymetals.example", "type": "manufacturing", "location": "Quincy, MA"},
    {"name": "Shop Manager", "company": "Lynn Metal Fabrication", "email": "shop@lynnfab.example", "type": "fabrication", "location": "Lynn, MA"},
    {"name": "Production Lead", "company": "Salem Welding Co", "email": "production@salemweld.example", "type": "welding", "location": "Salem, MA"},
    {"name": "Operations Director", "company": "Nashua Precision Welding", "email": "ops@nashuaweld.example", "type": "welding", "location": "Nashua, NH"},
    {"name": "Plant Manager", "company": "Concord Metal Services", "email": "plant@concordmetal.example", "type": "fabrication", "location": "Concord, NH"},
    {"name": "Owner", "company": "Stamford Metal Fab", "email": "owner@stamfordfab.example", "type": "fabrication", "location": "Stamford, CT"},
]

def load_prospects_db():
    """Load prospect database"""
    if PROSPECTS_FILE.exists():
        with open(PROSPECTS_FILE) as f:
            return json.load(f)
    return {'prospects': [], 'contacted': [], 'responded': [], 'demos_scheduled': []}

def save_prospects_db(db):
    """Save prospect database"""
    PROSPECTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PROSPECTS_FILE, 'w') as f:
        json.dump(db, f, indent=2)

def log_activity(message):
    """Log activity to daily log"""
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%H:%M:%S")
    with open(LOG_FILE, 'a') as f:
        f.write(f"\n### {timestamp} - {message}\n")

def identify_new_prospects(count=10):
    """Pull prospects from Pipedrive database"""
    # Import Pipedrive prospector
    sys.path.insert(0, str(Path(__file__).parent))
    from atlantic_laser_pipedrive_prospector import identify_prospects_from_pipedrive
    
    # Get prospects from Pipedrive
    prospects = identify_prospects_from_pipedrive(count)
    
    return prospects

def send_cold_outreach(prospect):
    """Send personalized cold outreach email (NO deal creation until they respond)"""
    # DNC check — block before sending
    if is_dnc(prospect.get('email', ''), 'atlantic_laser_prospector'):
        return False

    subject = f"4x Faster Welding for {prospect['company']}"
    
    body = COLD_EMAIL_TEMPLATE.format(
        name=prospect['name'],
        company=prospect['company']
    )
    
    # Send email
    result = send_email(prospect['email'], subject, body)
    
    if result['success']:
        log_activity(f"✅ Sent cold email to {prospect['name']} at {prospect['company']}")
        
        # Mark as contacted in Pipedrive log
        from atlantic_laser_pipedrive_prospector import mark_as_contacted
        mark_as_contacted(prospect)
        
        return True
    else:
        log_activity(f"❌ Failed to send to {prospect['email']}: {result.get('error', 'Unknown error')}")
        return False

def check_responses():
    """Check inbox for responses"""
    messages = check_inbox(20)
    
    # Filter out automated messages
    real_responses = [
        m for m in messages 
        if 'noreply' not in m['from'].lower() 
        and 'mailer-daemon' not in m['from'].lower()
    ]
    
    if real_responses:
        log_activity(f"📧 Found {len(real_responses)} inbox messages")
        for msg in real_responses:
            log_activity(f"   - {msg['subject'][:50]} from {msg['from'][:30]}")
    
    return real_responses

def run_morning_block():
    """9 AM: Check inbox, identify prospects, send outreach"""
    log_activity("🌅 MORNING BLOCK START")
    
    # Check for responses
    responses = check_responses()
    
    # Identify new prospects
    prospects = identify_new_prospects(20)
    log_activity(f"🎯 Identified {len(prospects)} new prospects")
    
    # Send outreach (increased to 15 per day)
    db = load_prospects_db()
    sent_count = 0
    
    for prospect in prospects[:15]:
        if send_cold_outreach(prospect):
            db['contacted'].append({
                **prospect,
                'contacted_date': datetime.now().isoformat(),
                'status': 'cold_email_sent'
            })
            sent_count += 1
    
    save_prospects_db(db)
    
    log_activity(f"📊 MORNING SUMMARY: {sent_count} emails sent, {len(responses)} responses")
    
    return {
        'sent': sent_count,
        'responses': len(responses),
        'prospects_identified': len(prospects)
    }

def run_midday_block():
    """1 PM: Response handling, follow-ups"""
    log_activity("☀️ MIDDAY BLOCK START")
    
    # Import response handler
    import sys
    sys.path.insert(0, str(Path(__file__).parent))
    from atlantic_laser_response_handler import check_for_responses
    
    # This will create Pipedrive deals ONLY for people who respond
    response_count = check_for_responses()
    
    log_activity(f"📊 MIDDAY SUMMARY: {response_count} responses handled")
    
    return {'responses': response_count}

def run_afternoon_block():
    """5 PM: Final check, CRM updates"""
    log_activity("🌆 AFTERNOON BLOCK START")
    
    responses = check_responses()
    db = load_prospects_db()
    
    summary = {
        'total_prospects': len(db['prospects']),
        'total_contacted': len(db['contacted']),
        'responded': len(db.get('responded', [])),
        'demos_scheduled': len(db.get('demos_scheduled', []))
    }
    
    log_activity(f"📊 EOD SUMMARY: {summary}")
    
    return summary

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1:
        block = sys.argv[1]
        if block == 'morning':
            result = run_morning_block()
        elif block == 'midday':
            result = run_midday_block()
        elif block == 'afternoon':
            result = run_afternoon_block()
        else:
            print(f"Unknown block: {block}")
            sys.exit(1)
        
        print(json.dumps(result, indent=2))
    else:
        print("Usage: atlantic_laser_prospector.py [morning|midday|afternoon]")
