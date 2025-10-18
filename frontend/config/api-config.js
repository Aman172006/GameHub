// ===== API CONFIGURATION =====
// This connects to your existing FastAPI backend

const API_CONFIG = {
    // Base URL of your FastAPI backend
    BASE_URL: 'http://127.0.0.1:8000',
    
    // API Endpoints mapping to your existing backend
    ENDPOINTS: {
        // Authentication endpoints
        AUTH: {
            LOGIN: '/test/login',
            REGISTER: '/test/register-user', 
            VALIDATE: '/users/me',
            LOGOUT: '/auth/logout'
        },
        
        // User endpoints
        USERS: {
            ME: '/users/me',
            PROFILE: '/users/profile',
            UPDATE: '/users/update',
            DEBUG: '/debug/users'
        },
        
        // Event endpoints
        EVENTS: {
            LIST: '/events/',
            CREATE: '/test/create-event',
            DETAILS: '/events/{id}',
            UPDATE: '/events/{id}',
            DELETE: '/events/{id}',
            FEATURED: '/events/featured',
            MY_EVENTS: '/events/my-events',
            SEARCH: '/events/search'
        },
        
        // Registration endpoints
        REGISTRATIONS: {
            CREATE: '/test/register-event',
            MY_REGISTRATIONS: '/registrations/my-registrations',
            CANCEL: '/registrations/{id}',
            EVENT_REGISTRATIONS: '/events/{id}/registrations'
        },
        
        // Feedback endpoints
        FEEDBACK: {
            CREATE: '/test/add-feedback',
            EVENT_FEEDBACK: '/events/{id}/feedback'
        },
        
        // Analytics endpoints (for organizers)
        ANALYTICS: {
            OVERVIEW: '/analytics/overview',
            EVENT_STATS: '/analytics/events/{id}'
        }
    },
    
    // Request timeout
    TIMEOUT: 30000,

    // Common headers
    HEADERS: {
        'Content-Type': 'application/json'
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}
