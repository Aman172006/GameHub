// ===== DASHBOARD FUNCTIONALITY - GAMEHUB =====

/**
 * Dashboard Management System
 * Handles common dashboard functionality for both players and organizers
 */
class DashboardManager {
    constructor() {
        this.refreshInterval = null;
        this.lastRefresh = null;
        this.autoRefreshEnabled = true;
        this.refreshRate = 30000; // 30 seconds
        this.init();
    }
    
    init() {
        this.setupAutoRefresh();
        this.setupNotifications();
        this.setupSidebarToggle();
        this.setupSearchFunctionality();
        this.loadUserPreferences();
    }
    
    // ===== AUTO REFRESH SYSTEM =====
    setupAutoRefresh() {
        if (this.autoRefreshEnabled) {
            this.refreshInterval = setInterval(() => {
                this.refreshDashboardData();
            }, this.refreshRate);
        }
        
        // Pause refresh when page is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAutoRefresh();
            } else {
                this.resumeAutoRefresh();
            }
        });
    }
    
    async refreshDashboardData() {
        try {
            const user = auth.getCurrentUser();
            if (!user) return;
            
            if (user.role === 'player') {
                await this.refreshPlayerData();
            } else if (user.role === 'organizer') {
                await this.refreshOrganizerData();
            }
            
            this.lastRefresh = new Date();
            this.updateLastRefreshTime();
            
        } catch (error) {
            console.error('Dashboard refresh error:', error);
        }
    }
    
    async refreshPlayerData() {
        try {
            // Refresh player statistics
            const registrations = await api.getMyRegistrations();
            this.updatePlayerStats(registrations);
            
            // Refresh upcoming events
            this.updateUpcomingEvents(registrations);
            
            // Refresh activity feed
            this.updateActivityFeed(registrations);
            
        } catch (error) {
            console.error('Player data refresh error:', error);
        }
    }
    
    async refreshOrganizerData() {
        try {
            // Refresh organizer statistics
            const events = await api.getMyEvents();
            this.updateOrganizerStats(events);
            
            // Refresh event overview
            this.updateEventOverview(events);
            
            // Refresh recent registrations
            this.updateRecentRegistrations(events);
            
        } catch (error) {
            console.error('Organizer data refresh error:', error);
        }
    }
    
    pauseAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    resumeAutoRefresh() {
        if (!this.refreshInterval && this.autoRefreshEnabled) {
            this.setupAutoRefresh();
        }
    }
    
    // ===== SIDEBAR MANAGEMENT =====
    setupSidebarToggle() {
        const sidebar = document.querySelector('.dashboard-sidebar');
        const toggleButton = document.querySelector('.sidebar-toggle');
        const mainContent = document.querySelector('.dashboard-main');
        
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }
        
        // Handle mobile sidebar overlay
        if (window.innerWidth <= 768) {
            this.setupMobileSidebar();
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                this.setupMobileSidebar();
            } else {
                this.setupDesktopSidebar();
            }
        });
    }
    
    toggleSidebar() {
        const sidebar = document.querySelector('.dashboard-sidebar');
        sidebar.classList.toggle('collapsed');
        sidebar.classList.toggle('show');
        
        // Save sidebar state
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    }
    
    setupMobileSidebar() {
        const sidebar = document.querySelector('.dashboard-sidebar');
        const overlay = this.createSidebarOverlay();
        
        // Add overlay click handler
        overlay.addEventListener('click', () => {
            this.closeMobileSidebar();
        });
        
        // Add escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('show')) {
                this.closeMobileSidebar();
            }
        });
    }
    
    setupDesktopSidebar() {
        const sidebar = document.querySelector('.dashboard-sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (overlay) {
            overlay.remove();
        }
        
        // Restore sidebar state
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
        }
    }
    
    createSidebarOverlay() {
        let overlay = document.querySelector('.sidebar-overlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'sidebar-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 999;
                display: none;
            `;
            document.body.appendChild(overlay);
        }
        
        return overlay;
    }
    
    closeMobileSidebar() {
        const sidebar = document.querySelector('.dashboard-sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        sidebar.classList.remove('show');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    // ===== SEARCH FUNCTIONALITY =====
    setupSearchFunctionality() {
        const searchInputs = document.querySelectorAll('[data-search]');
        
        searchInputs.forEach(input => {
            const searchType = input.getAttribute('data-search');
            input.addEventListener('input', AsyncUtils.debounce((e) => {
                this.handleSearch(searchType, e.target.value);
            }, 300));
        });
    }
    
    handleSearch(type, query) {
        switch (type) {
            case 'events':
                this.searchEvents(query);
                break;
            case 'participants':
                this.searchParticipants(query);
                break;
            case 'registrations':
                this.searchRegistrations(query);
                break;
            default:
                console.warn('Unknown search type:', type);
        }
    }
    
    searchEvents(query) {
        const eventCards = document.querySelectorAll('.event-card');
        const lowerQuery = query.toLowerCase();
        
        eventCards.forEach(card => {
            const title = card.querySelector('.event-title')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.event-description')?.textContent.toLowerCase() || '';
            const category = card.querySelector('.event-category')?.textContent.toLowerCase() || '';
            
            const matches = title.includes(lowerQuery) || 
                          description.includes(lowerQuery) || 
                          category.includes(lowerQuery);
            
            card.style.display = matches ? 'block' : 'none';
        });
    }
    
    // ===== STATS UPDATE METHODS =====
    updatePlayerStats(registrations) {
        const totalElement = document.getElementById('total-registrations');
        const activeElement = document.getElementById('active-registrations');
        
        if (totalElement) {
            totalElement.textContent = registrations.length;
            this.animateNumber(totalElement, registrations.length);
        }
        
        if (activeElement) {
            const activeCount = registrations.filter(reg => 
                reg.status === 'registered' && new Date(reg.event.date) > new Date()
            ).length;
            activeElement.textContent = activeCount;
            this.animateNumber(activeElement, activeCount);
        }
    }
    
    updateOrganizerStats(events) {
        const totalElement = document.getElementById('total-events');
        const activeElement = document.getElementById('active-events');
        const participantsElement = document.getElementById('total-participants');
        
        if (totalElement) {
            totalElement.textContent = events.length;
            this.animateNumber(totalElement, events.length);
        }
        
        if (activeElement) {
            const activeCount = events.filter(event => 
                event.is_active && new Date(event.date) > new Date()
            ).length;
            activeElement.textContent = activeCount;
            this.animateNumber(activeElement, activeCount);
        }
        
        // Update total participants (would need API call for each event)
        // This is simplified for demo purposes
    }
    
    animateNumber(element, targetNumber) {
        const currentNumber = parseInt(element.textContent) || 0;
        const increment = (targetNumber - currentNumber) / 20;
        let current = currentNumber;
        
        const animation = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= targetNumber) || 
                (increment < 0 && current <= targetNumber)) {
                element.textContent = targetNumber;
                clearInterval(animation);
            } else {
                element.textContent = Math.round(current);
            }
        }, 50);
    }
    
    // ===== ACTIVITY FEED UPDATES =====
    updateActivityFeed(data) {
        const activityFeed = document.getElementById('recent-activity');
        if (!activityFeed) return;
        
        // Sort activities by timestamp
        const activities = this.generateActivities(data);
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        activityFeed.innerHTML = activities.slice(0, 10).map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-time">${DateUtils.getTimeAgo(activity.timestamp)}</div>
                </div>
                ${activity.action ? `
                    <div class="activity-action">
                        <button class="btn-action" onclick="${activity.action.onclick}">
                            <i class="${activity.action.icon}"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
    
    generateActivities(registrations) {
        return registrations.map(reg => ({
            type: 'registration',
            icon: 'fas fa-plus-circle',
            text: `Registered for <strong>${reg.event.title}</strong>`,
            timestamp: reg.registered_at || reg.created_at,
            action: {
                icon: 'fas fa-eye',
                onclick: `viewEventDetails(${reg.event.id})`
            }
        }));
    }
    
    // ===== NOTIFICATION SYSTEM =====
    setupNotifications() {
        this.checkForNotifications();
        
        // Check for notifications every 5 minutes
        setInterval(() => {
            this.checkForNotifications();
        }, 5 * 60 * 1000);
    }
    
    async checkForNotifications() {
        try {
            const user = auth.getCurrentUser();
            if (!user) return;
            
            if (user.role === 'player') {
                await this.checkPlayerNotifications();
            } else if (user.role === 'organizer') {
                await this.checkOrganizerNotifications();
            }
            
        } catch (error) {
            console.error('Notification check error:', error);
        }
    }
    
    async checkPlayerNotifications() {
        const registrations = await api.getMyRegistrations();
        const now = new Date();
        
        registrations.forEach(reg => {
            const eventDate = new Date(reg.event.date);
            const timeDiff = eventDate - now;
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            // Notify 24 hours before event
            if (hoursDiff <= 24 && hoursDiff > 23) {
                this.showNotification(
                    `Event "${reg.event.title}" starts tomorrow!`,
                    'info',
                    'upcoming-event'
                );
            }
            
            // Notify 1 hour before event
            if (hoursDiff <= 1 && hoursDiff > 0.5) {
                this.showNotification(
                    `Event "${reg.event.title}" starts in 1 hour!`,
                    'warning',
                    'starting-soon'
                );
            }
        });
    }
    
    async checkOrganizerNotifications() {
        const events = await api.getMyEvents();
        const now = new Date();
        
        events.forEach(event => {
            const eventDate = new Date(event.date);
            const timeDiff = eventDate - now;
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            // Notify about events starting soon
            if (hoursDiff <= 2 && hoursDiff > 1) {
                this.showNotification(
                    `Your event "${event.title}" starts in 2 hours!`,
                    'info',
                    'event-starting'
                );
            }
            
            // Notify about low registration
            const registrationRate = (event.registered_count || 0) / event.max_participants;
            if (registrationRate < 0.3 && hoursDiff <= 48) {
                this.showNotification(
                    `Event "${event.title}" has low registration (${Math.round(registrationRate * 100)}%)`,
                    'warning',
                    'low-registration'
                );
            }
        });
    }
    
    showNotification(message, type = 'info', id = null) {
        // Check if notification was already shown
        if (id && this.isNotificationShown(id)) {
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = `dashboard-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
        
        // Mark notification as shown
        if (id) {
            this.markNotificationShown(id);
        }
    }
    
    getNotificationIcon(type) {
        const icons = {
            info: 'fas fa-info-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-exclamation-circle',
            success: 'fas fa-check-circle'
        };
        return icons[type] || icons.info;
    }
    
    isNotificationShown(id) {
        const shown = JSON.parse(localStorage.getItem('shownNotifications') || '[]');
        return shown.includes(id);
    }
    
    markNotificationShown(id) {
        const shown = JSON.parse(localStorage.getItem('shownNotifications') || '[]');
        if (!shown.includes(id)) {
            shown.push(id);
            localStorage.setItem('shownNotifications', JSON.stringify(shown));
        }
    }
    
    // ===== USER PREFERENCES =====
    loadUserPreferences() {
        const preferences = JSON.parse(localStorage.getItem('dashboardPreferences') || '{}');
        
        if (preferences.autoRefresh !== undefined) {
            this.autoRefreshEnabled = preferences.autoRefresh;
        }
        
        if (preferences.refreshRate) {
            this.refreshRate = preferences.refreshRate;
        }
        
        if (preferences.sidebarCollapsed && window.innerWidth > 768) {
            const sidebar = document.querySelector('.dashboard-sidebar');
            sidebar.classList.add('collapsed');
        }
    }
    
    saveUserPreferences() {
        const preferences = {
            autoRefresh: this.autoRefreshEnabled,
            refreshRate: this.refreshRate,
            sidebarCollapsed: document.querySelector('.dashboard-sidebar')?.classList.contains('collapsed')
        };
        
        localStorage.setItem('dashboardPreferences', JSON.stringify(preferences));
    }
    
    // ===== UTILITY METHODS =====
    updateLastRefreshTime() {
        const refreshElement = document.querySelector('.last-refresh-time');
        if (refreshElement && this.lastRefresh) {
            refreshElement.textContent = `Last updated: ${DateUtils.getTimeAgo(this.lastRefresh)}`;
        }
    }
    
    showLoadingState(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.classList.add('loading');
            element.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading...</p>
                </div>
            `;
        }
    }
    
    hideLoadingState(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.classList.remove('loading');
        }
    }
    
    // ===== CLEANUP =====
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.saveUserPreferences();
    }
}

// ===== DASHBOARD SPECIFIC FUNCTIONS =====

// View functions
function viewEventDetails(eventId) {
    localStorage.setItem('selectedEventId', eventId);
    window.location.href = '../events/event-details.html';
}

function viewAllEvents() {
    window.location.href = '../player/browse-events.html';
}

function viewMyRegistrations() {
    window.location.href = '../player/my-registrations.html';
}

// Navigation functions
function goToDashboard() {
    const user = auth.getCurrentUser();
    if (user) {
        window.location.href = `../${user.role}/dashboard.html`;
    }
}

function goToProfile() {
    window.location.href = '../shared/profile.html';
}

// Event management functions (for organizers)
function editEvent(eventId) {
    localStorage.setItem('editEventId', eventId);
    window.location.href = 'create-event.html';
}

function viewEventRegistrations(eventId) {
    localStorage.setItem('selectedEventId', eventId);
    window.location.href = 'registrations.html';
}

async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        return;
    }
    
    try {
        await api.deleteEvent(eventId);
        showSuccessMessage('Event deleted successfully');
        
        // Refresh the dashboard
        if (window.dashboardManager) {
            await window.dashboardManager.refreshDashboardData();
        }
        
    } catch (error) {
        console.error('Error deleting event:', error);
        showErrorMessage('Failed to delete event. Please try again.');
    }
}

// Registration functions (for players)
async function registerForEvent(eventId) {
    try {
        await api.registerForEvent(eventId);
        showSuccessMessage('Successfully registered for the event!');
        
        // Refresh the dashboard
        if (window.dashboardManager) {
            await window.dashboardManager.refreshDashboardData();
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        showErrorMessage('Failed to register for event. Please try again.');
    }
}

async function cancelRegistration(registrationId) {
    if (!confirm('Are you sure you want to cancel this registration?')) {
        return;
    }
    
    try {
        await api.cancelRegistration(registrationId);
        showSuccessMessage('Registration cancelled successfully');
        
        // Refresh the dashboard
        if (window.dashboardManager) {
            await window.dashboardManager.refreshDashboardData();
        }
        
    } catch (error) {
        console.error('Cancellation error:', error);
        showErrorMessage('Failed to cancel registration. Please try again.');
    }
}

// Utility functions
function showSuccessMessage(message) {
    showNotification(message, 'success');
}

function showErrorMessage(message) {
    showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
    if (window.dashboardManager) {
        window.dashboardManager.showNotification(message, type);
    } else {
        // Fallback notification
        console.log(`${type.toUpperCase()}: ${message}`);
    }
}

// ===== GLOBAL DASHBOARD MANAGER =====
// Initialize dashboard manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.dashboardManager) {
        window.dashboardManager.destroy();
    }
});

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.DashboardManager = DashboardManager;
}