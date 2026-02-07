// Clawbot Mission Control v1.1 - Agent Operations Center

function agentOps() {
    return {
        // State
        activeEntity: null,
        taskFilter: 'all',
        currentTime: '',
        currentDate: '',

        // Global Stats - Real counts only
        stats: {
            agentsActive: 0,
            tasksInProgress: 0,
            queueDepth: 0,
            completedToday: 0
        },

        // Pipeline Stages
        pipelineStages: [
            { id: 'incoming', label: 'Incoming' },
            { id: 'routing', label: 'Routing' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'review', label: 'Clawson Review' },
            { id: 'complete', label: 'Complete' }
        ],

        // Entities with their assigned agents (real agent assignments)
        entities: [
            {
                id: 'massdwell',
                name: 'MassDwell',
                icon: '🏠',
                agents: ['chief_of_staff', 'marketing_content', 'sales_followup', 'finance_underwriting', 'doc_proposal', 'massdwell_factory_ops']
            },
            {
                id: 'atlantic',
                name: 'Atlantic Laser',
                icon: '⚡',
                agents: ['chief_of_staff', 'marketing_content', 'sales_followup', 'finance_underwriting', 'doc_proposal', 'laser_sales_engineer']
            },
            {
                id: 'alpine',
                name: 'Alpine Property',
                icon: '🏔️',
                agents: ['chief_of_staff', 'marketing_content', 'sales_followup', 'finance_underwriting', 'doc_proposal', 'alpine_permitting', 'alpine_property_mgmt']
            }
        ],

        // All Agents - Real agent roster, no fake activity
        agents: [
            {
                id: 'chief_of_staff',
                role: 'Manager Agent',
                icon: '👔',
                status: 'idle',
                entities: ['massdwell', 'atlantic', 'alpine'],
                currentTask: null,
                stats: { completed: 0, inProgress: 0, queued: 0 },
                lastActivity: 'Never'
            },
            {
                id: 'admin_assistant',
                role: 'Executive Assistant',
                icon: '📋',
                status: 'idle',
                entities: ['massdwell', 'atlantic', 'alpine'],
                currentTask: null,
                stats: { completed: 0, inProgress: 0, queued: 0 },
                lastActivity: 'Never'
            },
            {
                id: 'marketing_content',
                role: 'Marketing & Content',
                icon: '📢',
                status: 'idle',
                entities: ['massdwell', 'atlantic', 'alpine'],
                currentTask: null,
                stats: { completed: 0, inProgress: 0, queued: 0 },
                lastActivity: 'Never'
            },
            {
                id: 'sales_followup',
                role: 'Sales & CRM',
                icon: '🤝',
                status: 'idle',
                entities: ['massdwell', 'atlantic', 'alpine'],
                currentTask: null,
                stats: { completed: 0, inProgress: 0, queued: 0 },
                lastActivity: 'Never'
            },
            {
                id: 'finance_underwriting',
                role: 'Finance & Underwriting',
                icon: '💰',
                status: 'idle',
                entities: ['massdwell', 'atlantic', 'alpine'],
                currentTask: null,
                stats: { completed: 0, inProgress: 0, queued: 0 },
                lastActivity: 'Never'
            },
            {
                id: 'doc_proposal',
                role: 'Document & Proposal',
                icon: '📄',
                status: 'idle',
                entities: ['massdwell', 'atlantic', 'alpine'],
                currentTask: null,
                stats: { completed: 0, inProgress: 0, queued: 0 },
                lastActivity: 'Never'
            },
            {
                id: 'alpine_permitting',
                role: 'Development & Permitting',
                icon: '📜',
                status: 'idle',
                entities: ['alpine'],
                currentTask: null,
                stats: { completed: 0, inProgress: 0, queued: 0 },
                lastActivity: 'Never'
            },
            {
                id: 'alpine_property_mgmt',
                role: 'Property Management',
                icon: '🏢',
                status: 'idle',
                entities: ['alpine'],
                currentTask: null,
                stats: { completed: 0, inProgress: 0, queued: 0 },
                lastActivity: 'Never'
            },
            {
                id: 'massdwell_factory_ops',
                role: 'Factory Ops & SOP',
                icon: '🏭',
                status: 'idle',
                entities: ['massdwell'],
                currentTask: null,
                stats: { completed: 0, inProgress: 0, queued: 0 },
                lastActivity: 'Never'
            },
            {
                id: 'laser_sales_engineer',
                role: 'Technical Sales',
                icon: '🔧',
                status: 'idle',
                entities: ['atlantic'],
                currentTask: null,
                stats: { completed: 0, inProgress: 0, queued: 0 },
                lastActivity: 'Never'
            }
        ],

        // Task Queue - Empty until real tasks
        tasks: [],

        // Activity Feed - Real-time events
        activityFeed: [],
        
        // Pipeline data from server
        _pipeline: null,
        
        // WebSocket connection
        ws: null,
        wsConnected: false,
        wsReconnectTimer: null,

        // Initialize
        init() {
            this.updateTime();
            setInterval(() => this.updateTime(), 1000);
            this.connectWebSocket();
        },
        
        // WebSocket connection to Event Bridge
        connectWebSocket() {
            // Connect to same origin (works with tunnels)
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}`;
            console.log('[MC] Connecting to Mission Control Server:', wsUrl);
            
            try {
                this.ws = new WebSocket(wsUrl);
                
                this.ws.onopen = () => {
                    console.log('[MC] Connected to Mission Control Server');
                    this.wsConnected = true;
                };
                
                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        this.handleServerMessage(data);
                    } catch (e) {
                        console.error('[MC] Failed to parse event:', e);
                    }
                };
                
                this.ws.onclose = () => {
                    console.log('[MC] Disconnected from server');
                    this.wsConnected = false;
                    // Reconnect after 3 seconds
                    this.wsReconnectTimer = setTimeout(() => this.connectWebSocket(), 3000);
                };
                
                this.ws.onerror = (error) => {
                    console.error('[MC] WebSocket error:', error);
                    this.wsConnected = false;
                };
            } catch (e) {
                console.error('[MC] Failed to connect:', e);
                // Retry after 3 seconds
                this.wsReconnectTimer = setTimeout(() => this.connectWebSocket(), 3000);
            }
        },
        
        // Handle messages from Mission Control Server
        handleServerMessage(data) {
            switch (data.type) {
                case 'init':
                    // Full state initialization
                    console.log('[MC] Received initial state');
                    this.applyServerState(data);
                    // Load activity history
                    if (data.activity) {
                        data.activity.forEach(evt => this.addActivity(evt));
                    }
                    break;
                    
                case 'update':
                    // State update
                    this.applyServerState(data);
                    // Add new events to feed
                    if (data.newEvents) {
                        data.newEvents.forEach(evt => this.addActivity(evt));
                    }
                    break;
                    
                case 'activity':
                    // Activity events only
                    if (data.events) {
                        data.events.forEach(evt => this.addActivity(evt));
                    }
                    break;
                    
                case 'system':
                    // System message
                    this.addActivity({
                        type: 'system',
                        icon: data.icon || '🔌',
                        message: data.message,
                        timestamp: data.timestamp
                    });
                    break;
                    
                default:
                    // Legacy event format - pass to old handler
                    this.handleBridgeEvent(data);
            }
        },
        
        // Apply server state to local state
        applyServerState(data) {
            // Update stats
            if (data.stats) {
                this.stats = { ...this.stats, ...data.stats };
            }
            
            // Update agents with server data
            if (data.agents) {
                data.agents.forEach(serverAgent => {
                    let localAgent = this.agents.find(a => a.id === serverAgent.id);
                    
                    // Add new agents from server that aren't in predefined list
                    if (!localAgent && serverAgent.id !== 'main') {
                        localAgent = {
                            id: serverAgent.id,
                            role: serverAgent.name || serverAgent.id,
                            icon: this.getAgentIcon(serverAgent.id),
                            status: 'idle',
                            entities: ['massdwell', 'atlantic', 'alpine'],
                            currentTask: null,
                            stats: { completed: 0, inProgress: 0, queued: 0 },
                            lastActivity: 'Never'
                        };
                        this.agents.push(localAgent);
                    }
                    
                    if (localAgent) {
                        localAgent.status = serverAgent.status || 'idle';
                        localAgent.currentTask = serverAgent.currentTask;
                        localAgent.stats = serverAgent.stats || localAgent.stats;
                        localAgent.lastActivity = serverAgent.lastActivity 
                            ? this.formatTimeAgo(serverAgent.lastActivity)
                            : localAgent.status === 'working' ? 'Just now' : 'Never';
                    }
                });
            }
            
            // Update tasks
            if (data.tasks) {
                this.tasks = data.tasks;
            }
            
            // Update pipeline (for getStageCount)
            if (data.pipeline) {
                this._pipeline = data.pipeline;
            }
        },
        
        // Get icon for agent based on ID
        getAgentIcon(agentId) {
            const icons = {
                'chief_of_staff': '👔',
                'admin_assistant': '📋',
                'marketing_content': '📢',
                'sales_followup': '🤝',
                'finance_underwriting': '💰',
                'doc_proposal': '📄',
                'alpine_permitting': '📜',
                'alpine_property_mgmt': '🏢',
                'massdwell_factory_ops': '🏭',
                'laser_sales_engineer': '🔧'
            };
            return icons[agentId] || '🤖';
        },
        
        // Handle events from the bridge
        handleBridgeEvent(event) {
            // Skip heartbeats from activity feed
            if (event.type === 'heartbeat') return;
            
            // Map event to activity
            let activity = null;
            
            switch (event.type) {
                case 'connected':
                    // Already handled in onopen
                    return;
                    
                case 'tool':
                    activity = {
                        type: 'tool',
                        icon: event.icon || '🔧',
                        message: event.message || `Tool: ${event.details?.tool || 'unknown'}`,
                        detail: event.detail || event.details?.raw?.substring(0, 100),
                        timestamp: event.timestamp,
                        level: event.level
                    };
                    // Update agent status
                    this.setAgentWorking('chief_of_staff', event.message || event.details?.tool);
                    break;
                    
                case 'agent':
                    activity = {
                        type: 'agent',
                        icon: event.icon || '🤖',
                        message: event.message || 'Agent activity',
                        detail: event.detail || event.details?.raw?.substring(0, 100),
                        timestamp: event.timestamp,
                        level: event.level
                    };
                    break;
                    
                case 'message':
                    activity = {
                        type: 'message',
                        icon: event.icon || '💬',
                        message: event.message || 'Message event',
                        detail: event.detail || event.details?.raw?.substring(0, 100),
                        timestamp: event.timestamp,
                        level: event.level
                    };
                    break;
                    
                case 'command':
                    activity = {
                        type: 'command',
                        icon: event.icon || '⚡',
                        message: event.message || 'Command executed',
                        detail: event.detail || event.details?.raw?.substring(0, 100),
                        timestamp: event.timestamp,
                        level: event.level
                    };
                    break;
                    
                case 'complete':
                    activity = {
                        type: 'complete',
                        icon: event.icon || '✅',
                        message: event.message || 'Task complete',
                        detail: event.detail,
                        timestamp: event.timestamp,
                        level: event.level
                    };
                    break;
                    
                case 'system':
                    activity = {
                        type: 'system',
                        icon: event.icon || '🔌',
                        message: event.message || 'System event',
                        detail: event.detail,
                        timestamp: event.timestamp,
                        level: event.level
                    };
                    break;
                    
                case 'log':
                    // Only show info/warn/error logs
                    if (['info', 'warn', 'warning', 'error'].includes(event.level)) {
                        activity = {
                            type: 'log',
                            icon: event.level === 'error' ? '❌' : event.level === 'warn' || event.level === 'warning' ? '⚠️' : 'ℹ️',
                            message: event.details?.raw?.substring(0, 80) || 'Log entry',
                            timestamp: event.timestamp,
                            level: event.level
                        };
                    }
                    break;
            }
            
            if (activity) {
                this.addActivity(activity);
            }
        },
        
        // Add activity to feed
        addActivity(activity) {
            // Add to front of array
            this.activityFeed.unshift({
                ...activity,
                id: Date.now() + Math.random(),
                timeAgo: this.formatTimeAgo(activity.timestamp)
            });
            
            // Keep only last 50 entries
            if (this.activityFeed.length > 50) {
                this.activityFeed = this.activityFeed.slice(0, 50);
            }
        },
        
        // Set agent to working state
        setAgentWorking(agentId, task) {
            const agent = this.agents.find(a => a.id === agentId);
            if (agent) {
                agent.status = 'working';
                agent.currentTask = task || 'Processing...';
                agent.lastActivity = 'Just now';
                this.stats.agentsActive = this.agents.filter(a => a.status === 'working').length;
                
                // Reset to idle after 10 seconds of no activity
                setTimeout(() => {
                    if (agent.currentTask === task) {
                        agent.status = 'idle';
                        agent.currentTask = null;
                        this.stats.agentsActive = this.agents.filter(a => a.status === 'working').length;
                    }
                }, 10000);
            }
        },
        
        // Format relative time
        formatTimeAgo(timestamp) {
            if (!timestamp) return 'Unknown';
            const now = new Date();
            const then = new Date(timestamp);
            const diffMs = now - then;
            const diffSec = Math.floor(diffMs / 1000);
            
            if (diffSec < 5) return 'Just now';
            if (diffSec < 60) return `${diffSec}s ago`;
            if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
            if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
            return then.toLocaleDateString();
        },

        updateTime() {
            const now = new Date();
            this.currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            this.currentDate = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        },

        selectEntity(entityId) {
            this.activeEntity = entityId;
        },

        // Getters
        getAllAgents() {
            return this.agents;
        },

        getTotalAgentCount() {
            return this.agents.length;
        },

        getEntityActiveCount(entityId) {
            const entity = this.entities.find(e => e.id === entityId);
            if (!entity) return 0;
            return this.agents.filter(a => 
                entity.agents.includes(a.id) && a.status === 'working'
            ).length;
        },

        getDisplayedAgents() {
            if (!this.activeEntity) {
                return this.agents;
            }
            const entity = this.entities.find(e => e.id === this.activeEntity);
            if (!entity) return [];
            return this.agents.filter(a => entity.agents.includes(a.id));
        },

        getAgentById(agentId) {
            return this.agents.find(a => a.id === agentId);
        },

        getStageCount(stageId) {
            // Use pipeline data from server if available
            if (this._pipeline && this._pipeline[stageId] !== undefined) {
                return this._pipeline[stageId];
            }
            // Fallback to local calculation
            if (stageId === 'incoming') return 0;
            if (stageId === 'routing') return 0;
            if (stageId === 'in_progress') return this.tasks.filter(t => t.status === 'in_progress').length;
            if (stageId === 'review') return this.tasks.filter(t => t.status === 'review').length;
            if (stageId === 'complete') return this.stats.completedToday;
            return 0;
        },

        getFilteredTasks() {
            let filtered = this.tasks;
            
            // Filter by entity
            if (this.activeEntity) {
                filtered = filtered.filter(t => t.entity === this.activeEntity || t.entity === 'global');
            }
            
            // Filter by status
            if (this.taskFilter !== 'all') {
                filtered = filtered.filter(t => t.status === this.taskFilter);
            }
            
            return filtered;
        }
    };
}
