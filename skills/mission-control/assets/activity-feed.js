/**
 * Mission Control - Live Activity Feed
 * Real-time activity stream powered by Supabase
 */

const SUPABASE_URL = 'https://cwnvvdxwwvrfxoudcaag.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KgXR0y-99KEHPy0MaPoB6A_Nf4eCSDd';

// Activity Feed State
const ActivityFeed = {
    activities: [],
    subscription: null,
    filters: {
        source: null,
        eventType: null,
        severity: null
    },
    isConnected: false,
    
    // Initialize the activity feed
    async init() {
        console.log('[ActivityFeed] Initializing...');
        await this.loadRecent();
        this.setupRealtime();
        this.render();
    },
    
    // Load recent activities from Supabase
    async loadRecent(limit = 50) {
        try {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/unified_activity?order=created_at.desc&limit=${limit}`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                    }
                }
            );
            
            if (response.ok) {
                this.activities = await response.json();
                console.log(`[ActivityFeed] Loaded ${this.activities.length} activities`);
            } else {
                // Fallback to agent_actions if unified_activity view doesn't exist yet
                const fallbackResponse = await fetch(
                    `${SUPABASE_URL}/rest/v1/agent_actions?order=created_at.desc&limit=${limit}`,
                    {
                        headers: {
                            'apikey': SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                        }
                    }
                );
                if (fallbackResponse.ok) {
                    const actions = await fallbackResponse.json();
                    this.activities = actions.map(a => ({
                        id: a.id,
                        event_type: 'agent_action',
                        source: a.agent_id,
                        title: a.action_type,
                        description: a.description,
                        entity_type: a.entity_type,
                        entity_id: a.entity_id,
                        metadata: a.metadata,
                        severity: 'info',
                        created_at: a.created_at
                    }));
                }
            }
        } catch (err) {
            console.error('[ActivityFeed] Failed to load:', err);
        }
    },
    
    // Setup Supabase Realtime subscription
    setupRealtime() {
        try {
            // Create WebSocket connection to Supabase Realtime
            const wsUrl = SUPABASE_URL.replace('https://', 'wss://') + '/realtime/v1/websocket?apikey=' + SUPABASE_ANON_KEY + '&vsn=1.0.0';
            const ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                console.log('[ActivityFeed] Realtime connected');
                this.isConnected = true;
                this.updateConnectionStatus();
                
                // Subscribe to activity_feed table
                ws.send(JSON.stringify({
                    topic: 'realtime:public:activity_feed',
                    event: 'phx_join',
                    payload: {},
                    ref: '1'
                }));
                
                // Subscribe to agent_actions table
                ws.send(JSON.stringify({
                    topic: 'realtime:public:agent_actions',
                    event: 'phx_join',
                    payload: {},
                    ref: '2'
                }));
                
                // Keep alive
                setInterval(() => {
                    ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: 'hb' }));
                }, 30000);
            };
            
            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.event === 'INSERT') {
                    const newActivity = this.transformRecord(msg.payload.record, msg.topic);
                    this.addActivity(newActivity);
                }
            };
            
            ws.onerror = (err) => {
                console.error('[ActivityFeed] WebSocket error:', err);
                this.isConnected = false;
                this.updateConnectionStatus();
            };
            
            ws.onclose = () => {
                console.log('[ActivityFeed] Realtime disconnected, reconnecting in 5s...');
                this.isConnected = false;
                this.updateConnectionStatus();
                setTimeout(() => this.setupRealtime(), 5000);
            };
            
            this.subscription = ws;
        } catch (err) {
            console.error('[ActivityFeed] Failed to setup realtime:', err);
            // Fallback to polling
            setInterval(() => this.loadRecent(), 30000);
        }
    },
    
    // Transform database record to activity format
    transformRecord(record, topic) {
        if (topic.includes('agent_actions')) {
            return {
                id: record.id,
                event_type: 'agent_action',
                source: record.agent_id,
                title: record.action_type,
                description: record.description,
                entity_type: record.entity_type,
                entity_id: record.entity_id,
                metadata: record.metadata,
                severity: 'info',
                created_at: record.created_at
            };
        }
        return record;
    },
    
    // Add a new activity to the feed
    addActivity(activity) {
        this.activities.unshift(activity);
        if (this.activities.length > 100) {
            this.activities.pop();
        }
        this.render();
        this.showNotification(activity);
    },
    
    // Show browser notification for important events
    showNotification(activity) {
        if (activity.severity === 'critical' || activity.severity === 'error') {
            if (Notification.permission === 'granted') {
                new Notification('Mission Control Alert', {
                    body: `${activity.source}: ${activity.title}`,
                    icon: '🚨'
                });
            }
        }
    },
    
    // Get icon for event type
    getIcon(activity) {
        const icons = {
            'agent_action': '🤖',
            'lead_event': '👤',
            'note': '📝',
            'system': '⚙️',
            'sync': '🔄',
            'alert': '🚨',
            'add_note': '📝',
            'move_stage': '➡️',
            'create_task': '✅',
            'complete_task': '✓',
            'error': '❌'
        };
        return icons[activity.event_type] || icons[activity.title] || '📌';
    },
    
    // Get severity color
    getSeverityColor(severity) {
        const colors = {
            'info': '#3b82f6',
            'success': '#10b981',
            'warning': '#f59e0b',
            'error': '#ef4444',
            'critical': '#dc2626'
        };
        return colors[severity] || colors.info;
    },
    
    // Format relative time
    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = Math.floor((now - time) / 1000);
        
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
        return time.toLocaleDateString();
    },
    
    // Update connection status indicator
    updateConnectionStatus() {
        const indicator = document.getElementById('activity-status');
        if (indicator) {
            indicator.innerHTML = this.isConnected 
                ? '<span style="color: #10b981;">● Live</span>'
                : '<span style="color: #f59e0b;">● Reconnecting...</span>';
        }
    },
    
    // Filter activities
    applyFilters(activities) {
        return activities.filter(a => {
            if (this.filters.source && a.source !== this.filters.source) return false;
            if (this.filters.eventType && a.event_type !== this.filters.eventType) return false;
            if (this.filters.severity && a.severity !== this.filters.severity) return false;
            return true;
        });
    },
    
    // Render the activity feed
    render() {
        const container = document.getElementById('activity-list');
        if (!container) return;
        
        const filtered = this.applyFilters(this.activities);
        
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="activity-empty" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📭</div>
                    <div>No recent activity</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filtered.map(a => `
            <div class="activity-item" style="border-left: 3px solid ${this.getSeverityColor(a.severity)};">
                <div class="activity-icon" style="font-size: 1.2rem;">${this.getIcon(a)}</div>
                <div class="activity-content">
                    <div class="activity-header" style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="activity-source" style="font-weight: 600; color: var(--accent-blue);">${a.source || 'system'}</span>
                        <span class="activity-time" style="font-size: 0.75rem; color: var(--text-secondary);">${this.formatTime(a.created_at)}</span>
                    </div>
                    <div class="activity-title" style="font-weight: 500; margin: 0.25rem 0;">${a.title}</div>
                    ${a.description ? `<div class="activity-desc" style="font-size: 0.85rem; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${a.description}</div>` : ''}
                    ${a.entity_type ? `<div class="activity-entity" style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">📎 ${a.entity_type} ${a.entity_id || ''}</div>` : ''}
                </div>
            </div>
        `).join('');
    },
    
    // Log an activity (callable from agents/scripts)
    async log(eventType, source, title, description = null, options = {}) {
        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/activity_feed`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    event_type: eventType,
                    source: source,
                    title: title,
                    description: description,
                    entity_type: options.entityType || null,
                    entity_id: options.entityId || null,
                    entity_name: options.entityName || null,
                    metadata: options.metadata || null,
                    severity: options.severity || 'info'
                })
            });
            
            if (response.ok) {
                const [activity] = await response.json();
                return activity;
            }
        } catch (err) {
            console.error('[ActivityFeed] Failed to log activity:', err);
        }
        return null;
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ActivityFeed.init());
} else {
    ActivityFeed.init();
}

// Export for use in other scripts
window.ActivityFeed = ActivityFeed;
