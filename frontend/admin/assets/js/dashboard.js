// Dashboard JavaScript
checkAuth(); // Check if logged in

document.addEventListener('DOMContentLoaded', async function() {
    await loadDashboardData();
});

async function loadDashboardData() {
    try {
        // Load stats
        const stats = await adminAPI.getDashboardStats();
        
        document.getElementById('newOrdersCount').textContent = `${stats.pending_orders} đơn hàng mới`;
        document.getElementById('totalOrders').textContent = `${stats.total_orders} đơn hàng`;
        document.getElementById('totalCustomers').textContent = `${stats.total_customers.toLocaleString()} thành viên`;
        document.getElementById('totalProducts').textContent = `${stats.total_products} mặt hàng`;
        document.getElementById('monthRevenue').textContent = formatPrice(stats.total_revenue);
        
        // Update revenue card info
        document.getElementById('completedOrders').textContent = stats.total_orders - stats.pending_orders;
        document.getElementById('pendingOrdersCount').textContent = stats.pending_orders;
        
        // Load revenue chart
        loadRevenueChart(stats.revenue_by_month);
        
        // Load recent orders
        await loadRecentOrders();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadRecentOrders() {
    try {
        const response = await adminAPI.getOrders({ page_size: 5 });
        const orders = response.results || response;
        
        displayRecentOrders(orders.slice(0, 5));
    } catch (error) {
        console.error('Error loading recent orders:', error);
        document.getElementById('recentOrdersList').innerHTML = '<div class="loading">Không thể tải đơn hàng</div>';
    }
}

function displayRecentOrders(orders) {
    const container = document.getElementById('recentOrdersList');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = '<div class="empty-state">Chưa có đơn hàng nào</div>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-item">
            <div class="order-icon ${getStatusClass(order.status)}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
            </div>
            <div class="order-info">
                <h4 class="order-number">#${order.order_number}</h4>
                <p class="order-customer">${order.full_name}</p>
                <p class="order-time">${formatTimeAgo(order.created_at)}</p>
            </div>
            <div class="order-amount">
                <span class="amount">${formatPrice(order.total)}đ</span>
                <span class="status-badge ${getStatusClass(order.status)}">${getStatusText(order.status)}</span>
            </div>
        </div>
    `).join('');
}

function getStatusClass(status) {
    const classes = {
        'pending': 'status-pending',
        'confirmed': 'status-confirmed',
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

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
}

function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function loadRevenueChart(revenueData) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    console.log('Revenue data:', revenueData); // Debug
    
    // Parse revenue data from API (format: "MM/YYYY")
    const labels = [];
    const data = [];
    
    if (revenueData && revenueData.length > 0) {
        // Use the data from API directly
        revenueData.forEach(item => {
            const [month, year] = item.month.split('/');
            labels.push(`T${parseInt(month)}`);
            data.push(item.revenue);
        });
    } else {
        // Fallback: show last 6 months with 0 data
        const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
        const currentMonth = new Date().getMonth();
        
        for (let i = 5; i >= 0; i--) {
            const monthIndex = (currentMonth - i + 12) % 12;
            labels.push(months[monthIndex]);
            data.push(0);
        }
    }
    
    console.log('Chart labels:', labels); // Debug
    console.log('Chart data:', data); // Debug
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu',
                data: data,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderColor: 'rgba(255, 255, 255, 1)',
                borderWidth: 0,
                borderRadius: 8,
                borderSkipped: false,
                barThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    titleColor: '#D32F2F',
                    bodyColor: '#333',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    borderWidth: 2,
                    padding: 16,
                    displayColors: false,
                    titleFont: {
                        size: 13,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 15,
                        weight: '600'
                    },
                    cornerRadius: 10,
                    caretSize: 6,
                    callbacks: {
                        label: function(context) {
                            return formatPrice(context.parsed.y) + 'đ';
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.85)',
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        padding: 8,
                        callback: function(value) {
                            if (value >= 1000000) {
                                return (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 1000) {
                                return (value / 1000).toFixed(0) + 'K';
                            }
                            return value;
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.12)',
                        drawBorder: false,
                        lineWidth: 1
                    },
                    border: {
                        display: false
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.85)',
                        font: {
                            size: 12,
                            weight: '600'
                        },
                        padding: 8
                    },
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                }
            }
        }
    });
}


// Check admin access on page load
if (sessionStorage.getItem('userRole') !== 'admin') {
    alert('Bạn không có quyền truy cập trang này!');
    window.location.href = '/login.html';
}
