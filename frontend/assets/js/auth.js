// ===== AUTHENTICATION SYSTEM =====
// Handles user authentication, session management, and role-based access

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authToken = null;
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.sessionTimer = null;

        this.init();
    }

    init() {
        // Load stored auth data
        this.loadStoredAuth();

        // Setup session management
        this.setupSessionManagement();

        // Setup auth event listeners
        this.setupAuthEventListeners();
    }

    // ===== SESSION MANAGEMENT =====
    setupSessionManagement() {
        // Periodically validate session every 5 minutes
        setInterval(() => {
            if (this.isAuthenticated()) {
                this.validateSession();
            }
        }, 5 * 60 * 1000);

        // Cleanup timer on page unload
        window.addEventListener('beforeunload', () => {
            if (this.sessionTimer) {
                clearTimeout(this.sessionTimer);
            }
        });

        // Validate session when tab gains focus
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.isAuthenticated()) {
                this.validateSession();
            }
        });
    }

    // ===== LOGIN =====
    async login(email, password) {
        try {
            this.showLoadingState('Logging in...');

            const response = await fetch('http://127.0.0.1:8000/test/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
            });

            if (response.ok) {
                const data = await response.json();

                if (data.access_token) {
                    this.authToken = data.access_token;
                    this.storeAuthToken(this.authToken);

                    // Use actual user data from backend response
                    let userData = data.user;
                    
                    // Fallback if backend doesn't return user info
                    if (!userData) {
                        userData = {
                            id: 1,
                            name: email.split('@')[0],
                            email: email,
                            role: 'organizer' // Default role (change as needed)
                        };
                    }

                    this.currentUser = userData;
                    this.storeCurrentUser(userData);

                    this.startSession();
                    this.triggerAuthEvent('login-success', this.currentUser);

                    return { success: true, user: this.currentUser };
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Login failed');
            }
        } catch (error) {
            this.handleAuthError(error);
            return { success: false, error: error.message };
        } finally {
            this.hideLoadingState();
        }
    }

    // ===== REGISTER =====
    async register(userData) {
        try {
            this.showLoadingState('Creating account...');

            const response = await fetch('http://127.0.0.1:8000/test/register-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                const result = await response.json();
                this.triggerAuthEvent('register-success', result);
                return { success: true, user: result };
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Registration failed');
            }
        } catch (error) {
            this.handleAuthError(error);
            return { success: false, error: error.message };
        } finally {
            this.hideLoadingState();
        }
    }

    // ===== LOGOUT =====
    async logout() {
        try {
            this.clearAuthData();
            this.stopSession();
            this.triggerAuthEvent('logout');
            window.location.href = '/frontend/index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    // ===== VALIDATE SESSION =====
    async validateSession() {
        if (!this.authToken) return false;
        try {
            // Simple validation for demonstration
            return this.currentUser !== null;
        } catch (error) {
            console.error('Session validation failed:', error);
            this.clearAuthData();
            return false;
        }
    }

    // ===== USER DATA MANAGEMENT =====
    async loadCurrentUser() {
        return this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!(this.authToken && this.currentUser);
    }

    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    isPlayer() {
        return this.hasRole('player');
    }

    isOrganizer() {
        return this.hasRole('organizer');
    }

    isAdmin() {
        return this.hasRole('admin');
    }

    // ===== STORAGE MANAGEMENT =====
    loadStoredAuth() {
        try {
            this.authToken = localStorage.getItem('authToken');
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) this.currentUser = JSON.parse(storedUser);

            if (this.authToken && this.currentUser) {
                this.validateSession().then(isValid => {
                    if (isValid) {
                        this.startSession();
                        this.triggerAuthEvent('session-restored', this.currentUser);
                    } else {
                        this.clearAuthData();
                    }
                });
            }
        } catch (error) {
            console.error('Error loading stored auth:', error);
            this.clearAuthData();
        }
    }

    storeAuthToken(token) {
        this.authToken = token;
        localStorage.setItem('authToken', token);
    }

    storeCurrentUser(userData) {
        this.currentUser = userData;
        localStorage.setItem('currentUser', JSON.stringify(userData));
    }

    clearAuthData() {
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
    }

    // ===== SESSION MANAGEMENT =====
    startSession() {
        this.resetSessionTimer();
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, () => this.resetSessionTimer(), true);
        });
    }

    resetSessionTimer() {
        if (this.sessionTimer) clearTimeout(this.sessionTimer);
        this.sessionTimer = setTimeout(() => {
            this.handleSessionTimeout();
        }, this.sessionTimeout);
    }

    handleSessionTimeout() {
        this.showNotification('Your session has expired. Please login again.', 'warning');
        this.logout();
    }

    stopSession() {
        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }
    }

    // ===== ACCESS CONTROL =====
    requireAuth(redirectUrl = '/frontend/index.html') {
        if (!this.isAuthenticated()) {
            localStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    requireRole(requiredRole, redirectUrl = '/frontend/index.html') {
        if (!this.requireAuth(redirectUrl)) return false;

        if (!this.hasRole(requiredRole)) {
            this.showNotification(`Access denied. ${requiredRole} role required.`, 'error');
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 2000);
            return false;
        }
        return true;
    }

    requirePlayer() {
        return this.requireRole('player');
    }

    requireOrganizer() {
        return this.requireRole('organizer');
    }

    // ===== EVENT SYSTEM =====
    setupAuthEventListeners() {
        document.addEventListener('auth-login-success', (e) => {
            console.log('User logged in:', e.detail);
            this.handleLoginSuccess(e.detail);
        });

        document.addEventListener('auth-logout', () => {
            console.log('User logged out');
            this.handleLogoutSuccess();
        });

        document.addEventListener('auth-session-restored', (e) => {
            console.log('Session restored:', e.detail);
            this.handleSessionRestored(e.detail);
        });
    }

    triggerAuthEvent(eventName, data = null) {
        const event = new CustomEvent(`auth-${eventName}`, {
            detail: data,
            bubbles: true
        });
        document.dispatchEvent(event);
    }

    handleLoginSuccess(userData) {
        console.log('🎯 Login success handler called with user:', userData);
        this.updateUIForAuthenticatedUser();

        const redirectUrl = localStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
            console.log('📍 Redirecting to stored URL:', redirectUrl);
            localStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectUrl;
        } else {
            console.log('🎮 Role-based redirect to dashboard for role:', userData.role);
            this.redirectToDashboard();
        }
    }

    handleLogoutSuccess() {
        this.updateUIForUnauthenticatedUser();
    }

    handleSessionRestored(userData) {
        this.updateUIForAuthenticatedUser();
    }

    // Updated role-based dashboard redirection
    redirectToDashboard() {
        if (this.currentUser && this.currentUser.role) {
            let url;

            switch(this.currentUser.role) {
                case 'organizer':
                    url = '/frontend/pages/organizer/dashboard.html';
                    break;
                case 'player':
                    url = '/frontend/pages/player/dashboard.html';
                    break;
                case 'admin':
                    url = '/frontend/pages/admin/dashboard.html';
                    break;
                default:
                    url = '/frontend/index.html';
            }

            console.log('Redirecting to:', url);
            window.location.href = url;

        } else {
            console.error('No user or role, redirecting to home');
            window.location.href = '/frontend/index.html';
        }
    }

    // ===== UI UPDATES =====
    updateUIForAuthenticatedUser() {
        const navButtons = document.querySelector('.nav-buttons');
        if (navButtons && this.currentUser) {
            navButtons.innerHTML = `
                <div class="user-menu">
                    <div class="user-info" onclick="toggleUserDropdown()">
                        <div class="user-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="user-details">
                            <span class="user-name">${this.currentUser.name}</span>
                            <span class="user-role">${this.currentUser.role}</span>
                        </div>
                        <i class="fas fa-chevron-down dropdown-arrow"></i>
                    </div>
                    <div class="user-dropdown">
                        <a href="/frontend/pages/${this.currentUser.role}/dashboard.html" class="dropdown-item">
                            <i class="fas fa-tachometer-alt"></i> Dashboard
                        </a>
                        <a href="/frontend/pages/shared/profile.html" class="dropdown-item">
                            <i class="fas fa-user"></i> Profile
                        </a>
                        <div class="dropdown-divider"></div>
                        <a href="#" onclick="auth.logout()" class="dropdown-item">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </a>
                    </div>
                </div>
            `;

            this.setupUserDropdown();
        }

        this.updateAuthDependentElements();
    }

    updateUIForUnauthenticatedUser() {
        const navButtons = document.querySelector('.nav-buttons');
        if (navButtons) {
            navButtons.innerHTML = `
                <button class="btn-secondary" onclick="window.location.href='pages/auth/login.html'">
                    <i class="fas fa-sign-in-alt"></i> Login
                </button>
                <button class="btn-primary" onclick="window.location.href='pages/auth/register.html'">
                    <i class="fas fa-user-plus"></i> Join Now
                </button>
            `;
        }

        this.hideAuthDependentElements();
    }

    setupUserDropdown() {
        const userMenu = document.querySelector('.user-menu');
        if (!userMenu) return;

        const userInfo = userMenu.querySelector('.user-info');
        const dropdown = userMenu.querySelector('.user-dropdown');

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenu.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }

    updateAuthDependentElements() {
        const authElements = document.querySelectorAll('[data-auth-required]');
        authElements.forEach(element => {
            element.style.display = 'block';
        });

        const roleElements = document.querySelectorAll('[data-role]');
        roleElements.forEach(element => {
            const requiredRole = element.getAttribute('data-role');
            element.style.display = this.hasRole(requiredRole) ? 'block' : 'none';
        });
    }

    hideAuthDependentElements() {
        const authElements = document.querySelectorAll('[data-auth-required], [data-role]');
        authElements.forEach(element => {
            element.style.display = 'none';
        });
    }

    // ===== UTILITY METHODS =====
    showLoadingState(message = 'Loading...') {
        this.hideLoadingState();

        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'auth-loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner">
                    <div class="spinner-ring"></div>
                </div>
                <p>${message}</p>
            </div>
        `;
        loadingOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.8); display: flex; align-items: center;
            justify-content: center; z-index: 10000; color: white;
        `;
        document.body.appendChild(loadingOverlay);
    }

    hideLoadingState() {
        const loadingOverlay = document.getElementById('auth-loading-overlay');
        if (loadingOverlay) loadingOverlay.remove();
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `auth-notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 1rem;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6'};
            color: white; border-radius: 8px; z-index: 10001;
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentElement) notification.remove();
        }, 5000);
    }

    handleAuthError(error) {
        console.error('Authentication error:', error);
        this.showNotification(error.message || 'Authentication failed', 'error');
    }
}

// Utility functions
function toggleUserDropdown() {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

const auth = new AuthManager();

if (typeof window !== 'undefined') {
    window.auth = auth;
    window.toggleUserDropdown = toggleUserDropdown;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('✅ Auth system initialized');
    });
} else {
    console.log('✅ Auth system initialized');
}
