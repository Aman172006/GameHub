class EventsManager {
    constructor() {
        this.events = [];
        this.filteredEvents = [];
        this.currentPage = 1;
        this.eventsPerPage = 12;
        this.searchTimeout = null;
        this.loadingStates = new Set();

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupInfiniteScroll();
        this.bindGlobalFunctions();
    }

    // Event Listeners Setup
    setupEventListeners() {
        const searchInputs = document.querySelectorAll('[data-search="events"]');
        searchInputs.forEach(input => {
            input.addEventListener('input', e => this.debounceSearch(e.target.value));
        });

        const filterSelects = document.querySelectorAll('.filter-select, .sort-select');
        filterSelects.forEach(select => {
            select.addEventListener('change', () => this.applyFilters());
        });

        document.addEventListener('click', e => {
            if (e.target.closest('.event-card')) this.handleEventCardClick(e);
        });

        this.setupRegistrationHandlers();
    }

    // Infinite scroll setup
    setupInfiniteScroll() {
        const loadMoreButton = document.getElementById('load-more-events');
        if (loadMoreButton) {
            loadMoreButton.addEventListener('click', () => this.loadMoreEvents());
        }
        if (window.location.pathname.includes('browse-events')) {
            window.addEventListener('scroll', AsyncUtils.throttle(() => {
                if (this.shouldLoadMore()) this.loadMoreEvents();
            }, 200));
        }
    }

    /* Load events with optional filters and pagination */
    async loadEvents(options = {}) {
        const { refresh = false, append = false, filters = {} } = options;
        try {
            if (!append) this.showLoadingState('general');
            const events = await api.getEvents(filters);
            this.events = append ? [...this.events, ...events] : events;
            this.applyFilters();
            this.updateEventCounts();
            this.displayEvents();
            return events;
        } catch (error) {
            console.error('Error loading events:', error);
            this.showErrorState('Failed to load events');
            throw error;
        } finally {
            this.hideLoadingState('general');
        }
    }

    /* Load events owned by current user */
    async loadMyEvents() {
        try {
            this.showLoadingState('general');
            const events = await api.getMyEvents();
            this.events = events;
            this.applyFilters();
            this.displayEvents();
            return events;
        } catch (error) {
            console.error('Error loading my events:', error);
            this.showErrorState('Failed to load your events');
            throw error;
        } finally {
            this.hideLoadingState('general');
        }
    }

    /* Load full details for specific event */
    async loadEventDetails(eventId) {
        try {
            this.showLoadingState(`event-details-${eventId}`);
            const event = await api.getEventDetails(eventId);
            return event;
        } catch (error) {
            console.error('Error loading event details:', error);
            throw error;
        } finally {
            this.hideLoadingState(`event-details-${eventId}`);
        }
    }

    /* Filter and sort applied to events */
    applyFilters() {
        const filters = this.getActiveFilters();
        this.filteredEvents = this.events.filter(event => this.matchesFilters(event, filters));
        this.sortEvents(filters.sort || 'date-asc');
        this.currentPage = 1;
        this.displayEvents();
        this.updateEventCounts();
    }

    /* Fetch filter controls values */
    getActiveFilters() {
        const filters = {};
        const keys = ['category', 'location', 'date', 'availability', 'search', 'sort'];
        keys.forEach(k => {
            const el = document.getElementById(`${k}-filter`);
            if (el && el.value) {
                filters[k] = el.value.toLowerCase && k !== 'sort' ? el.value.toLowerCase() : el.value;
            }
        });
        return filters;
    }

    /* Check if event matches filters */
    matchesFilters(event, filters) {
        if (filters.category && event.category !== filters.category) return false;
        if (filters.location && !event.location.toLowerCase().includes(filters.location)) return false;
        if (filters.date && !this.matchesDateFilter(event.date, filters.date)) return false;
        if (filters.availability && !this.matchesAvailabilityFilter(event, filters.availability)) return false;
        if (filters.search && !this.matchesSearch(event, filters.search)) return false;
        return true;
    }

    /* Date filter matching */
    matchesDateFilter(eventDate, filter) {
        const event = new Date(eventDate);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (filter) {
            case 'today': return event.toDateString() === today.toDateString();
            case 'tomorrow':
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return event.toDateString() === tomorrow.toDateString();
            case 'this-week':
                const endOfWeek = new Date(today);
                endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
                return event >= today && event <= endOfWeek;
            case 'next-week':
                const startNextWeek = new Date(today);
                startNextWeek.setDate(today.getDate() + (7 - today.getDay()) + 1);
                const endNextWeek = new Date(startNextWeek);
                endNextWeek.setDate(startNextWeek.getDate() + 6);
                return event >= startNextWeek && event <= endNextWeek;
            case 'this-month':
                return event.getMonth() === now.getMonth() && event.getFullYear() === now.getFullYear();
            default: return true;
        }
    }

    /* Availability filter matching */
    matchesAvailabilityFilter(event, filter) {
        const registeredCount = event.registered_count || 0;
        const maxParticipants = event.max_participants;
        const fillPercent = (registeredCount / maxParticipants) * 100;
        switch (filter) {
            case 'available': return fillPercent < 80;
            case 'full': return fillPercent >= 80;
            case 'new': return this.isNewEvent(event);
            default: return true;
        }
    }

    /* Search match */
    matchesSearch(event, search) {
        return (
            (event.title && event.title.toLowerCase().includes(search)) ||
            (event.description && event.description.toLowerCase().includes(search)) ||
            (event.category && event.category.toLowerCase().includes(search)) ||
            (event.location && event.location.toLowerCase().includes(search))
        );
    }

    /* Sort events */
    sortEvents(sortType) {
        switch (sortType) {
            case 'date-asc':
                this.filteredEvents.sort((a,b)=> new Date(a.date) - new Date(b.date));
                break;
            case 'date-desc':
                this.filteredEvents.sort((a,b)=> new Date(b.date) - new Date(a.date));
                break;
            case 'name-asc':
                this.filteredEvents.sort((a,b)=> a.title.localeCompare(b.title));
                break;
            case 'name-desc':
                this.filteredEvents.sort((a,b)=> b.title.localeCompare(a.title));
                break;
            case 'participants-asc':
                this.filteredEvents.sort((a,b)=> (a.registered_count || 0) - (b.registered_count || 0));
                break;
            case 'participants-desc':
                this.filteredEvents.sort((a,b)=> (b.registered_count || 0) - (a.registered_count || 0));
                break;
        }
    }

    debounceSearch(query) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => this.applyFilters(), 300);
    }

    /* Display paginated events in UI */
    displayEvents() {
        const eventsGrid = document.getElementById('events-grid');
        if (!eventsGrid) return;

        const eventsToShow = this.filteredEvents.slice(0, this.currentPage * this.eventsPerPage);

        if (!eventsToShow.length) {
            this.showEmptyState();
            return;
        }

        eventsGrid.innerHTML = eventsToShow.map(event => this.createEventCard(event)).join('');
        this.updateLoadMoreButton();
    }

    /* Create HTML for each event card */
    createEventCard(event) {
        const registrationProgress = this.getRegistrationProgress(event);
        const isEventFull = this.isEventFull(event);
        const isNewEvent = this.isNewEvent(event);
        const eventStatus = this.getEventStatus(event);

        return `
        <div class="event-card" data-event-id="${event.id}">
            <div class="event-header">
                <span class="event-category">${event.category}</span>
                <div class="event-date">
                    <div>${DateUtils.formatDate(event.date)}</div>
                    <div class="event-time">${event.time}</div>
                </div>
            </div>
            <div class="event-content">
                <h3 class="event-title">${event.title}</h3>
                <p class="event-description">${StringUtils.truncate(event.description, 100)}</p>
                <div class="event-meta">
                    <div class="meta-item"><i class="fas fa-map-marker-alt"></i><span>${event.location}</span></div>
                    <div class="meta-item"><i class="fas fa-users"></i><span>${event.registered_count || 0}/${event.max_participants}</span></div>
                    ${event.entry_fee ? `<div class="meta-item"><i class="fas fa-dollar-sign"></i><span>$${event.entry_fee}</span></div>`
                        : `<div class="meta-item free-event"><i class="fas fa-gift"></i><span>Free</span></div>`
                    }
                </div>
                <div class="event-progress">
                    <div class="progress-bar"><div class="progress-fill" style="width: ${registrationProgress}%"></div></div>
                    <span class="progress-text">${registrationProgress}% Full</span>
                </div>
            </div>
            <div class="event-footer">
                <button class="btn-outline btn-small" onclick="eventManager.viewEventDetails(${event.id})"><i class="fas fa-eye"></i>View Details</button>
                <button class="btn-primary btn-small" onclick="eventManager.registerForEvent(${event.id})" ${isEventFull ? 'disabled' : ''}>
                    <i class="fas fa-plus"></i>${isEventFull ? 'Event Full' : 'Register'}
                </button>
            </div>
            ${isEventFull ? '<div class="event-full-overlay">Event Full</div>' : ''}
            ${isNewEvent ? '<div class="event-new-badge">New</div>' : ''}
            ${eventStatus !== 'upcoming' ? `<div class="event-status-badge status-${eventStatus}">${this.getEventStatusText(eventStatus)}</div>` : ''}
        </div>
        `;
    }

    // Event management methods
    async createEvent(eventData) {
        try {
            this.showLoadingState('create-event');
            const event = await api.createEvent(eventData);
            this.showNotification('Event created successfully!', 'success');
            return event;
        } catch (error) {
            console.error('Event creation error:', error);
            this.showNotification('Failed to create event. Please try again.', 'error');
            throw error;
        } finally {
            this.hideLoadingState('create-event');
        }
    }

    async updateEvent(eventId, eventData) {
        try {
            this.showLoadingState(`update-${eventId}`);
            const event = await api.updateEvent(eventId, eventData);
            this.showNotification('Event updated successfully!', 'success');
            const index = this.events.findIndex(e => e.id === eventId);
            if (index !== -1) {
                this.events[index] = event;
                this.applyFilters();
            }
            return event;
        } catch (error) {
            console.error('Event update error:', error);
            this.showNotification('Failed to update event. Please try again.', 'error');
            throw error;
        } finally {
            this.hideLoadingState(`update-${eventId}`);
        }
    }

    async deleteEvent(eventId) {
        if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            return;
        }

        try {
            this.showLoadingState(`delete-${eventId}`);
            await api.deleteEvent(eventId);
            this.showNotification('Event deleted successfully', 'success');
            this.events = this.events.filter(e => e.id !== eventId);
            this.applyFilters();
        } catch (error) {
            console.error('Error deleting event:', error);
            this.showNotification('Failed to delete event. Please try again.', 'error');
        } finally {
            this.hideLoadingState(`delete-${eventId}`);
        }
    }

    // Utility methods
    getRegistrationProgress(event) {
        const registered = event.registered_count || 0;
        const max = event.max_participants;
        return Math.round((registered / max) * 100);
    }

    isEventFull(event) {
        const registered = event.registered_count || 0;
        return registered >= event.max_participants;
    }

    isNewEvent(event) {
        const eventCreated = new Date(event.created_at);
        const now = new Date();
        const daysDiff = (now - eventCreated) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7;
    }

    getEventStatus(event) {
        const now = new Date();
        const eventDate = new Date(event.date);
        
        if (!event.is_active) return 'cancelled';
        if (eventDate > now) return 'upcoming';
        
        const eventEndDate = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);
        if (eventDate <= now && now <= eventEndDate) return 'live';
        
        return 'completed';
    }

    getEventStatusText(status) {
        const statusTexts = {
            upcoming: 'Upcoming',
            live: 'Live',
            completed: 'Completed',
            cancelled: 'Cancelled'
        };
        return statusTexts[status] || 'Unknown';
    }

    showEmptyState() {
        const eventsGrid = document.getElementById('events-grid');
        if (!eventsGrid) return;
        
        eventsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No Events Available</h3>
                <p>Be the first to discover new events!</p>
                <button class="btn-primary" onclick="eventManager.refreshEvents()">
                    <i class="fas fa-refresh"></i>
                    Refresh Events
                </button>
            </div>
        `;
    }

    showErrorState(message = 'Unable to load events') {
        const eventsGrid = document.getElementById('events-grid');
        if (!eventsGrid) return;
        
        eventsGrid.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>${message}</h3>
                <p>Please try again or contact support if the problem persists.</p>
                <button class="btn-primary" onclick="eventManager.refreshEvents()">
                    <i class="fas fa-retry"></i>
                    Try Again
                </button>
            </div>
        `;
    }

    handleEventCardClick(e) {
        const eventCard = e.target.closest('.event-card');
        const eventId = parseInt(eventCard.dataset.eventId);
        
        if (e.target.closest('button')) return;
        
        this.viewEventDetails(eventId);
    }

    setupRegistrationHandlers() {
        const confirmBtn = document.getElementById('confirm-register-btn');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const eventId = confirmBtn.dataset.eventId;
                if (eventId) {
                    this.confirmRegistration(parseInt(eventId));
                }
            });
        }
    }

    viewEventDetails(eventId) {
        localStorage.setItem('selectedEventId', eventId);
        window.location.href = '../events/event-details.html';
    }

    updateEventCounts() {
        const countElement = document.getElementById('events-count');
        if (countElement) {
            const count = this.filteredEvents.length;
            countElement.textContent = `${count} Event${count !== 1 ? 's' : ''}`;
        }
        
        const totalElement = document.getElementById('total-events');
        if (totalElement) {
            totalElement.textContent = this.events.length;
        }
    }

    updateLoadMoreButton() {
        const loadMoreContainer = document.getElementById('load-more-container');
        
        if (loadMoreContainer) {
            const hasMore = this.filteredEvents.length > this.currentPage * this.eventsPerPage;
            loadMoreContainer.style.display = hasMore ? 'block' : 'none';
        }
    }

    loadMoreEvents() {
        this.currentPage++;
        this.displayEvents();
    }

    shouldLoadMore() {
        const scrollPosition = window.innerHeight + window.scrollY;
        const threshold = document.body.offsetHeight - 1000;
        return scrollPosition >= threshold && 
               this.filteredEvents.length > this.currentPage * this.eventsPerPage;
    }

    async refreshEvents() {
        await this.loadEvents({ refresh: true });
    }

    showLoadingState(identifier = 'general') {
        this.loadingStates.add(identifier);
        if (identifier === 'general') {
            const eventsGrid = document.getElementById('events-grid');
            if (eventsGrid) {
                eventsGrid.innerHTML = `
                    <div class="loading-placeholder">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading events...</p>
                    </div>
                `;
            }
        }
    }

    hideLoadingState(identifier = 'general') {
        this.loadingStates.delete(identifier);
    }

    showNotification(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    bindGlobalFunctions() {
        window.eventManager = this;
    }
}

// Global wrapper functions
function showLoadingState(id) {
    if (window.eventManager) {
        window.eventManager.showLoadingState(id);
    }
}

function hideLoadingState(id) {
    if (window.eventManager) {
        window.eventManager.hideLoadingState(id);
    }
}

function showNotification(message, type) {
    if (window.eventManager) {
        window.eventManager.showNotification(message, type);
    }
}

// Global deleteEvent function that calls the instance method
async function deleteEvent(eventId) {
    if (window.eventManager) {
        await window.eventManager.deleteEvent(eventId);
    }
}

// Other global wrapper functions
function createEvent() {
    window.location.href = 'create-event.html';
}

function editEvent(eventId) {
    localStorage.setItem('editEventId', eventId);
    window.location.href = 'create-event.html';
}

function viewEventRegistrations(eventId) {
    localStorage.setItem('selectedEventId', eventId);
    window.location.href = 'registrations.html';
}

// Initialization on DOM loaded
document.addEventListener('DOMContentLoaded', () => {
    window.eventManager = new EventsManager();
});

if (typeof window !== 'undefined') {
    window.EventsManager = EventsManager;
}
