

// ===== API CLIENT CLASS =====
class APIClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.endpoints = API_CONFIG.ENDPOINTS;
        this.timeout = API_CONFIG.TIMEOUT;
        this.defaultHeaders = API_CONFIG.HEADERS;
    }
    
    // Get auth token from localStorage
    getAuthToken() {
        return localStorage.getItem('authToken');
    }
    
    // Get auth headers
    getAuthHeaders() {
        const token = this.getAuthToken();
        return token ? {
            ...this.defaultHeaders,
            'Authorization': `Bearer ${token}`
        } : this.defaultHeaders;
    }
    
    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            timeout: this.timeout,
            headers: this.getAuthHeaders(),
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new APIError(data.detail || 'API request failed', response.status, data);
            }
            
            return data;
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            throw new APIError('Network error occurred', 0, { originalError: error.message });
        }
    }
    
    // ===== AUTHENTICATION METHODS =====
    async login(email, password) {
        return await this.request(this.endpoints.AUTH.LOGIN, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }
    
    async register(userData) {
        return await this.request(this.endpoints.AUTH.REGISTER, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }
    
    async getCurrentUser() {
        return await this.request(this.endpoints.USERS.ME);
    }
    
    async validateToken() {
        return await this.request(this.endpoints.USERS.ME);
    }
    
    // ===== EVENT METHODS =====
    async getEvents() {
        return await this.request(this.endpoints.EVENTS.LIST);
    }
    
    async getFeaturedEvents() {
        try {
            return await this.request(this.endpoints.EVENTS.FEATURED);
        } catch (error) {
            return this.getSampleEvents();
        }
    }
    
    async getEventDetails(eventId) {
        const endpoint = this.endpoints.EVENTS.DETAILS.replace('{id}', eventId);
        return await this.request(endpoint);
    }
    
    async createEvent(eventData) {
        return await this.request(this.endpoints.EVENTS.CREATE, {
            method: 'POST',
            body: JSON.stringify(eventData)
        });
    }
    
    async updateEvent(eventId, eventData) {
        const endpoint = this.endpoints.EVENTS.UPDATE.replace('{id}', eventId);
        return await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(eventData)
        });
    }
    
    async deleteEvent(eventId) {
        const endpoint = this.endpoints.EVENTS.DELETE.replace('{id}', eventId);
        return await this.request(endpoint, {
            method: 'DELETE'
        });
    }
    
    async getMyEvents() {
        return await this.request(this.endpoints.EVENTS.MY_EVENTS);
    }
    
    // ===== SEARCH METHODS =====
    async searchEvents(params = {}) {
        const queryString = new URLSearchParams();
        
        // Build query parameters from search params
        if (params.query) queryString.append('query', params.query);
        if (params.category) queryString.append('category', params.category);
        if (params.location) queryString.append('location', params.location);
        if (params.date_from) queryString.append('date_from', params.date_from);
        if (params.date_to) queryString.append('date_to', params.date_to);
        if (params.availability) queryString.append('availability', params.availability);
        if (params.sort_by) queryString.append('sort_by', params.sort_by);
        if (params.skip) queryString.append('skip', params.skip);
        if (params.limit) queryString.append('limit', params.limit);

        const url = `${this.endpoints.EVENTS.SEARCH}?${queryString.toString()}`;
        return await this.request(url);
    }
    
    // ===== REGISTRATION METHODS =====
    async registerForEvent(eventId) {
        return await this.request(this.endpoints.REGISTRATIONS.CREATE, {
            method: 'POST',
            body: JSON.stringify({ event_id: eventId })
        });
    }
    
    async getMyRegistrations() {
        return await this.request(this.endpoints.REGISTRATIONS.MY_REGISTRATIONS);
    }
    
    async cancelRegistration(registrationId) {
        const endpoint = this.endpoints.REGISTRATIONS.CANCEL.replace('{id}', registrationId);
        return await this.request(endpoint, {
            method: 'DELETE'
        });
    }
    
    async getEventRegistrations(eventId) {
        const endpoint = this.endpoints.REGISTRATIONS.EVENT_REGISTRATIONS.replace('{id}', eventId);
        return await this.request(endpoint);
    }
    
    // ===== FEEDBACK METHODS =====
    async submitFeedback(eventId, rating, comments) {
        return await this.request(this.endpoints.FEEDBACK.CREATE, {
            method: 'POST',
            body: JSON.stringify({
                event_id: eventId,
                rating,
                comments
            })
        });
    }

    async getEventFeedback(eventId) {
        const endpoint = this.endpoints.FEEDBACK.EVENT_FEEDBACK.replace('{id}', eventId);
        return await this.request(endpoint);
    }

    // ===== STATS METHODS =====
    async getDashboardStats() {
        return await this.request(this.endpoints.STATS.DASHBOARD);
    }
    
    // ===== FALLBACK DATA METHODS =====
    getSampleEvents() {
        return [
            {
                id: 1,
                title: "Valorant Champions League",
                description: "Epic 5v5 tactical shooter tournament with amazing prizes",
                category: "FPS",
                date: "2025-12-15",
                time: "18:00",
                location: "Online",
                max_participants: 64,
                registered_count: 32,
                organizer_id: 1,
                is_active: true,
                created_at: new Date().toISOString()
            },
            {
                id: 2,
                title: "FIFA Ultimate Cup",
                description: "The ultimate football gaming championship",
                category: "Sports",
                date: "2025-12-20",
                time: "16:00", 
                location: "Gaming Arena",
                max_participants: 32,
                registered_count: 18,
                organizer_id: 1,
                is_active: true,
                created_at: new Date().toISOString()
            }
        ];
    }
}

// Custom API Error class
class APIError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

// Create global API client instance
const api = new APIClient();

// Export for use in other files
if (typeof window !== 'undefined') {
    window.api = api;
    window.APIError = APIError;
}
