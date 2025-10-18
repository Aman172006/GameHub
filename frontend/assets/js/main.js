// ===== GAMEHUB MAIN JAVASCRIPT =====

// Global Variables
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let isLoading = false;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    handleAuthentication();
    loadFeaturedEvents();
    animateStats();
});

// ===== INITIALIZATION =====
function initializeApp() {
    // Show loading screen
    showLoadingScreen();
    
    // Hide loading screen after 3 seconds
    setTimeout(() => {
        hideLoadingScreen();
    }, 3000);
    
    // Setup navbar scroll effect
    setupNavbarScrollEffect();
    
    // Setup mobile menu
    setupMobileMenu();
    
    // Setup modal close on outside click
    setupModalCloseOnOutsideClick();
}

// ===== LOADING SCREEN =====
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.visibility = 'hidden';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 500);
    }
}

// ===== NAVBAR EFFECTS =====
function setupNavbarScrollEffect() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// ===== MOBILE MENU =====
function setupMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('show');
            mobileToggle.classList.toggle('active');
        });
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Authentication forms
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavClick);
    });
    
    // Close modals on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// ===== NAVIGATION =====
function handleNavClick(e) {
    e.preventDefault();
    const targetId = e.target.getAttribute('href');
    
    if (targetId.startsWith('#')) {
        scrollToSection(targetId.slice(1));
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        e.target.classList.add('active');
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offsetTop = section.offsetTop - 70; // Account for navbar height
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }
}

// ===== MODAL MANAGEMENT =====
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
        document.body.style.overflow = 'auto';
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    });
    document.body.style.overflow = 'auto';
}

function switchModal(currentModalId, targetModalId) {
    closeModal(currentModalId);
    setTimeout(() => {
        openModal(targetModalId);
    }, 300);
}

function setupModalCloseOnOutsideClick() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// ===== AUTHENTICATION =====
function handleAuthentication() {
    if (authToken) {
        // Validate token and get user info
        validateAuthToken();
    }
}

async function validateAuthToken() {
    try {
        const response = await fetch('/api/auth/validate', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
            updateUIForLoggedInUser();
        } else {
            // Token invalid, clear it
            clearAuthData();
        }
    } catch (error) {
        console.error('Token validation failed:', error);
        clearAuthData();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    if (isLoading) return;
    isLoading = true;
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    // Update button state
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> LOGGING IN...';
    submitButton.disabled = true;
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Login successful
            authToken = data.access_token;
            localStorage.setItem('authToken', authToken);
            
            // Get user data
            await getCurrentUser();
            
            // Show success message
            showNotification('Login successful! Welcome back, champion!', 'success');
            
            // Close modal
            closeModal('loginModal');
            
            // Redirect to dashboard
            setTimeout(() => {
                redirectToDashboard();
            }, 1000);
            
        } else {
            // Login failed
            showNotification(data.detail || 'Login failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Network error. Please check your connection.', 'error');
    } finally {
        // Reset button state
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        isLoading = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    if (isLoading) return;
    isLoading = true;
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    // Validate password
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long.', 'error');
        isLoading = false;
        return;
    }
    
    // Update button state
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> JOINING ARENA...';
    submitButton.disabled = true;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password, role })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Registration successful
            showNotification('Registration successful! Welcome to GameHub!', 'success');
            
            // Clear form
            e.target.reset();
            
            // Switch to login modal
            setTimeout(() => {
                switchModal('registerModal', 'loginModal');
                
                // Pre-fill login email
                document.getElementById('loginEmail').value = email;
            }, 1500);
            
        } else {
            // Registration failed
            showNotification(data.detail || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Network error. Please check your connection.', 'error');
    } finally {
        // Reset button state
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        isLoading = false;
    }
}

async function getCurrentUser() {
    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const userData = await response.json();
            setCurrentUser(userData);
            updateUIForLoggedInUser();
        }
    } catch (error) {
        console.error('Get current user failed:', error);
    }
}

function setCurrentUser(userData) {
    currentUser = userData;
    localStorage.setItem('currentUser', JSON.stringify(userData));
}

function clearAuthData() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    updateUIForLoggedOutUser();
}

function updateUIForLoggedInUser() {
    const navButtons = document.querySelector('.nav-buttons');
    if (navButtons && currentUser) {
        navButtons.innerHTML = `
            <div class="user-menu">
                <div class="user-info">
                    <i class="fas fa-user-circle"></i>
                    <span>${currentUser.name}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="user-dropdown">
                    <a href="pages/${currentUser.role}/dashboard.html">
                        <i class="fas fa-tachometer-alt"></i> Dashboard
                    </a>
                    <a href="#" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </a>
                </div>
            </div>
        `;
        
        // Setup user menu dropdown
        setupUserMenuDropdown();
    }
}

function updateUIForLoggedOutUser() {
    const navButtons = document.querySelector('.nav-buttons');
    if (navButtons) {
        navButtons.innerHTML = `
            <button class="btn-secondary" onclick="openModal('loginModal')">
                <i class="fas fa-sign-in-alt"></i> Login
            </button>
            <button class="btn-primary" onclick="openModal('registerModal')">
                <i class="fas fa-user-plus"></i> Join Now
            </button>
        `;
    }
}

function setupUserMenuDropdown() {
    const userMenu = document.querySelector('.user-menu');
    if (userMenu) {
        const userInfo = userMenu.querySelector('.user-info');
        const dropdown = userMenu.querySelector('.user-dropdown');
        
        userInfo.addEventListener('click', () => {
            dropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenu.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }
}

function logout() {
    clearAuthData();
    showNotification('Logged out successfully. See you next time!', 'success');
    
    // Redirect to home
    window.location.href = '/';
}

function redirectToDashboard() {
    if (currentUser) {
        window.location.href = `pages/${currentUser.role}/dashboard.html`;
    }
}

// ===== EVENTS LOADING =====
async function loadFeaturedEvents() {
    try {
        const response = await fetch('/api/events/featured');
        if (response.ok) {
            const events = await response.json();
            displayFeaturedEvents(events);
        }
    } catch (error) {
        console.error('Error loading featured events:', error);
        displaySampleEvents();
    }
}

function displayFeaturedEvents(events) {
    const eventsGrid = document.getElementById('featured-events');
    if (!eventsGrid) return;
    
    if (events.length === 0) {
        eventsGrid.innerHTML = `
            <div class="no-events">
                <i class="fas fa-calendar-times"></i>
                <h3>No events available</h3>
                <p>Check back soon for exciting tournaments!</p>
            </div>
        `;
        return;
    }
    
    eventsGrid.innerHTML = events.slice(0, 6).map(event => `
        <div class="event-card" data-event-id="${event.id}">
            <div class="event-header">
                <span class="event-category">${event.category}</span>
                <div class="event-date">
                    <div>${formatDate(event.date)}</div>
                    <div>${event.time}</div>
                </div>
            </div>
            <h3 class="event-title">${event.title}</h3>
            <p class="event-description">${event.description}</p>
            <div class="event-info">
                <div class="event-participants">
                    <i class="fas fa-users"></i>
                    <span>${event.registered_count || 0}/${event.max_participants}</span>
                </div>
                <div class="event-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${event.location}</span>
                </div>
            </div>
            <div class="event-actions">
                <button class="btn-primary" onclick="viewEventDetails(${event.id})">
                    <i class="fas fa-eye"></i> View Details
                </button>
                <button class="btn-secondary" onclick="registerForEvent(${event.id})">
                    <i class="fas fa-plus"></i> Join
                </button>
            </div>
        </div>
    `).join('');
}

function displaySampleEvents() {
    const sampleEvents = [
        {
            id: 1,
            title: "Valorant Champions League",
            description: "Epic 5v5 tactical shooter tournament with amazing prizes",
            category: "FPS",
            date: "2025-12-15",
            time: "18:00",
            location: "Online",
            max_participants: 64,
            registered_count: 32
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
            registered_count: 18
        },
        {
            id: 3,
            title: "CS:GO Major Tournament",
            description: "Counter-Strike Global Offensive competitive tournament",
            category: "FPS",
            date: "2025-12-25",
            time: "20:00",
            location: "Online",
            max_participants: 128,
            registered_count: 45
        }
    ];
    
    displayFeaturedEvents(sampleEvents);
}

// ===== STATISTICS ANIMATION =====
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-count'));
                animateCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
        });
    });
    
    statNumbers.forEach(stat => {
        observer.observe(stat);
    });
}

function animateCounter(element, target) {
    let current = 0;
    const increment = target / 50;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 50);
}

// ===== EVENT ACTIONS =====
async function viewEventDetails(eventId) {
    // Store event ID for details page
    localStorage.setItem('selectedEventId', eventId);
    
    // Navigate to event details page
    window.location.href = 'pages/events/event-details.html';
}

async function registerForEvent(eventId) {
    if (!authToken) {
        showNotification('Please login to register for events.', 'warning');
        openModal('loginModal');
        return;
    }
    
    try {
        const response = await fetch('/api/registrations/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ event_id: eventId })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Successfully registered for the event!', 'success');
            // Refresh events to update counts
            loadFeaturedEvents();
        } else {
            showNotification(data.detail || 'Registration failed.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

function viewAllEvents() {
    window.location.href = 'pages/events/event-list.html';
}

// ===== UTILITY FUNCTIONS =====
function formatDate(dateString) {
    const options = { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    }[type];
    
    notification.innerHTML = `
        <div class="notification-content">
            <i class="${icon}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="closeNotification(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        closeNotification(notification.querySelector('.notification-close'));
    }, 5000);
}

function closeNotification(button) {
    const notification = button.closest('.notification');
    notification.classList.remove('show');
    setTimeout(() => {
        notification.remove();
    }, 300);
}

// ===== ERROR HANDLING =====
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showNotification('An unexpected error occurred.', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showNotification('A network error occurred.', 'error');
});

// ===== EXPORT FUNCTIONS FOR GLOBAL USE =====
window.openModal = openModal;
window.closeModal = closeModal;
window.switchModal = switchModal;
window.scrollToSection = scrollToSection;
window.viewEventDetails = viewEventDetails;
window.registerForEvent = registerForEvent;
window.viewAllEvents = viewAllEvents;
window.logout = logout;
window.closeNotification = closeNotification;
