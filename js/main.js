// Fungsi Umum dan Utility
document.addEventListener('DOMContentLoaded', function() {
    // Inisialisasi tooltips
    initTooltips();
    
    // Animasi untuk elemen auth card
    const authCard = document.querySelector('.auth-card');
    if (authCard) {
        authCard.classList.add('animate__animated', 'animate__fadeIn');
    }
    
    // Toggle sidebar di mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
});

// Toggle Mobile Sidebar
function toggleSidebar() {
    const sidebar = document.querySelector('.chat-sidebar');
    sidebar.classList.toggle('active');
    
    // Animasi overlay
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar.classList.contains('active')) {
        overlay.style.display = 'block';
        setTimeout(() => overlay.style.opacity = '1', 10);
    } else {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 300);
    }
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

// Logout Function
function logout() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    }).catch((error) => {
        console.error('Logout error:', error);
        Swal.fire({
            title: 'Logout Failed',
            text: error.message,
            icon: 'error',
            confirmButtonColor: '#7367f0'
        });
    });
}

// Add to main.js if not already present
const auth = firebase.auth();
const database = firebase.database();

// Style untuk tooltip
const style = document.createElement('style');
style.textContent = `
    .tooltip {
        position: absolute;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 1000;
        pointer-events: none;
        transition: opacity 0.3s;
    }
    
    .sidebar-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 99;
        display: none;
        opacity: 0;
        transition: opacity 0.3s;
    }
`;
document.head.appendChild(style);

// Tambahkan overlay untuk sidebar mobile
const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
overlay.addEventListener('click', toggleSidebar);
document.body.appendChild(overlay);