// Clawson Mission Control V1.0 - Application Logic

function missionControl() {
    return {
        // State
        activeEntity: null,
        activeSection: 'overview',
        currentTime: '',
        currentDate: '',
        
        // Global Stats - Real counts only
        globalStats: {
            totalTasks: 0,
            pipelineItems: 0,
            activeAgents: 10,
            systemHealth: 100
        },
        
        // Entity Data - Real metrics only, no fake activities
        entities: {
            massdwell: {
                name: 'MassDwell',
                tagline: 'Modular ADU Manufacturing',
                icon: '🏠',
                activeProjects: 0,
                pipelineValue: 0,
                kpis: [
                    { label: 'Active Projects', value: '0', trend: 0, icon: '📦' },
                    { label: 'Units in Production', value: '0', trend: 0, icon: '🏭' },
                    { label: 'Pipeline Value', value: '$0', trend: 0, icon: '💰' },
                    { label: 'Avg. Completion', value: '10 wks', trend: 0, icon: '⏱️' }
                ],
                pipelineStages: [
                    { name: 'Leads', count: 0, value: '$0' },
                    { name: 'Site Eval', count: 0, value: '$0' },
                    { name: 'Proposal', count: 0, value: '$0' },
                    { name: 'Contract', count: 0, value: '$0' },
                    { name: 'Production', count: 0, value: '$0' }
                ],
                tasks: [],
                pipelineItems: [],
                team: []
            },
            atlantic: {
                name: 'Atlantic Laser',
                tagline: 'Laser Welding Distribution',
                icon: '⚡',
                openLeads: 0,
                quotePipeline: 0,
                kpis: [
                    { label: 'Open Leads', value: '0', trend: 0, icon: '📋' },
                    { label: 'Quote Pipeline', value: '$0', trend: 0, icon: '💵' },
                    { label: 'Units Sold (YTD)', value: '0', trend: 0, icon: '📈' },
                    { label: 'Avg. Deal Size', value: '$0', trend: 0, icon: '🎯' }
                ],
                pipelineStages: [
                    { name: 'Inquiry', count: 0, value: '$0' },
                    { name: 'Demo', count: 0, value: '$0' },
                    { name: 'Quote', count: 0, value: '$0' },
                    { name: 'Negotiation', count: 0, value: '$0' },
                    { name: 'Closed', count: 0, value: '$0' }
                ],
                tasks: [],
                pipelineItems: [],
                team: []
            },
            alpine: {
                name: 'Alpine Property',
                tagline: 'Real Estate Investment & Dev',
                icon: '🏔️',
                properties: 12,  // Real: 12 properties in portfolio
                aum: 0,  // Unknown - needs real data
                kpis: [
                    { label: 'Properties', value: '12', trend: 0, icon: '🏢' },
                    { label: 'AUM', value: 'TBD', trend: 0, icon: '💰' },
                    { label: 'Occupancy Rate', value: 'TBD', trend: 0, icon: '📊' },
                    { label: 'Active Deals', value: '0', trend: 0, icon: '🤝' }
                ],
                pipelineStages: [
                    { name: 'Prospecting', count: 0, value: '$0' },
                    { name: 'Due Diligence', count: 0, value: '$0' },
                    { name: 'LOI', count: 0, value: '$0' },
                    { name: 'Under Contract', count: 0, value: '$0' },
                    { name: 'Closed', count: 0, value: '$0' }
                ],
                tasks: [],
                pipelineItems: [],
                team: [
                    { id: 1, name: 'Steve Vettori', role: 'Principal', activeTasks: 0, workload: 0, email: 'steve@alpinepg.com' }
                ]
            }
        },
        
        // Sidebar Navigation
        sidebarItems: [
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'tasks', label: 'Tasks', icon: '✅' },
            { id: 'pipeline', label: 'Pipeline', icon: '📈' },
            { id: 'team', label: 'Team', icon: '👥' },
            { id: 'analytics', label: 'Analytics', icon: '📉' },
            { id: 'settings', label: 'Settings', icon: '⚙️' }
        ],
        
        // Task Columns
        taskColumns: [
            { id: 'todo', title: 'To Do' },
            { id: 'in-progress', title: 'In Progress' },
            { id: 'blocked', title: 'Blocked' },
            { id: 'done', title: 'Done' }
        ],
        
        // Recent Activity - Empty until real activity happens
        recentActivity: [],
        
        // Alerts - Empty until real alerts
        alerts: [],
        
        // Max stage count for chart scaling
        maxStageCount: 1,
        
        // Initialize
        init() {
            this.updateTime();
            setInterval(() => this.updateTime(), 1000);
            
            // Initialize charts after DOM is ready
            this.$watch('activeSection', (value) => {
                if (value === 'overview') {
                    this.$nextTick(() => this.initOverviewCharts());
                }
                if (value === 'analytics') {
                    this.$nextTick(() => this.initAnalyticsCharts());
                }
            });
            
            this.$watch('activeEntity', (value) => {
                if (value && this.activeSection === 'overview') {
                    this.$nextTick(() => this.initOverviewCharts());
                }
            });
        },
        
        // Time update
        updateTime() {
            const now = new Date();
            this.currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            this.currentDate = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
        },
        
        // Entity selection
        selectEntity(entity) {
            this.activeEntity = entity;
            this.activeSection = 'overview';
        },
        
        // Getters
        getEntityName() {
            return this.activeEntity ? this.entities[this.activeEntity].name : '';
        },
        
        getEntityTagline() {
            return this.activeEntity ? this.entities[this.activeEntity].tagline : '';
        },
        
        getEntityIcon() {
            return this.activeEntity ? this.entities[this.activeEntity].icon : '';
        },
        
        getSectionTitle() {
            const section = this.sidebarItems.find(s => s.id === this.activeSection);
            return section ? section.label : '';
        },
        
        getSectionSubtitle() {
            const subtitles = {
                'overview': 'High-level KPIs and system health',
                'tasks': 'Manage and track all active tasks',
                'pipeline': 'Monitor deal flow and conversions',
                'team': 'Team workload and collaboration',
                'analytics': 'Insights and performance trends',
                'settings': 'Dashboard preferences and data'
            };
            return subtitles[this.activeSection] || '';
        },
        
        getCurrentKPIs() {
            return this.activeEntity ? this.entities[this.activeEntity].kpis : [];
        },
        
        getTasksForColumn(columnId) {
            if (!this.activeEntity) return [];
            return this.entities[this.activeEntity].tasks.filter(t => t.status === columnId);
        },
        
        getPipelineStages() {
            return this.activeEntity ? this.entities[this.activeEntity].pipelineStages : [];
        },
        
        getPipelineItems() {
            return this.activeEntity ? this.entities[this.activeEntity].pipelineItems : [];
        },
        
        getTeamMembers() {
            return this.activeEntity ? this.entities[this.activeEntity].team : [];
        },
        
        // Chart initialization
        initOverviewCharts() {
            // Performance Chart
            const perfCtx = document.getElementById('performanceChart');
            if (perfCtx) {
                if (perfCtx.chart) {
                    perfCtx.chart.destroy();
                }
                
                const colors = {
                    massdwell: { border: 'rgb(22, 163, 74)', bg: 'rgba(22, 163, 74, 0.1)' },
                    atlantic: { border: 'rgb(37, 99, 235)', bg: 'rgba(37, 99, 235, 0.1)' },
                    alpine: { border: 'rgb(71, 85, 105)', bg: 'rgba(71, 85, 105, 0.1)' }
                };
                
                const color = colors[this.activeEntity] || colors.massdwell;
                
                perfCtx.chart = new Chart(perfCtx, {
                    type: 'line',
                    data: {
                        labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
                        datasets: [{
                            label: 'Performance',
                            data: [0, 0, 0, 0, 0],
                            borderColor: color.border,
                            backgroundColor: color.bg,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, max: 100 }
                        }
                    }
                });
            }
            
            // Pipeline Chart
            const pipeCtx = document.getElementById('pipelineChart');
            if (pipeCtx) {
                if (pipeCtx.chart) {
                    pipeCtx.chart.destroy();
                }
                
                const stages = this.getPipelineStages();
                const bgColors = {
                    massdwell: ['#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e'],
                    atlantic: ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6'],
                    alpine: ['#f1f5f9', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b']
                };
                
                pipeCtx.chart = new Chart(pipeCtx, {
                    type: 'doughnut',
                    data: {
                        labels: stages.map(s => s.name),
                        datasets: [{
                            data: stages.map(s => s.count || 1), // Show empty state
                            backgroundColor: bgColors[this.activeEntity] || bgColors.massdwell
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'right' } }
                    }
                });
            }
        },
        
        initAnalyticsCharts() {
            // Monthly Chart
            const monthlyCtx = document.getElementById('monthlyChart');
            if (monthlyCtx) {
                if (monthlyCtx.chart) {
                    monthlyCtx.chart.destroy();
                }
                
                const colors = {
                    massdwell: 'rgb(22, 163, 74)',
                    atlantic: 'rgb(37, 99, 235)',
                    alpine: 'rgb(71, 85, 105)'
                };
                
                monthlyCtx.chart = new Chart(monthlyCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
                        datasets: [{
                            label: 'Revenue',
                            data: [0, 0, 0, 0, 0, 0],
                            backgroundColor: colors[this.activeEntity] || colors.massdwell
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                    }
                });
            }
            
            // Conversion Chart
            const convCtx = document.getElementById('conversionChart');
            if (convCtx) {
                if (convCtx.chart) {
                    convCtx.chart.destroy();
                }
                
                convCtx.chart = new Chart(convCtx, {
                    type: 'line',
                    data: {
                        labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
                        datasets: [{
                            label: 'Conversion Rate',
                            data: [0, 0, 0, 0, 0, 0],
                            borderColor: 'rgb(168, 85, 247)',
                            backgroundColor: 'rgba(168, 85, 247, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { 
                                beginAtZero: true,
                                ticks: { callback: value => value + '%' }
                            }
                        }
                    }
                });
            }
        }
    };
}
