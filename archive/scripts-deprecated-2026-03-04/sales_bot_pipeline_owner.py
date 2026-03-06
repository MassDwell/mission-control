#!/usr/bin/env python3
"""
MassDwell Sales Bot - Pipeline Owner
Full ownership of sales pipeline from lead capture to qualification

RESPONSIBILITIES:
1. Follow-up sequences for engaged leads
2. Lead qualification scoring
3. Handoff to humans when qualified
4. Pipeline hygiene and progression

Every lead must progress - no lead goes cold.
"""

import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from gmail_auth_handler import get_gmail_access_token
import requests
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

class SalesBotPipelineOwner:
    def __init__(self):
        self.setup_logging()
        self.load_data()
        self.actions_taken = []
        
    def setup_logging(self):
        """Set up logging system"""
        logging.basicConfig(
            level=logging.INFO,
            format='[%(asctime)s] %(message)s',
            handlers=[
                logging.FileHandler('/Users/openclaw/.openclaw/workspace/scripts/sales_bot_pipeline_owner.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
    
    def log(self, message):
        """Log message with timestamp"""
        self.logger.info(message)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")
    
    def load_data(self):
        """Load CRM data and credentials"""
        try:
            # Load CRM data 
            with open('/Users/openclaw/.openclaw/workspace/crm-dashboard/data/leads.json', 'r') as f:
                crm_data = json.load(f)
                self.leads_data = crm_data.get('leads', [])
            
            # Load Gmail credentials
            with open('/Users/openclaw/.openclaw/workspace/credentials/google/gmail-token-sales-fixed.json', 'r') as f:
                self.gmail_token = json.load(f)
                
            # Load email signature
            with open('/Users/openclaw/.openclaw/workspace/data/massdwell/EMAIL-SIGNATURE.md', 'r') as f:
                self.email_signature = f.read().strip()
                
            self.log("✅ Loaded CRM data, Gmail token, and email signature")
            
        except Exception as e:
            self.log(f"❌ Error loading data: {str(e)}")
            raise

    def get_leads_needing_followup(self):
        """Identify leads that need follow-up based on engagement status"""
        followup_leads = []
        
        for lead in self.leads_data:
            # Skip if no email
            if not lead.get('contact_email'):
                continue
                
            # Get last activity timestamp (using updated_at as proxy)
            last_activity = lead.get('updated_at')
            if not last_activity:
                continue
                
            # Check if lead has been engaged but needs follow-up
            status_id = lead.get('status_id', '')
            pipeline_id = lead.get('pipeline_id', '')
            
            # Look for leads that have been contacted but not qualified yet
            if self.needs_followup(lead):
                followup_leads.append(lead)
                
        return followup_leads
    
    def needs_followup(self, lead):
        """Determine if a lead needs follow-up based on status and timing"""
        status_id = lead.get('status_id', 0)
        pipeline_id = lead.get('pipeline_id', '')
        last_activity = lead.get('updated_at')
        
        # Skip if no recent activity timestamp
        if not last_activity:
            return False
            
        # Check if enough time has passed since last activity for follow-up
        try:
            # Convert Unix timestamp to datetime
            last_date = datetime.fromtimestamp(last_activity)
            days_since = (datetime.now() - last_date).days
            
            # Status-based follow-up logic (using status_id for now)
            # For MassDwell pipeline, we'll be more aggressive with follow-ups
            if days_since >= 3:  # Follow up on leads not updated in 3+ days
                return True
                
        except Exception as e:
            self.log(f"Error parsing timestamp {last_activity}: {e}")
            
        return False
    
    def qualify_lead(self, lead):
        """Score and qualify lead based on engagement and data quality"""
        score = 0
        qualification_notes = []
        
        # Email quality (20 points)
        email = lead.get('contact_email', '')
        if email and '@' in email and '.' in email:
            if not any(x in email.lower() for x in ['noreply', 'donotreply', 'test']):
                score += 20
                qualification_notes.append("✅ Valid email address")
        
        # Contact info (15 points)
        if lead.get('contact_name') and len(lead.get('contact_name', '')) > 2:
            score += 10
            qualification_notes.append("✅ Has real name")
        if lead.get('contact_phone'):
            score += 5
            qualification_notes.append("✅ Has phone number")
            
        # Location (25 points) - Critical for MassDwell
        # Check custom_fields_values for location data
        custom_fields = lead.get('custom_fields_values', []) or []
        ma_keywords = ['massachusetts', 'ma', 'boston', 'cambridge', 'newton', 'lexington']
        
        for field in custom_fields:
            field_name = field.get('field_name', '').lower()
            if 'location' in field_name or 'address' in field_name or 'city' in field_name:
                values = field.get('values', [])
                for value in values:
                    field_value = value.get('value', '')
                    if field_value and any(keyword in field_value.lower() for keyword in ma_keywords):
                        score += 25
                        qualification_notes.append("✅ Located in Massachusetts")
                        break
                if score >= 25:  # Already found location match
                    break
        
        # Engagement (20 points)
        if lead.get('updated_at'):
            score += 10
            qualification_notes.append("✅ Has activity history")
            
        # Budget/Timeline indicators (20 points)
        budget_fields = ['budget', 'timeline', 'project timeline']
        for field in custom_fields:
            field_name = field.get('field_name', '').lower()
            if any(budget_field in field_name for budget_field in budget_fields):
                values = field.get('values', [])
                if values and values[0].get('value'):
                    score += 10
                    qualification_notes.append(f"✅ Has {field.get('field_name')} info")
                    break
                
        # Determine qualification status
        if score >= 60:
            qualification = "QUALIFIED - Hand off to human"
        elif score >= 40:
            qualification = "WARM - Continue nurturing"  
        else:
            qualification = "COLD - Basic follow-up sequence"
            
        return {
            'score': score,
            'qualification': qualification,
            'notes': qualification_notes
        }
    
    def send_followup_email(self, lead, followup_type="standard"):
        """Send follow-up email based on lead qualification"""
        try:
            # Get lead details
            name = lead.get('contact_name', '') or lead.get('name', '')
            email = lead.get('contact_email', '')
            
            # Handle numeric IDs or invalid names
            if not name or name.isdigit() or '{{' in name or name in ['N/A', '']:
                greeting = "Hi,"
            else:
                greeting = f"Hi {name.split()[0]},"
            
            # Select email template based on qualification
            qualification = self.qualify_lead(lead)
            
            if qualification['score'] >= 60:
                subject = "Ready to move forward with your ADU project?"
                body = f"""{greeting}

I wanted to follow up on your ADU inquiry. Based on your location and project details, you'd be a great fit for our MassDwell ADU program.

We're currently seeing 8-12 week construction timelines (50% faster than traditional builds) with our factory-built approach. Our Dwell Classic (2 bed/1 bath, 574 sqft) has been very popular at $172,000 turnkey.

I'd love to schedule a 20-minute call to show you our models and discuss your specific project. What does your availability look like this week?

{self.email_signature}"""
            
            elif qualification['score'] >= 40:
                subject = "Quick question about your ADU project"
                body = f"""{greeting}

Thanks for your interest in MassDwell ADUs. I wanted to check in and see where you are in your planning process.

A few quick questions to help me provide the most relevant information:
- What's your target timeline for this project?
- What's your intended use? (rental income, family member, home office?)
- Have you started looking into permitting requirements?

We handle all the permitting headaches and can typically complete projects in 8-12 weeks post-approval. Happy to answer any questions you might have.

{self.email_signature}"""
            
            else:
                subject = "Massachusetts ADU construction - questions?"
                body = f"""{greeting}

I noticed you inquired about ADU construction in Massachusetts. We've helped dozens of homeowners add rental units to their properties with our factory-built approach.

Our most popular model (Dwell Classic - 2 bed/1 bath) starts at $172,000 turnkey including permitting and installation. We're typically 50% faster than traditional construction.

Do you have any specific questions about the process or our models? I'm here to help.

{self.email_signature}"""
            
            # Send email via Gmail API
            access_token = get_gmail_access_token()
            if not access_token:
                self.log(f"❌ Failed to get Gmail access token")
                return False
                
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = 'sales@massdwell.com'
            msg['To'] = email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))
            
            # Send via Gmail API
            import base64
            raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode()
            
            send_url = "https://www.googleapis.com/gmail/v1/users/me/messages/send"
            headers = {'Authorization': f'Bearer {access_token}'}
            payload = {'raw': raw_message}
            
            response = requests.post(send_url, headers=headers, json=payload)
            
            if response.status_code == 200:
                self.log(f"✅ Sent {followup_type} follow-up to {email} (Score: {qualification['score']})")
                self.actions_taken.append(f"Sent follow-up to {email}")
                return True
            else:
                self.log(f"❌ Failed to send email: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Error sending follow-up to {email}: {str(e)}")
            return False
    
    def identify_qualified_leads(self):
        """Find leads ready for human handoff"""
        qualified_leads = []
        
        for lead in self.leads_data:
            qualification = self.qualify_lead(lead)
            if qualification['score'] >= 60:
                qualified_leads.append({
                    'lead': lead,
                    'score': qualification['score'],
                    'notes': qualification['notes']
                })
                
        return qualified_leads
    
    def handoff_to_human(self, qualified_leads):
        """Send qualified leads to steve.vettori@massdwell.com"""
        if not qualified_leads:
            return
            
        try:
            # Prepare handoff email
            subject = f"🔥 {len(qualified_leads)} Qualified Leads Ready for Call"
            
            body = f"""Steve/Jon,

I've identified {len(qualified_leads)} qualified leads ready for human engagement:

"""
            for i, lead_info in enumerate(qualified_leads, 1):
                lead = lead_info['lead']
                score = lead_info['score']
                
                body += f"""
LEAD {i}: {lead.get('contact_name', '') or lead.get('name', 'Unknown')}
Email: {lead.get('contact_email', '')}
Phone: {lead.get('contact_phone', 'Not provided')}
Score: {score}/100
Last Activity: {datetime.fromtimestamp(lead.get('updated_at', 0)).strftime('%Y-%m-%d') if lead.get('updated_at') else 'Unknown'}

Qualification Notes:
"""
                for note in lead_info['notes']:
                    body += f"  {note}\n"
                
            body += f"""

These leads have shown engagement and meet our qualification criteria. They should be prioritized for direct outreach.

Best regards,
MassDwell Sales Bot
"""
            
            # Send handoff notification
            access_token = get_gmail_access_token()
            if access_token:
                msg = MIMEMultipart()
                msg['From'] = 'sales@massdwell.com'
                msg['To'] = 'steve.vettori@massdwell.com'
                msg['Subject'] = subject
                msg.attach(MIMEText(body, 'plain'))
                
                import base64
                raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode()
                
                send_url = "https://www.googleapis.com/gmail/v1/users/me/messages/send"
                headers = {'Authorization': f'Bearer {access_token}'}
                payload = {'raw': raw_message}
                
                response = requests.post(send_url, headers=headers, json=payload)
                
                if response.status_code == 200:
                    self.log(f"✅ Handed off {len(qualified_leads)} qualified leads to Steve")
                    self.actions_taken.append(f"Handed off {len(qualified_leads)} qualified leads")
                else:
                    self.log(f"❌ Failed to send handoff email: {response.text}")
                    
        except Exception as e:
            self.log(f"❌ Error in handoff: {str(e)}")
    
    def run_pipeline_management(self):
        """Main pipeline management execution"""
        self.log("🚀 SALES BOT PIPELINE OWNER - Starting full pipeline management")
        
        # 1. Identify leads needing follow-up
        followup_leads = self.get_leads_needing_followup()
        self.log(f"📋 Found {len(followup_leads)} leads needing follow-up")
        
        # 2. Send follow-up emails
        followup_count = 0
        for lead in followup_leads[:5]:  # Limit to 5 follow-ups per run to avoid spam
            if self.send_followup_email(lead):
                followup_count += 1
                
        # 3. Identify qualified leads for handoff
        qualified_leads = self.identify_qualified_leads()
        self.log(f"🎯 Found {len(qualified_leads)} qualified leads ready for handoff")
        
        # 4. Hand off qualified leads to humans
        if qualified_leads:
            self.handoff_to_human(qualified_leads)
        
        # 5. Summary
        self.log(f"📊 Pipeline Summary:")
        self.log(f"   • Follow-ups sent: {followup_count}")
        self.log(f"   • Qualified leads: {len(qualified_leads)}")
        self.log(f"   • Actions taken: {len(self.actions_taken)}")
        
        return len(self.actions_taken) > 0

if __name__ == "__main__":
    pipeline_owner = SalesBotPipelineOwner()
    actions_needed = pipeline_owner.run_pipeline_management()
    
    if not actions_needed:
        print("HEARTBEAT_OK")