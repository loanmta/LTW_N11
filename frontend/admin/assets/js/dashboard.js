// Dashboard JavaScript
checkAuth(); // Check if logged in

document.addEventListener('DOMContentLoaded', async function() {
    await loadDashboardData();
});

async function loadDashboardData() {
    try {
        // Load stats
        const stats = await adminAPI.getDashboardStats();
        
        document.getElementById('newOrdersCount').textContent = `${stats.newOrders} đơn hàng mới`;
        document.getElementById('totalOrders').textContent = `${stats.newOrders} đơn mới`;
        document.getElementById('totalCustomers').textContent = `${stats.totalCustomers.toLocaleString()} thành viên`;
        document.getElementById('totalProducts').textContent = `${stats.totalProducts} mặt hàng`;
        document.getElementById('monthRevenue').textContent = formatPrice(stats.monthRevenue);
        
        // Load activities
        const activities = await adminAPI.getRecentActivities();
        displayActivities(activities);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function displayActivities(activities) {
    const container = document.getElementById('activitiesList');
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                ${getActivityIcon(activity.type)}
            </div>
            <div class="activity-info">
                <h4>${activity.title}</h4>
                <p>${activity.description}</p>
            </div>
            ${activity.amount ? `<div class="activity-amount">${activity.amount}</div>` : ''}
        </div>
    `).join('');
}

function getActivityIcon(type) {
    const icons = {
        order: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>',
        member: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>',
        product: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M3 8l9-5 9 5"/></svg>'
    };
    return icons[type] || icons.order;
}

function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}


// Check admin access on page load
if (sessionStorage.getItem('userRole') !== 'admin') {
    alert('Bạn không có quyền truy cập trang này!');
    window.location.href = '/login.html';
}
