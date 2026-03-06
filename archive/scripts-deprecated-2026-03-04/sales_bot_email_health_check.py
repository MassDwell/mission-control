#!/usr/bin/env python3
"""
Sales Bot Email Health Check
Verifies Gmail auth, email sending capability, and recent bot activity
"""

import json
import sys
import requests
import base64
from pathlib import Path
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(message)s',
    handlers=[
        logging.FileHandler('/Users/openclaw/.openclaw/workspace/scripts/sales_bot_health_check.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

WORKSPACE = Path.home() / '.openclaw/workspace'
TOKEN_PATH = WORKSPACE / 'credentials/google/gmail-token-sales-fixed.json'
GMAIL_ACCOUNT = 'sales@massdwell.com'
SEND_TO = 'steve.vettori@massdwell.com'

def log(msg):
    """Log message"""
    logger.info(msg)
    print(msg)

class EmailHealthCheck:
    def __init__(self):
        self.check_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        self.health_status = "HEALTHY"
        self.issues = []
        self.details = {
            "gmail_auth": "UNKNOWN",
            "email_send": "UNKNOWN",
            "recent_activity": "UNKNOWN"
        }
    
    def check_gmail_auth(self):
        """Check if Gmail credentials exist and are valid"""
        log("🏥 SALES BOT EMAIL HEALTH CHECK")
        log("==================================================")
        log(f"Check Time: {self.check_time}")
        
        try:
            if not TOKEN_PATH.exists():
                log(f"❌ Gmail Auth: Token file not found at {TOKEN_PATH}")
                self.health_status = "UNHEALTHY"
                self.issues.append("Gmail token file missing")
                self.details["gmail_auth"] = "FAILED"
                return False
            
            with open(TOKEN_PATH, 'r') as f:
                token_data = json.load(f)
            
            # Check for required fields
            if 'access_token' not in token_data:
                log("❌ Gmail Auth: No access token in credentials")
                self.health_status = "UNHEALTHY"
                self.issues.append("Gmail access token missing")
                self.details["gmail_auth"] = "FAILED"
                return False
            
            log(f"✅ Gmail credentials loaded")
            self.details["gmail_auth"] = "WORKING"
            return True
            
        except Exception as e:
            log(f"❌ Gmail Auth Error: {e}")
            self.health_status = "UNHEALTHY"
            self.issues.append(f"Gmail auth error: {str(e)}")
            self.details["gmail_auth"] = "FAILED"
            return False
    
    def check_email_sending(self):
        """Test email sending capability via Gmail API"""
        try:
            # Load token
            with open(TOKEN_PATH, 'r') as f:
                token_data = json.load(f)
            
            access_token = token_data.get('access_token')
            
            if not access_token:
                log("❌ Email Send: No access token available")
                self.details["email_send"] = "FAILED"
                self.health_status = "UNHEALTHY"
                self.issues.append("No access token for email sending")
                return False
            
            # Create test message
            msg = MIMEMultipart()
            msg['From'] = GMAIL_ACCOUNT
            msg['To'] = SEND_TO
            msg['Subject'] = '[TEST] Sales Bot Health Check'
            
            body = f"""Health check test message
Time: {self.check_time}
Status: System responding normally
"""
            msg.attach(MIMEText(body, 'plain'))
            
            # Convert to base64 for Gmail API
            raw_message = base64.urlsafe_b64encode(msg.as_bytes()).decode('utf-8')
            
            # Send via Gmail API
            try:
                headers = {'Authorization': f'Bearer {access_token}'}
                send_url = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'
                send_data = {'raw': raw_message}
                
                response = requests.post(send_url, headers=headers, json=send_data)
                
                if response.status_code == 200:
                    log(f"✅ Test Email: Sent successfully to {SEND_TO}")
                    self.details["email_send"] = "WORKING"
                    return True
                else:
                    error_msg = f"Gmail API returned {response.status_code}"
                    log(f"❌ Email Send: {error_msg}")
                    self.health_status = "UNHEALTHY"
                    self.issues.append(f"Email send API error: {error_msg}")
                    self.details["email_send"] = "FAILED"
                    return False
                    
            except Exception as api_error:
                log(f"❌ Email Send API Error: {api_error}")
                self.health_status = "UNHEALTHY"
                self.issues.append(f"Gmail API error: {str(api_error)}")
                self.details["email_send"] = "FAILED"
                return False
        
        except Exception as e:
            log(f"❌ Email Send Error: {e}")
            self.health_status = "UNHEALTHY"
            self.issues.append(f"Email send error: {str(e)}")
            self.details["email_send"] = "FAILED"
            return False
    
    def check_recent_activity(self):
        """Check recent sales bot activity"""
        try:
            activity_log_path = WORKSPACE / 'scripts/sales_bot_auto_engage.log'
            
            if not activity_log_path.exists():
                log("⚠️ Activity Log: Not found, assuming no activity")
                self.details["recent_activity"] = "NO ACTIVITY"
                return False
            
            # Count actions in last 24 hours
            action_count = 0
            cutoff_time = datetime.now() - timedelta(hours=24)
            
            with open(activity_log_path, 'r') as f:
                for line in f:
                    try:
                        # Parse timestamp from log line
                        if '[' in line and ']' in line:
                            time_str = line[1:20]  # Extract YYYY-MM-DD HH:MM:SS
                            log_time = datetime.strptime(time_str, '%Y-%m-%d %H:%M:%S')
                            
                            if log_time > cutoff_time:
                                action_count += 1
                    except:
                        pass
            
            log(f"📊 Recent Activity: {action_count} actions in last 24h")
            self.details["recent_activity"] = f"{action_count} actions"
            
            return True
            
        except Exception as e:
            log(f"⚠️ Activity Check Error: {e}")
            self.details["recent_activity"] = "ERROR"
            return False
    
    def generate_report(self):
        """Generate final health report"""
        log("==================================================")
        log(f"✅ Gmail Auth: {self.details['gmail_auth']}")
        log(f"✅ Email Send: {self.details['email_send']}")
        log(f"✅ Recent Activity: {self.details['recent_activity']}")
        
        # Determine overall status
        if self.issues:
            log(f"🚨 HEALTH CHECK: CRITICAL ISSUES DETECTED")
            for issue in self.issues:
                log(f"   - {issue}")
        else:
            log(f"🎉 HEALTH CHECK: ALL SYSTEMS OPERATIONAL")
        
        log("📋 Health status updated: " + self.health_status)
        return self.health_status

def main():
    check = EmailHealthCheck()
    
    # Run all checks
    check.check_gmail_auth()
    check.check_email_sending()
    check.check_recent_activity()
    
    # Generate report
    status = check.generate_report()
    
    # Exit with appropriate code
    sys.exit(0 if status == "HEALTHY" else 1)

if __name__ == '__main__':
    main()
