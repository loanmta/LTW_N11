// Orders page JavaScript
let allOrders = [];
let currentStatus = 'all';

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    currentStatus = urlParams.get('status') || 'all';
    const search = urlParams.get('search') || '';
    
    // Update active tab
    updateActiveTab(currentStatus);
    
    // Set search input value
    const searchInput = document.querySelector('.search-input');
    if (searchInput && search) {
        searchInput.value = search;
    }
    
    await loadOrders(currentStatus, search);
    setupEventListeners();
});

function setupEventListeners() {
    // Filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            const status = this.getAttribute('data-status');
            const currentPath = window.location.pathname;
            window.location.href = `${currentPath}?status=${status}`;
        });
    });
    
    // Search form
    const searchForm = document.querySelector('.search-form');
    const searchInput = document.querySelector('.search-input');
    
    console.log('Search form:', searchForm);
    console.log('Search input:', searchInput);
    
    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const query = searchInput.value.trim();
            const currentPath = window.location.pathname;
            console.log('Search query:', query);
            if (query) {
                window.location.href = `${currentPath}?status=${currentStatus}&search=${encodeURIComponent(query)}`;
            } else {
                window.location.href = `${currentPath}?status=${currentStatus}`;
            }
        });
        
        // Also handle Enter key on input
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = this.value.trim();
                const currentPath = window.location.pathname;
                console.log('Search query (Enter):', query);
                if (query) {
                    window.location.href = `${currentPath}?status=${currentStatus}&search=${encodeURIComponent(query)}`;
                } else {
                    window.location.href = `${currentPath}?status=${currentStatus}`;
                }
            }
        });
    } else {
        console.error('Search form or input not found!');
    }
}

function updateActiveTab(status) {
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-status') === status) {
            tab.classList.add('active');
        }
    });
}

async function loadOrders(status = 'all', search = '') {
    try {
        const params = {};
        
        // Add search parameter if provided
        if (search) {
            params.search = search;
        }
        
        // Map frontend status to backend status
        if (status !== 'all') {
            params.status = status;
        }
        
        console.log('Loading orders with params:', params);
        
        // Show loading state
        const container = document.querySelector('.orders-list');
        container.innerHTML = '<div class="loading-state">Đang tìm kiếm đơn hàng...</div>';
        
        const data = await api.getOrders(params);
        let orders = Array.isArray(data) ? data : (data.results || []);
        
        console.log('Received orders:', orders);
        
        allOrders = orders;
        
        // Show appropriate message based on search
        if (orders.length === 0 && search) {
            showSearchEmptyState(search);
        } else if (orders.length === 0) {
            showEmptyState();
        } else {
            displayOrders(allOrders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showEmptyState();
    }
}

function displayOrders(orders) {
    const container = document.querySelector('.orders-list');
    
    if (!orders || orders.length === 0) {
        showEmptyState();
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div class="order-icon">
                    ${getStatusIcon(order.status)}
                </div>
                <div class="order-info">
                    <h3 class="order-number">${order.order_number}</h3>
                    <p class="order-date">Ngày đặt: ${formatDate(order.created_at)}</p>
                </div>
                <div class="order-status">
                    <span class="status-badge ${getStatusClass(order.status)}">
                        ${getStatusText(order.status)}
                    </span>
                </div>
            </div>
            <div class="order-footer">
                <div class="order-total">
                    <span class="total-label">TỔNG CỘNG</span>
                    <span class="total-value">${formatPrice(order.total)}đ</span>
                </div>
                <a href="order_detail.html?id=${order.order_id}" class="btn-view-detail">Xem chi tiết</a>
            </div>
        </div>
    `).join('');
}

function showEmptyState() {
    const container = document.querySelector('.orders-list');
    container.innerHTML = `
        <div class="empty-state">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <rect x="20" y="30" width="80" height="70" rx="4" stroke="#E0E0E0" stroke-width="3"/>
                <path d="M30 45h60M30 60h50M30 75h40" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>
            </svg>
            <h3 class="empty-title">Chưa có đơn hàng nào</h3>
            <p class="empty-text">Bạn chưa có đơn hàng nào. Hãy khám phá và mua sắm ngay!</p>
            <a href="products.html" class="btn-shop-now">Mua sắm ngay</a>
        </div>
    `;
}

function showSearchEmptyState(searchQuery) {
    const container = document.querySelector('.orders-list');
    container.innerHTML = `
        <div class="empty-state">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <circle cx="50" cy="50" r="30" stroke="#E0E0E0" stroke-width="3" fill="none"/>
                <line x1="72" y1="72" x2="95" y2="95" stroke="#E0E0E0" stroke-width="3" stroke-linecap="round"/>
                <line x1="40" y1="45" x2="60" y2="45" stroke="#E0E0E0" stroke-width="2" stroke-linecap="round"/>
                <line x1="40" y1="55" x2="60" y2="55" stroke="#E0E0E0" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <h3 class="empty-title">Không tìm thấy đơn hàng</h3>
            <p class="empty-text">Không tìm thấy đơn hàng với mã "<strong>${searchQuery}</strong>"</p>
            <button onclick="clearSearch()" class="btn-shop-now">Xóa tìm kiếm</button>
        </div>
    `;
}

function clearSearch() {
    const currentPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status') || 'all';
    window.location.href = `${currentPath}?status=${status}`;
}

function clearSearchFromButton() {
    clearSearch();
}

function getStatusIcon(status) {
    const icons = {
        completed: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" stroke="#4CAF50" stroke-width="2"/><path d="M12 16l3 3 5-5" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        shipping: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M4 12h16v10H4z" stroke="#2196F3" stroke-width="2"/><path d="M20 16h4l4 4v6h-8v-10z" stroke="#2196F3" stroke-width="2"/><circle cx="10" cy="26" r="2" stroke="#2196F3" stroke-width="2"/><circle cx="24" cy="26" r="2" stroke="#2196F3" stroke-width="2"/></svg>',
        pending: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M8 12h16M8 16h12M8 20h8" stroke="#FF9800" stroke-width="2" stroke-linecap="round"/><rect x="4" y="8" width="24" height="18" rx="2" stroke="#FF9800" stroke-width="2"/></svg>',
        cancelled: '<svg width="32" height="32" viewBox="0 0 32 32" fill="none"><circle cx="16" cy="16" r="10" stroke="#9E9E9E" stroke-width="2"/><path d="M12 12l8 8M20 12l-8 8" stroke="#9E9E9E" stroke-width="2" stroke-linecap="round"/></svg>'
    };
    return icons[status] || icons.pending;
}

function getStatusClass(status) {
    const classes = {
        'pending': 'status-pending',
        'confirmed': 'status-pending',
        'shipping': 'status-shipping',
        'completed': 'status-completed',
        'cancelled': 'status-cancelled'
    };
    return classes[status] || 'status-pending';
}

function getStatusText(status) {
    const texts = {
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'shipping': 'Đang giao',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy'
    };
    return texts[status] || 'Chờ xác nhận';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

function formatPrice(price) {
    return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
