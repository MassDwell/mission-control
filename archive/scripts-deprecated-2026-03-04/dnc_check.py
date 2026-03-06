"""
DNC (Do-Not-Contact) Check Module for Python
Shared module for checking if contacts are on the do-not-contact list
Used by: atlantic_laser_prospector.py, atlantic_laser_gmail_handler.py, etc.
"""

import json
from pathlib import Path

DNC_LIST_PATH = Path.home() / '.openclaw/workspace/data/massdwell/sales/do-not-contact-list.json'

_DNC_CACHE = None
_DNC_CACHE_TIME = 0
CACHE_DURATION = 5 * 60 * 1000  # 5 minutes in ms

def load_dnc_list():
    """Load DNC list from disk (cached)"""
    global _DNC_CACHE, _DNC_CACHE_TIME
    import time
    
    now = int(time.time() * 1000)
    
    # Return cached if fresh
    if _DNC_CACHE and (now - _DNC_CACHE_TIME) < CACHE_DURATION:
        return _DNC_CACHE
    
    try:
        if not DNC_LIST_PATH.exists():
            print(f'⚠️  DNC_LIST file not found: {DNC_LIST_PATH}')
            _DNC_CACHE = {'contacts': []}
            return _DNC_CACHE
        
        with open(DNC_LIST_PATH) as f:
            data = json.load(f)
        
        _DNC_CACHE = data
        _DNC_CACHE_TIME = now
        print(f"✅ DNC list loaded ({len(data.get('contacts', []))} contacts)")
        return data
    except Exception as err:
        print(f'❌ Error loading DNC list: {str(err)}')
        _DNC_CACHE = {'contacts': []}
        return _DNC_CACHE

def check_dnc(email):
    """
    Check if an email is on the DNC list
    Returns: (blocked, reason, contact)
    """
    dnc_list = load_dnc_list()
    email_lower = email.lower().strip() if email else ''
    
    if not email_lower:
        return False, None, None
    
    for contact in dnc_list.get('contacts', []):
        # Check primary email
        if contact.get('email', '').lower() == email_lower:
            return True, contact.get('reason', 'Do not contact'), contact
        
        # Check alt emails if present
        if contact.get('alt_emails'):
            for alt_email in contact['alt_emails']:
                if alt_email.lower() == email_lower:
                    return True, contact.get('reason', 'Do not contact (alt email)'), contact
    
    return False, None, None

def check_dnc_by_name(name):
    """
    Check if a name is on the DNC list
    Returns: (blocked, reason, contact)
    """
    dnc_list = load_dnc_list()
    name_lower = name.lower().strip() if name else ''
    
    if not name_lower:
        return False, None, None
    
    for contact in dnc_list.get('contacts', []):
        # Check primary name
        if contact.get('name', '').lower() == name_lower:
            return True, contact.get('reason', 'Do not contact'), contact
        
        # Check aliases if present
        if contact.get('aliases'):
            for alias in contact['aliases']:
                if alias.lower() == name_lower:
                    return True, contact.get('reason', 'Do not contact (alias)'), contact
    
    return False, None, None

def is_dnc(email, context=''):
    """
    Check if email is on DNC list (simple boolean return)
    For backward compatibility
    """
    blocked, reason, _ = check_dnc(email)
    if blocked and context:
        print(f"⏭️  SKIPPING {email} - {reason} [{context}]")
    elif blocked:
        print(f"⏭️  SKIPPING {email} - {reason}")
    return blocked

def can_email(email, name=None):
    """
    Validate if a contact can be emailed
    Returns: bool (True if safe to email)
    """
    blocked, reason, _ = check_dnc(email)
    if blocked:
        print(f"⏭️  BLOCKED: {email} - {reason}")
        return False
    
    if name:
        blocked, reason, _ = check_dnc_by_name(name)
        if blocked:
            print(f"⏭️  BLOCKED: {name} ({email}) - {reason}")
            return False
    
    return True

def filter_dnc(contacts, email_field='email', name_field='name'):
    """
    Filter contacts removing DNC entries
    Returns: (filtered_list, skipped_list)
    """
    filtered = []
    skipped = []
    
    for contact in contacts:
        email = contact.get(email_field)
        name = contact.get(name_field)
        
        if not email:
            filtered.append(contact)
            continue
        
        blocked, reason, _ = check_dnc(email)
        if blocked:
            print(f"⏭️  SKIPPING {email} - {reason}")
            skipped.append({'contact': contact, 'reason': reason})
            continue
        
        # Also check by name if available
        if name:
            blocked, reason, _ = check_dnc_by_name(name)
            if blocked:
                print(f"⏭️  SKIPPING {name} ({email}) - {reason}")
                skipped.append({'contact': contact, 'reason': reason})
                continue
        
        filtered.append(contact)
    
    print(f"   Filtered: {len(filtered)} allowed, {len(skipped)} DNC-blocked")
    return filtered, skipped

def get_dnc_list():
    """Get full DNC list for auditing/compliance"""
    return load_dnc_list()
