/**
 * Google API Helper
 * Unified access to Gmail, Calendar, and Drive
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const credentialsPath = path.join(__dirname, '../../credentials/google/gmail-oauth-credentials.json');
const tokenPath = path.join(__dirname, '../../credentials/google/gmail-token.json');

class GoogleAPI {
  constructor() {
    this.token = null;
  }

  async getToken() {
    const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    return tokenData.access_token;
  }

  async refreshToken() {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    
    const { client_id, client_secret } = credentials.installed;
    const { refresh_token } = token;

    return new Promise((resolve, reject) => {
      const data = new URLSearchParams({
        client_id,
        client_secret,
        refresh_token,
        grant_type: 'refresh_token'
      });

      const req = https.request({
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const newToken = JSON.parse(body);
          if (newToken.access_token) {
            newToken.refresh_token = refresh_token;
            fs.writeFileSync(tokenPath, JSON.stringify(newToken, null, 2));
            resolve(newToken.access_token);
          } else {
            reject(new Error(body));
          }
        });
      });
      req.on('error', reject);
      req.write(data.toString());
      req.end();
    });
  }

  async request(url, options = {}) {
    const token = await this.getToken();
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const reqOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      };

      const req = https.request(reqOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error && json.error.code === 401) {
              // Token expired, refresh and retry
              this.refreshToken().then(() => {
                this.request(url, options).then(resolve).catch(reject);
              }).catch(reject);
            } else {
              resolve(json);
            }
          } catch (e) {
            resolve(data);
          }
        });
      });

      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  }

  // Gmail methods
  async getProfile() {
    return this.request('https://gmail.googleapis.com/gmail/v1/users/me/profile');
  }

  async listMessages(query = '', maxResults = 50) {
    const q = encodeURIComponent(query);
    return this.request(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=${q}`);
  }

  async getMessage(id) {
    return this.request(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`);
  }

  async getRecentUnread() {
    const list = await this.listMessages('is:unread -category:promotions -category:social', 20);
    if (!list.messages) return [];
    
    const messages = [];
    for (const m of list.messages.slice(0, 10)) {
      const msg = await this.request(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`);
      const headers = msg.payload?.headers || [];
      messages.push({
        id: m.id,
        from: headers.find(h => h.name === 'From')?.value,
        subject: headers.find(h => h.name === 'Subject')?.value,
        date: headers.find(h => h.name === 'Date')?.value,
        snippet: msg.snippet
      });
    }
    return messages;
  }

  // Calendar methods
  async listCalendars() {
    return this.request('https://www.googleapis.com/calendar/v3/users/me/calendarList');
  }

  async getUpcomingEvents(days = 7) {
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const timeMin = now.toISOString();
    const timeMax = future.toISOString();
    
    return this.request(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`);
  }

  async createEvent(summary, startTime, endTime, description = '') {
    const event = {
      summary,
      description,
      start: { dateTime: startTime, timeZone: 'America/New_York' },
      end: { dateTime: endTime, timeZone: 'America/New_York' }
    };

    return this.request('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
  }

  // Drive methods
  async listFiles(query = '', maxResults = 50) {
    const q = encodeURIComponent(query);
    return this.request(`https://www.googleapis.com/drive/v3/files?q=${q}&pageSize=${maxResults}&fields=files(id,name,mimeType,modifiedTime,webViewLink)`);
  }

  async searchFiles(name) {
    return this.listFiles(`name contains '${name}'`);
  }

  async downloadFile(fileId, destPath) {
    const token = await this.getToken();
    
    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'www.googleapis.com',
        path: `/drive/v3/files/${fileId}?alt=media`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      }, (res) => {
        if (res.statusCode === 302 || res.statusCode === 303) {
          // Follow redirect
          https.get(res.headers.location, (res2) => {
            const file = fs.createWriteStream(destPath);
            res2.pipe(file);
            file.on('finish', () => resolve(destPath));
          });
        } else {
          const file = fs.createWriteStream(destPath);
          res.pipe(file);
          file.on('finish', () => resolve(destPath));
        }
      });
      req.on('error', reject);
      req.end();
    });
  }
}

module.exports = GoogleAPI;

// CLI usage
if (require.main === module) {
  const api = new GoogleAPI();
  const cmd = process.argv[2];

  const commands = {
    async profile() {
      console.log(await api.getProfile());
    },
    async unread() {
      const msgs = await api.getRecentUnread();
      for (const m of msgs) {
        console.log(`📧 ${m.from}`);
        console.log(`   ${m.subject}`);
        console.log(`   ${m.snippet?.substring(0, 80)}...`);
        console.log('');
      }
    },
    async events() {
      const events = await api.getUpcomingEvents(14);
      if (!events.items?.length) {
        console.log('No upcoming events');
        return;
      }
      for (const e of events.items) {
        console.log(`📅 ${e.summary}`);
        console.log(`   ${e.start.dateTime || e.start.date}`);
        console.log('');
      }
    },
    async search() {
      const query = process.argv[3] || '';
      const files = await api.searchFiles(query);
      for (const f of files.files || []) {
        console.log(`📄 ${f.name}`);
        console.log(`   ${f.webViewLink}`);
        console.log('');
      }
    },
    async refresh() {
      await api.refreshToken();
      console.log('Token refreshed');
    }
  };

  if (commands[cmd]) {
    commands[cmd]().catch(e => console.error('Error:', e.message));
  } else {
    console.log('Usage: node google-api.js <command>');
    console.log('Commands: profile, unread, events, search <query>, refresh');
  }
}
