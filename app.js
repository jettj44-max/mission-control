// Mission Control Dashboard
// Data persistence using localStorage

const app = {
    // Data stores
    data: {
        clients: [],
        automations: [],
        pipeline: [],
        systems: [],
        dailyActivities: [],
        weeklyReviews: [],
        goals: {
            annual: '',
            ninetyDay: '',
            weekly: '',
            daily: ''
        }
    },

    // Initialize app
    init() {
        this.loadData();
        this.setupNavigation();
        this.setupForms();
        this.setDefaultDates();
        this.renderAll();
        this.updateKPIs();
    },

    // Load data from localStorage
    loadData() {
        const stored = localStorage.getItem('missionControlData');
        if (stored) {
            this.data = JSON.parse(stored);
        }
    },

    // Save data to localStorage
    saveData() {
        localStorage.setItem('missionControlData', JSON.stringify(this.data));
    },

    // Setup navigation
    setupNavigation() {
        const links = document.querySelectorAll('.nav-link');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
                
                // Update active state
                links.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    },

    // Show specific section
    showSection(sectionId) {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');

        // Refresh data when switching sections
        if (sectionId === 'milestones') {
            this.renderMilestones();
        } else if (sectionId === 'weekly') {
            this.calculateWeeklyRollup();
        } else if (sectionId === 'clients') {
            this.renderClients();
        } else if (sectionId === 'automations') {
            this.renderAutomations();
        } else if (sectionId === 'pipeline') {
            this.renderPipeline();
        } else if (sectionId === 'systems') {
            this.renderSystems();
        } else if (sectionId === 'review') {
            this.loadReviewData();
        } else if (sectionId === 'goals') {
            this.loadGoals();
        }
    },

    // Setup forms
    setupForms() {
        // Activity form
        document.getElementById('activity-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveActivity();
        });

        // Review form
        document.getElementById('review-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveReview();
        });
    },

    // Set default dates
    setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('activity-date').value = today;
        document.getElementById('review-week').value = today;
    },

    // Render all sections
    renderAll() {
        this.updateKPIs();
        this.renderClients();
        this.renderAutomations();
        this.renderPipeline();
        this.renderSystems();
        this.renderMilestones();
        this.calculateWeeklyRollup();
    },

    // Update KPIs
    updateKPIs() {
        // MRR - sum of all active clients
        const mrr = this.data.clients.reduce((sum, c) => sum + parseFloat(c.monthlyFee || 0), 0);
        document.getElementById('kpi-mrr').textContent = `$${mrr.toLocaleString()}`;

        // New revenue this month
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const newRevenue = this.data.clients
            .filter(c => {
                const setupDate = new Date(c.setupDate);
                return setupDate.getMonth() === thisMonth && setupDate.getFullYear() === thisYear;
            })
            .reduce((sum, c) => sum + parseFloat(c.monthlyFee || 0), 0);
        document.getElementById('kpi-new-revenue').textContent = `$${newRevenue.toLocaleString()}`;

        // Clients active
        document.getElementById('kpi-clients').textContent = this.data.clients.length;

        // Pipeline value
        const pipelineValue = this.data.pipeline
            .filter(p => p.stage !== 'Closed Lost')
            .reduce((sum, p) => sum + parseFloat(p.estimatedValue || 0), 0);
        document.getElementById('kpi-pipeline').textContent = `$${pipelineValue.toLocaleString()}`;

        // Close rate
        const closedWon = this.data.pipeline.filter(p => p.stage === 'Closed Won').length;
        const totalClosed = this.data.pipeline.filter(p => p.stage === 'Closed Won' || p.stage === 'Closed Lost').length;
        const closeRate = totalClosed > 0 ? ((closedWon / totalClosed) * 100).toFixed(1) : 0;
        document.getElementById('kpi-close-rate').textContent = `${closeRate}%`;

        // Outreach sent (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const outreach = this.data.dailyActivities
            .filter(a => new Date(a.date) >= weekAgo)
            .reduce((sum, a) => sum + (a.coldEmails || 0) + (a.dmsSent || 0) + (a.followups || 0), 0);
        document.getElementById('kpi-outreach').textContent = outreach;

        // Calls booked (from pipeline in "Booked Call" stage)
        const callsBooked = this.data.pipeline.filter(p => p.stage === 'Booked Call').length;
        document.getElementById('kpi-calls').textContent = callsBooked;

        // Automations deployed
        const automationsDeployed = this.data.automations.filter(a => a.status === 'Live').length;
        document.getElementById('kpi-automations').textContent = automationsDeployed;
    },

    // Render milestones
    renderMilestones() {
        const mrr = this.data.clients.reduce((sum, c) => sum + parseFloat(c.monthlyFee || 0), 0);
        const targets = [500, 2000, 3000, 5000, 6000, 8000, 9000, 10000];
        
        const progressBars = document.querySelectorAll('.progress-fill');
        progressBars.forEach((bar, index) => {
            const target = targets[index];
            const progress = Math.min((mrr / target) * 100, 100);
            bar.style.width = `${progress}%`;
            
            // Highlight current milestone
            const milestoneItem = bar.closest('.milestone-item');
            if (mrr < target && (index === 0 || mrr >= targets[index - 1])) {
                milestoneItem.classList.add('current');
            } else {
                milestoneItem.classList.remove('current');
            }
        });

        // Calculate projection based on pipeline
        const pipelineValue = this.data.pipeline
            .filter(p => p.stage !== 'Closed Lost')
            .reduce((sum, p) => sum + (parseFloat(p.estimatedValue || 0) * (parseFloat(p.closeProbability || 0) / 100)), 0);
        
        const projected = mrr + pipelineValue;
        document.getElementById('projection-value').textContent = `$${projected.toLocaleString()}/month`;
    },

    // Save daily activity
    saveActivity() {
        const date = document.getElementById('activity-date').value;
        const activity = {
            date,
            coldEmails: parseInt(document.getElementById('cold-emails').value) || 0,
            dmsSent: parseInt(document.getElementById('dms-sent').value) || 0,
            callsMade: parseInt(document.getElementById('calls-made').value) || 0,
            followups: parseInt(document.getElementById('followups-sent').value) || 0,
            leadsScraped: parseInt(document.getElementById('leads-scraped').value) || 0
        };

        // Remove existing entry for this date
        this.data.dailyActivities = this.data.dailyActivities.filter(a => a.date !== date);
        
        // Add new entry
        this.data.dailyActivities.push(activity);
        this.saveData();
        
        alert('Activity saved successfully');
        this.updateKPIs();
    },

    // Calculate weekly rollup
    calculateWeeklyRollup() {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weekActivities = this.data.dailyActivities.filter(a => new Date(a.date) >= weekAgo);
        
        const totalOutreach = weekActivities.reduce((sum, a) => 
            sum + (a.coldEmails || 0) + (a.dmsSent || 0) + (a.followups || 0), 0);
        
        document.getElementById('weekly-outreach').textContent = totalOutreach;
        
        // These would need more data tracking for accurate calculations
        // For now, show placeholders based on pipeline data
        const weekLeads = this.data.pipeline.filter(p => {
            const contacted = new Date(p.dateAdded || Date.now());
            return contacted >= weekAgo;
        }).length;
        
        const replyRate = totalOutreach > 0 ? ((weekLeads / totalOutreach) * 100).toFixed(1) : 0;
        const bookRate = totalOutreach > 0 ? ((this.data.pipeline.filter(p => p.stage === 'Booked Call').length / totalOutreach) * 100).toFixed(1) : 0;
        
        const closedWon = this.data.pipeline.filter(p => p.stage === 'Closed Won').length;
        const totalClosed = this.data.pipeline.filter(p => p.stage === 'Closed Won' || p.stage === 'Closed Lost').length;
        const closeRate = totalClosed > 0 ? ((closedWon / totalClosed) * 100).toFixed(1) : 0;
        const conversionRate = totalOutreach > 0 ? ((closedWon / totalOutreach) * 100).toFixed(1) : 0;
        
        document.getElementById('weekly-reply-rate').textContent = `${replyRate}%`;
        document.getElementById('weekly-book-rate').textContent = `${bookRate}%`;
        document.getElementById('weekly-close-rate').textContent = `${closeRate}%`;
        document.getElementById('weekly-conversion-rate').textContent = `${conversionRate}%`;
    },

    // Client CRUD
    showClientModal(client = null) {
        const isEdit = client !== null;
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        
        modalBody.innerHTML = `
            <h2>${isEdit ? 'Edit' : 'Add'} Client</h2>
            <form id="client-form">
                <div class="form-group">
                    <label>Client Name</label>
                    <input type="text" id="client-name" value="${client?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Automation Type</label>
                    <input type="text" id="client-automation" value="${client?.automationType || ''}" required>
                </div>
                <div class="form-group">
                    <label>Setup Date</label>
                    <input type="date" id="client-setup" value="${client?.setupDate || ''}" required>
                </div>
                <div class="form-group">
                    <label>Monthly Fee</label>
                    <input type="number" id="client-fee" value="${client?.monthlyFee || ''}" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Health Status</label>
                    <select id="client-health">
                        <option value="Healthy" ${client?.health === 'Healthy' ? 'selected' : ''}>Healthy</option>
                        <option value="Warning" ${client?.health === 'Warning' ? 'selected' : ''}>Warning</option>
                        <option value="Down" ${client?.health === 'Down' ? 'selected' : ''}>Down</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Last Check Date</label>
                    <input type="date" id="client-lastcheck" value="${client?.lastCheck || ''}">
                </div>
                <div class="form-group">
                    <label>Renewal Date</label>
                    <input type="date" id="client-renewal" value="${client?.renewalDate || ''}">
                </div>
                <button type="submit" class="btn-primary">Save Client</button>
            </form>
        `;
        
        modal.classList.add('active');
        
        document.getElementById('client-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveClient(client?.id);
        });
    },

    saveClient(id = null) {
        const clientData = {
            id: id || Date.now().toString(),
            name: document.getElementById('client-name').value,
            automationType: document.getElementById('client-automation').value,
            setupDate: document.getElementById('client-setup').value,
            monthlyFee: parseFloat(document.getElementById('client-fee').value),
            health: document.getElementById('client-health').value,
            lastCheck: document.getElementById('client-lastcheck').value,
            renewalDate: document.getElementById('client-renewal').value
        };

        if (id) {
            const index = this.data.clients.findIndex(c => c.id === id);
            this.data.clients[index] = clientData;
        } else {
            this.data.clients.push(clientData);
        }

        this.saveData();
        this.closeModal();
        this.renderClients();
        this.updateKPIs();
    },

    deleteClient(id) {
        if (confirm('Delete this client?')) {
            this.data.clients = this.data.clients.filter(c => c.id !== id);
            this.saveData();
            this.renderClients();
            this.updateKPIs();
        }
    },

    renderClients() {
        const tbody = document.getElementById('clients-table-body');
        tbody.innerHTML = this.data.clients.map(client => `
            <tr>
                <td>${client.name}</td>
                <td>${client.automationType}</td>
                <td>${client.setupDate}</td>
                <td>$${parseFloat(client.monthlyFee).toLocaleString()}</td>
                <td class="status-${client.health.toLowerCase()}">${client.health}</td>
                <td>${client.lastCheck || 'N/A'}</td>
                <td>${client.renewalDate || 'N/A'}</td>
                <td>
                    <button class="btn-edit" onclick="app.showClientModal(${JSON.stringify(client).replace(/"/g, '&quot;')})">Edit</button>
                    <button class="btn-danger" onclick="app.deleteClient('${client.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    },

    // Automation CRUD
    showAutomationModal(automation = null) {
        const isEdit = automation !== null;
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        
        modalBody.innerHTML = `
            <h2>${isEdit ? 'Edit' : 'Add'} Automation</h2>
            <form id="automation-form">
                <div class="form-group">
                    <label>Automation Name</label>
                    <input type="text" id="auto-name" value="${automation?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Niche</label>
                    <input type="text" id="auto-niche" value="${automation?.niche || ''}" required>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="auto-status">
                        <option value="Idea" ${automation?.status === 'Idea' ? 'selected' : ''}>Idea</option>
                        <option value="Built" ${automation?.status === 'Built' ? 'selected' : ''}>Built</option>
                        <option value="Tested" ${automation?.status === 'Tested' ? 'selected' : ''}>Tested</option>
                        <option value="Selling" ${automation?.status === 'Selling' ? 'selected' : ''}>Selling</option>
                        <option value="Live" ${automation?.status === 'Live' ? 'selected' : ''}>Live</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Time to Deploy (hours)</label>
                    <input type="number" id="auto-time" value="${automation?.timeToDeploy || ''}" required>
                </div>
                <div class="form-group">
                    <label>Revenue Impact ($)</label>
                    <input type="number" id="auto-revenue" value="${automation?.revenueImpact || ''}" step="0.01" required>
                </div>
                <button type="submit" class="btn-primary">Save Automation</button>
            </form>
        `;
        
        modal.classList.add('active');
        
        document.getElementById('automation-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAutomation(automation?.id);
        });
    },

    saveAutomation(id = null) {
        const autoData = {
            id: id || Date.now().toString(),
            name: document.getElementById('auto-name').value,
            niche: document.getElementById('auto-niche').value,
            status: document.getElementById('auto-status').value,
            timeToDeploy: parseFloat(document.getElementById('auto-time').value),
            revenueImpact: parseFloat(document.getElementById('auto-revenue').value)
        };

        if (id) {
            const index = this.data.automations.findIndex(a => a.id === id);
            this.data.automations[index] = autoData;
        } else {
            this.data.automations.push(autoData);
        }

        this.saveData();
        this.closeModal();
        this.renderAutomations();
        this.updateKPIs();
    },

    deleteAutomation(id) {
        if (confirm('Delete this automation?')) {
            this.data.automations = this.data.automations.filter(a => a.id !== id);
            this.saveData();
            this.renderAutomations();
            this.updateKPIs();
        }
    },

    renderAutomations() {
        const tbody = document.getElementById('automations-table-body');
        tbody.innerHTML = this.data.automations.map(auto => `
            <tr>
                <td>${auto.name}</td>
                <td>${auto.niche}</td>
                <td>${auto.status}</td>
                <td>${auto.timeToDeploy}h</td>
                <td>$${parseFloat(auto.revenueImpact).toLocaleString()}</td>
                <td>
                    <button class="btn-edit" onclick="app.showAutomationModal(${JSON.stringify(auto).replace(/"/g, '&quot;')})">Edit</button>
                    <button class="btn-danger" onclick="app.deleteAutomation('${auto.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    },

    // Pipeline CRUD
    showPipelineModal(lead = null) {
        const isEdit = lead !== null;
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        
        modalBody.innerHTML = `
            <h2>${isEdit ? 'Edit' : 'Add'} Lead</h2>
            <form id="pipeline-form">
                <div class="form-group">
                    <label>Lead Name</label>
                    <input type="text" id="lead-name" value="${lead?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Source</label>
                    <input type="text" id="lead-source" value="${lead?.source || ''}" required>
                </div>
                <div class="form-group">
                    <label>Estimated Value ($)</label>
                    <input type="number" id="lead-value" value="${lead?.estimatedValue || ''}" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Close Probability (%)</label>
                    <input type="number" id="lead-probability" value="${lead?.closeProbability || ''}" min="0" max="100" required>
                </div>
                <div class="form-group">
                    <label>Stage</label>
                    <select id="lead-stage">
                        <option value="Prospect" ${lead?.stage === 'Prospect' ? 'selected' : ''}>Prospect</option>
                        <option value="Identified" ${lead?.stage === 'Identified' ? 'selected' : ''}>Identified</option>
                        <option value="Contacted" ${lead?.stage === 'Contacted' ? 'selected' : ''}>Contacted</option>
                        <option value="Booked Call" ${lead?.stage === 'Booked Call' ? 'selected' : ''}>Booked Call</option>
                        <option value="Proposal Sent" ${lead?.stage === 'Proposal Sent' ? 'selected' : ''}>Proposal Sent</option>
                        <option value="Closed Won" ${lead?.stage === 'Closed Won' ? 'selected' : ''}>Closed Won</option>
                        <option value="Closed Lost" ${lead?.stage === 'Closed Lost' ? 'selected' : ''}>Closed Lost</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Outreach Tasks</label>
                    <input type="text" id="lead-outreach" value="${lead?.outreach || ''}">
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea id="lead-notes" rows="3">${lead?.notes || ''}</textarea>
                </div>
                <button type="submit" class="btn-primary">Save Lead</button>
            </form>
        `;
        
        modal.classList.add('active');
        
        document.getElementById('pipeline-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePipelineLead(lead?.id);
        });
    },

    savePipelineLead(id = null) {
        const leadData = {
            id: id || Date.now().toString(),
            name: document.getElementById('lead-name').value,
            source: document.getElementById('lead-source').value,
            estimatedValue: parseFloat(document.getElementById('lead-value').value),
            closeProbability: parseFloat(document.getElementById('lead-probability').value),
            stage: document.getElementById('lead-stage').value,
            outreach: document.getElementById('lead-outreach').value,
            notes: document.getElementById('lead-notes').value,
            dateAdded: id ? this.data.pipeline.find(l => l.id === id)?.dateAdded : new Date().toISOString()
        };

        if (id) {
            const index = this.data.pipeline.findIndex(l => l.id === id);
            this.data.pipeline[index] = leadData;
        } else {
            this.data.pipeline.push(leadData);
        }

        this.saveData();
        this.closeModal();
        this.renderPipeline();
        this.updateKPIs();
    },

    deletePipelineLead(id) {
        if (confirm('Delete this lead?')) {
            this.data.pipeline = this.data.pipeline.filter(l => l.id !== id);
            this.saveData();
            this.renderPipeline();
            this.updateKPIs();
        }
    },

    renderPipeline() {
        const tbody = document.getElementById('pipeline-table-body');
        tbody.innerHTML = this.data.pipeline.map(lead => `
            <tr>
                <td>${lead.name}</td>
                <td>${lead.source}</td>
                <td>$${parseFloat(lead.estimatedValue).toLocaleString()}</td>
                <td>${lead.closeProbability}%</td>
                <td>${lead.stage}</td>
                <td>${lead.outreach || 'N/A'}</td>
                <td>${lead.notes || 'N/A'}</td>
                <td>
                    <button class="btn-edit" onclick="app.showPipelineModal(${JSON.stringify(lead).replace(/"/g, '&quot;')})">Edit</button>
                    <button class="btn-danger" onclick="app.deletePipelineLead('${lead.id}')">Delete</button>
                </td>
            </tr>
        `).join('');

        // Update pipeline stats
        const totalValue = this.data.pipeline
            .filter(l => l.stage !== 'Closed Lost')
            .reduce((sum, l) => sum + parseFloat(l.estimatedValue || 0), 0);
        
        const weightedValue = this.data.pipeline
            .filter(l => l.stage !== 'Closed Lost')
            .reduce((sum, l) => sum + (parseFloat(l.estimatedValue || 0) * (parseFloat(l.closeProbability || 0) / 100)), 0);
        
        const closedWon = this.data.pipeline.filter(l => l.stage === 'Closed Won').length;
        const totalClosed = this.data.pipeline.filter(l => l.stage === 'Closed Won' || l.stage === 'Closed Lost').length;
        const closeRate = totalClosed > 0 ? ((closedWon / totalClosed) * 100).toFixed(1) : 0;

        document.getElementById('total-pipeline-value').textContent = `$${totalValue.toLocaleString()}`;
        document.getElementById('weighted-revenue').textContent = `$${weightedValue.toLocaleString()}`;
        document.getElementById('pipeline-close-rate').textContent = `${closeRate}%`;
    },

    // Systems CRUD
    showSystemModal(system = null) {
        const isEdit = system !== null;
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        
        modalBody.innerHTML = `
            <h2>${isEdit ? 'Edit' : 'Add'} System</h2>
            <form id="system-form">
                <div class="form-group">
                    <label>Agent Name</label>
                    <input type="text" id="system-name" value="${system?.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Function</label>
                    <input type="text" id="system-function" value="${system?.function || ''}" required>
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select id="system-status">
                        <option value="Active" ${system?.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${system?.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="Failing" ${system?.status === 'Failing' ? 'selected' : ''}>Failing</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Last Run</label>
                    <input type="datetime-local" id="system-lastrun" value="${system?.lastRun || ''}">
                </div>
                <div class="form-group">
                    <label>Success Rate (%)</label>
                    <input type="number" id="system-success" value="${system?.successRate || ''}" min="0" max="100" required>
                </div>
                <div class="form-group">
                    <label>Linked Workflows</label>
                    <input type="text" id="system-workflows" value="${system?.workflows || ''}">
                </div>
                <div class="form-group">
                    <label>Impact Metric</label>
                    <input type="text" id="system-impact" value="${system?.impact || ''}">
                </div>
                <button type="submit" class="btn-primary">Save System</button>
            </form>
        `;
        
        modal.classList.add('active');
        
        document.getElementById('system-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSystem(system?.id);
        });
    },

    saveSystem(id = null) {
        const systemData = {
            id: id || Date.now().toString(),
            name: document.getElementById('system-name').value,
            function: document.getElementById('system-function').value,
            status: document.getElementById('system-status').value,
            lastRun: document.getElementById('system-lastrun').value,
            successRate: parseFloat(document.getElementById('system-success').value),
            workflows: document.getElementById('system-workflows').value,
            impact: document.getElementById('system-impact').value
        };

        if (id) {
            const index = this.data.systems.findIndex(s => s.id === id);
            this.data.systems[index] = systemData;
        } else {
            this.data.systems.push(systemData);
        }

        this.saveData();
        this.closeModal();
        this.renderSystems();
    },

    deleteSystem(id) {
        if (confirm('Delete this system?')) {
            this.data.systems = this.data.systems.filter(s => s.id !== id);
            this.saveData();
            this.renderSystems();
        }
    },

    filterSystems(filter) {
        // Update active tab
        const tabs = document.querySelectorAll('.filter-tab');
        tabs.forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');

        // Filter systems
        let filtered = this.data.systems;
        if (filter === 'active') {
            filtered = this.data.systems.filter(s => s.status === 'Active');
        } else if (filter === 'failing') {
            filtered = this.data.systems.filter(s => s.status === 'Failing');
        }

        const tbody = document.getElementById('systems-table-body');
        tbody.innerHTML = filtered.map(system => `
            <tr>
                <td>${system.name}</td>
                <td>${system.function}</td>
                <td class="status-${system.status.toLowerCase()}">${system.status}</td>
                <td>${system.lastRun ? new Date(system.lastRun).toLocaleString() : 'N/A'}</td>
                <td>${system.successRate}%</td>
                <td>${system.workflows || 'N/A'}</td>
                <td>${system.impact || 'N/A'}</td>
                <td>
                    <button class="btn-edit" onclick="app.showSystemModal(${JSON.stringify(system).replace(/"/g, '&quot;')})">Edit</button>
                    <button class="btn-danger" onclick="app.deleteSystem('${system.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    },

    renderSystems() {
        this.filterSystems('all');
    },

    // Weekly Review
    loadReviewData() {
        const mrr = this.data.clients.reduce((sum, c) => sum + parseFloat(c.monthlyFee || 0), 0);
        const thisMonth = new Date().getMonth();
        const thisYear = new Date().getFullYear();
        const newRevenue = this.data.clients
            .filter(c => {
                const setupDate = new Date(c.setupDate);
                return setupDate.getMonth() === thisMonth && setupDate.getFullYear() === thisYear;
            })
            .reduce((sum, c) => sum + parseFloat(c.monthlyFee || 0), 0);

        document.getElementById('review-revenue').textContent = `MRR: $${mrr.toLocaleString()} | New Revenue: $${newRevenue.toLocaleString()}`;

        const pipelineValue = this.data.pipeline
            .filter(p => p.stage !== 'Closed Lost')
            .reduce((sum, p) => sum + parseFloat(p.estimatedValue || 0), 0);
        document.getElementById('review-pipeline-value').textContent = `Pipeline Value: $${pipelineValue.toLocaleString()}`;

        document.getElementById('review-goal-progress').textContent = `Clients: ${this.data.clients.length} / Target: 5`;
    },

    saveReview() {
        const review = {
            id: Date.now().toString(),
            weekEnding: document.getElementById('review-week').value,
            wins: document.getElementById('review-wins').value,
            misses: document.getElementById('review-misses').value,
            issues: document.getElementById('review-issues').value,
            improvements: document.getElementById('review-improvements').value,
            focus: document.getElementById('review-focus').value
        };

        this.data.weeklyReviews.push(review);
        this.saveData();
        alert('Review saved successfully');
        document.getElementById('review-form').reset();
        this.setDefaultDates();
    },

    // Goals
    loadGoals() {
        document.getElementById('goal-annual').value = this.data.goals.annual || '';
        document.getElementById('goal-90day').value = this.data.goals.ninetyDay || '';
        document.getElementById('goal-weekly').value = this.data.goals.weekly || '';
        document.getElementById('goal-daily').value = this.data.goals.daily || '';
    },

    saveGoals() {
        this.data.goals = {
            annual: document.getElementById('goal-annual').value,
            ninetyDay: document.getElementById('goal-90day').value,
            weekly: document.getElementById('goal-weekly').value,
            daily: document.getElementById('goal-daily').value
        };
        this.saveData();
        alert('Goals saved successfully');
    },

    // Modal controls
    closeModal() {
        document.getElementById('modal').classList.remove('active');
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
