// Toggle Mobile Sidebar
function toggleSidebar() {
    const sidebar = document.querySelector('.chat-sidebar');
    sidebar.classList.toggle('active');
}

// Format Timestamp to Relative Time
function formatRelativeTime(timestamp) {
    if (!timestamp) return '';
    
    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Throttle Function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Check if Mobile Device
function isMobile() {
    return window.innerWidth <= 768;
}

// Initialize Tooltips
function initTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    
    tooltips.forEach(tooltip => {
        tooltip.addEventListener('mouseenter', showTooltip);
        tooltip.addEventListener('mouseleave', hideTooltip);
    });
    
    function showTooltip(e) {
        const tooltipText = this.getAttribute('data-tooltip');
        const tooltipEl = document.createElement('div');
        tooltipEl.className = 'tooltip';
        tooltipEl.textContent = tooltipText;
        document.body.appendChild(tooltipEl);
        
        const rect = this.getBoundingClientRect();
        tooltipEl.style.left = `${rect.left + rect.width / 2 - tooltipEl.offsetWidth / 2}px`;
        tooltipEl.style.top = `${rect.top - tooltipEl.offsetHeight - 5}px`;
    }
    
    function hideTooltip() {
        const tooltip = document.querySelector('.tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initTooltips();
    
    // Add animation to auth card on load
    const authCard = document.querySelector('.auth-card');
    if (authCard) {
        authCard.classList.add('animate__animated', 'animate__fadeIn');
    }
});