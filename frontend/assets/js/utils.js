// ===== UTILITY FUNCTIONS - GAMEHUB =====

// ===== DATE & TIME UTILITIES =====
const DateUtils = {
    /**
     * Format date to readable string
     * @param {string|Date} date - Date to format
     * @param {Object} options - Formatting options
     */
    formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Invalid date';
    return dateObj.toLocaleDateString('en-US', { ...defaultOptions, ...options });
}
,
    
    /**
     * Format date and time together
     * @param {string} date - Date string
     * @param {string} time - Time string
     */
    formatDateTime(date, time) {
        const dateTime = new Date(`${date}T${time}`);
        return dateTime.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    /**
     * Get relative time (e.g., "2 hours ago")
     * @param {string|Date} date - Date to compare
     */
    getTimeAgo(date) {
        const now = new Date();
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const diffInSeconds = Math.floor((now - dateObj) / 1000);
        
        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'week', seconds: 604800 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 },
            { label: 'second', seconds: 1 }
        ];
        
        for (const interval of intervals) {
            const count = Math.floor(diffInSeconds / interval.seconds);
            if (count >= 1) {
                return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
            }
        }
        
        return 'Just now';
    },
    
    /**
     * Check if date is today
     * @param {string|Date} date - Date to check
     */
    isToday(date) {
        const today = new Date();
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        
        return today.toDateString() === dateObj.toDateString();
    },
    
    /**
     * Check if date is in the future
     * @param {string|Date} date - Date to check
     */
    isFuture(date) {
        const now = new Date();
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        
        return dateObj > now;
    },
    
    /**
     * Get days until date
     * @param {string|Date} date - Target date
     */
    getDaysUntil(date) {
        const now = new Date();
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        const diffInMs = dateObj - now;
        
        return Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    }
};

// ===== STRING UTILITIES =====
const StringUtils = {
    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} length - Maximum length
     * @param {string} suffix - Suffix to add (default: '...')
     */
    truncate(text, length, suffix = '...') {
        if (!text || text.length <= length) return text;
        return text.substring(0, length).trim() + suffix;
    },
    
    /**
     * Capitalize first letter
     * @param {string} text - Text to capitalize
     */
    capitalize(text) {
        if (!text) return text;
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    },
    
    /**
     * Convert to title case
     * @param {string} text - Text to convert
     */
    toTitleCase(text) {
        if (!text) return text;
        return text.replace(/\w\S*/g, (txt) =>
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    },
    
    /**
     * Generate random string
     * @param {number} length - Length of string
     * @param {string} chars - Characters to use
     */
    generateRandomString(length = 10, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },
    
    /**
     * Slugify text (URL-friendly)
     * @param {string} text - Text to slugify
     */
    slugify(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },
    
    /**
     * Format text content (preserve line breaks)
     * @param {string} text - Text to format
     */
    formatTextContent(text) {
        if (!text) return '';
        return text.replace(/\n/g, '<br>');
    }
};

// ===== NUMBER UTILITIES =====
const NumberUtils = {
    /**
     * Format number as currency
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code (default: 'USD')
     */
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },
    
    /**
     * Format large numbers (1K, 1M, etc.)
     * @param {number} num - Number to format
     */
    formatLargeNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    },
    
    /**
     * Calculate percentage
     * @param {number} value - Current value
     * @param {number} total - Total value
     * @param {number} decimals - Decimal places
     */
    getPercentage(value, total, decimals = 0) {
        if (total === 0) return 0;
        return Math.round((value / total) * 100 * Math.pow(10, decimals)) / Math.pow(10, decimals);
    },
    
    /**
     * Clamp number between min and max
     * @param {number} num - Number to clamp
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     */
    clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    },
    
    /**
     * Generate random number between min and max
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     */
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
};

// ===== VALIDATION UTILITIES =====
const ValidationUtils = {
    /**
     * Validate email address
     * @param {string} email - Email to validate
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    /**
     * Validate URL
     * @param {string} url - URL to validate
     */
    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },
    
    /**
     * Validate password strength
     * @param {string} password - Password to validate
     */
    validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const score = [
            password.length >= minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar
        ].filter(Boolean).length;
        
        return {
            isValid: score >= 3,
            score: score,
            suggestions: [
                !hasUpperCase && 'Add uppercase letters',
                !hasLowerCase && 'Add lowercase letters',
                !hasNumbers && 'Add numbers',
                !hasSpecialChar && 'Add special characters',
                password.length < minLength && `Use at least ${minLength} characters`
            ].filter(Boolean)
        };
    },
    
    /**
     * Check if value is empty
     * @param {*} value - Value to check
     */
    isEmpty(value) {
        return value == null || value === '' || 
               (Array.isArray(value) && value.length === 0) ||
               (typeof value === 'object' && Object.keys(value).length === 0);
    },
    
    /**
     * Validate phone number (basic)
     * @param {string} phone - Phone number to validate
     */
    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }
};

// ===== STORAGE UTILITIES =====
const StorageUtils = {
    /**
     * Set item in localStorage with expiration
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @param {number} expirationHours - Hours until expiration
     */
    setWithExpiration(key, value, expirationHours = 24) {
        const now = new Date();
        const item = {
            value: value,
            expiry: now.getTime() + (expirationHours * 60 * 60 * 1000)
        };
        localStorage.setItem(key, JSON.stringify(item));
    },
    
    /**
     * Get item from localStorage (with expiration check)
     * @param {string} key - Storage key
     */
    getWithExpiration(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;
        
        try {
            const item = JSON.parse(itemStr);
            const now = new Date();
            
            if (now.getTime() > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            
            return item.value;
        } catch {
            return null;
        }
    },
    
    /**
     * Clear expired items from localStorage
     */
    clearExpired() {
        const keys = Object.keys(localStorage);
        const now = new Date();
        
        keys.forEach(key => {
            try {
                const itemStr = localStorage.getItem(key);
                const item = JSON.parse(itemStr);
                
                if (item.expiry && now.getTime() > item.expiry) {
                    localStorage.removeItem(key);
                }
            } catch {
                // Ignore items that aren't in our format
            }
        });
    },
    
    /**
     * Get storage size in bytes
     */
    getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        return total;
    }
};

// ===== DOM UTILITIES =====
const DOMUtils = {
    /**
     * Wait for element to exist
     * @param {string} selector - CSS selector
     * @param {number} timeout - Timeout in milliseconds
     */
    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    },
    
    /**
     * Smooth scroll to element
     * @param {string|Element} target - Target element or selector
     * @param {number} offset - Offset from top
     */
    scrollToElement(target, offset = 70) {
        const element = typeof target === 'string' 
            ? document.querySelector(target) 
            : target;
            
        if (element) {
            const elementTop = element.offsetTop - offset;
            window.scrollTo({
                top: elementTop,
                behavior: 'smooth'
            });
        }
    },
    
    /**
     * Check if element is in viewport
     * @param {Element} element - Element to check
     * @param {number} threshold - Threshold percentage (0-1)
     */
    isInViewport(element, threshold = 0.5) {
        const rect = element.getBoundingClientRect();
        const elementHeight = rect.bottom - rect.top;
        const elementWidth = rect.right - rect.left;
        
        return (
            rect.top >= -elementHeight * threshold &&
            rect.left >= -elementWidth * threshold &&
            rect.bottom <= window.innerHeight + elementHeight * threshold &&
            rect.right <= window.innerWidth + elementWidth * threshold
        );
    },
    
    /**
     * Add CSS class with animation
     * @param {Element} element - Target element
     * @param {string} className - CSS class to add
     * @param {number} duration - Animation duration
     */
    addClassWithAnimation(element, className, duration = 300) {
        element.classList.add(className);
        
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, duration);
        });
    },
    
    /**
     * Create element with attributes
     * @param {string} tag - HTML tag
     * @param {Object} attributes - Element attributes
     * @param {string} content - Element content
     */
    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'style') {
                Object.assign(element.style, attributes[key]);
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        if (content) {
            element.innerHTML = content;
        }
        
        return element;
    }
};

// ===== ASYNC UTILITIES =====
const AsyncUtils = {
    /**
     * Debounce function execution
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @param {boolean} immediate - Execute immediately
     */
    debounce(func, wait, immediate = false) {
        let timeout;
        
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            
            if (callNow) func(...args);
        };
    },
    
    /**
     * Throttle function execution
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     */
    throttle(func, limit) {
        let inThrottle;
        
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * Retry async function
     * @param {Function} fn - Async function to retry
     * @param {number} retries - Number of retries
     * @param {number} delay - Delay between retries
     */
    async retry(fn, retries = 3, delay = 1000) {
        try {
            return await fn();
        } catch (error) {
            if (retries > 0) {
                await this.sleep(delay);
                return this.retry(fn, retries - 1, delay);
            }
            throw error;
        }
    },
    
    /**
     * Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    /**
     * Run functions in parallel with limit
     * @param {Array} items - Array of items to process
     * @param {Function} fn - Function to run for each item
     * @param {number} limit - Concurrency limit
     */
    async parallelLimit(items, fn, limit = 5) {
        const results = [];
        
        for (let i = 0; i < items.length; i += limit) {
            const chunk = items.slice(i, i + limit);
            const chunkResults = await Promise.all(chunk.map(fn));
            results.push(...chunkResults);
        }
        
        return results;
    }
};

// ===== EVENT UTILITIES =====
const EventUtils = {
    /**
     * Custom event emitter
     */
    createEventEmitter() {
        const events = {};
        
        return {
            on(event, callback) {
                if (!events[event]) events[event] = [];
                events[event].push(callback);
            },
            
            off(event, callback) {
                if (!events[event]) return;
                events[event] = events[event].filter(cb => cb !== callback);
            },
            
            emit(event, data) {
                if (!events[event]) return;
                events[event].forEach(callback => callback(data));
            },
            
            once(event, callback) {
                const onceWrapper = (data) => {
                    callback(data);
                    this.off(event, onceWrapper);
                };
                this.on(event, onceWrapper);
            }
        };
    },
    
    /**
     * Add event listener with cleanup
     * @param {Element} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     */
    addEventListenerWithCleanup(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
        
        return () => {
            element.removeEventListener(event, handler, options);
        };
    }
};

// ===== PERFORMANCE UTILITIES =====
const PerformanceUtils = {
    /**
     * Measure function execution time
     * @param {Function} fn - Function to measure
     * @param {string} label - Label for measurement
     */
    async measureTime(fn, label = 'Function') {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        
        console.log(`${label} took ${(end - start).toFixed(2)}ms`);
        return result;
    },
    
    /**
     * Lazy load images
     * @param {string} selector - Image selector
     */
    lazyLoadImages(selector = 'img[data-src]') {
        const images = document.querySelectorAll(selector);
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        }
    },
    
    /**
     * Request idle callback wrapper
     * @param {Function} callback - Callback to run
     * @param {number} timeout - Timeout in milliseconds
     */
    onIdle(callback, timeout = 5000) {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(callback, { timeout });
        } else {
            setTimeout(callback, 0);
        }
    }
};

// ===== EXPORT UTILITIES =====
// Make utilities available globally
if (typeof window !== 'undefined') {
    window.DateUtils = DateUtils;
    window.StringUtils = StringUtils;
    window.NumberUtils = NumberUtils;
    window.ValidationUtils = ValidationUtils;
    window.StorageUtils = StorageUtils;
    window.DOMUtils = DOMUtils;
    window.AsyncUtils = AsyncUtils;
    window.EventUtils = EventUtils;
    window.PerformanceUtils = PerformanceUtils;
}

// Also create a unified Utils object
const Utils = {
    date: DateUtils,
    string: StringUtils,
    number: NumberUtils,
    validation: ValidationUtils,
    storage: StorageUtils,
    dom: DOMUtils,
    async: AsyncUtils,
    event: EventUtils,
    performance: PerformanceUtils
};

if (typeof window !== 'undefined') {
    window.Utils = Utils;
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize utilities
    StorageUtils.clearExpired();
    PerformanceUtils.lazyLoadImages();
    
    console.log('🛠️ GameHub Utils loaded successfully');
});
