// Orders Management JavaScript
let allOrders = [];
let filteredOrders = [];
let currentStatus = 'all';
let currentPage = 1;
const ordersPerPage = 10;
let totalOrdersCount = 0; // Store total count from API

document.addEventListener('DOMContentLoaded', async function() {
    await loadOrders();
});

// Load Orders
async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/?page_size=100`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        allOrders = data.results || data;
        totalOrdersCount = data.count || allOrders.length; // Get total count from API
        console.log('Loaded orders:', allOrders.length, 'Total count:', totalOrdersCount); // Debug log
        filteredOrders = allOrders;
        displayOrders();
        updateOrderCount();
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('ordersTableBody').innerHTML = `
            <tr>
                <td colspan="6" class="loading" style="color: red;">
                    Không thể tải đơn hàng<br>
                    <small>Lỗi: ${error.message}</small>
                </td>
            </tr>
        `;
    }
}

// Display Orders
function displayOrders() {
    const tbody = document.getElementById('ordersTableBody');
    
    if (!filteredOrders || filteredOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Không có đơn hàng</td></tr>';
        return;
    }
    
    // Pagination
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const ordersToShow = filteredOrders.slice(startIndex, endIndex);
    
    tbody.innerHTML = ordersToShow.map(order => `
        <tr>
            <td>
                <span class="order-id" onclick="viewOrderDetail(${order.order_id})">${order.order_number}</span>
            </td>
            <td>
                <span class="customer-name">${order.full_name}</span>
            </td>
            <td>
                <span class="order-date">${formatDate(order.created_at)}</span>
            </td>
            <td>
                <span class="order-total">${formatPrice(order.total)}₫</span>
            </td>
            <td>
                <span class="status-badge ${order.status}">
                    <span class="status-dot"></span>
                    ${getStatusText(order.status)}
                </span>
            </td>
            <td>
                <button class="btn-view-detail" onclick="viewOrderDetail(${order.order_id})">Chi tiết</button>
            </td>
        </tr>
    `).join('');
    
    updatePagination();
}

// Get Status Text
function getStatusText(status) {
    const statusMap = {
        'pending': 'CHỜ XÁC NHẬN',
        'confirmed': 'ĐÃ XÁC NHẬN',
        'shipping': 'ĐANG GIAO',
        'completed': 'HOÀN THÀNH',
        'cancelled': 'ĐÃ HỦY'
    };
    return statusMap[status] || status.toUpperCase();
}

// Filter by Status
function filterByStatus(status) {
    currentStatus = status;
    currentPage = 1;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.filter-btn[data-status="${status}"]`).classList.add('active');
    
    // Filter orders
    if (status === 'all') {
        filteredOrders = allOrders;
    } else {
        filteredOrders = allOrders.filter(order => order.status === status);
    }
    
    displayOrders();
    updateOrderCount();
}

// Search Orders
document.getElementById('searchOrders')?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (!searchTerm) {
        filteredOrders = currentStatus === 'all' ? allOrders : allOrders.filter(o => o.status === currentStatus);
    } else {
        const baseOrders = currentStatus === 'all' ? allOrders : allOrders.filter(o => o.status === currentStatus);
        filteredOrders = baseOrders.filter(order => 
            order.order_number.toLowerCase().includes(searchTerm) ||
            order.full_name.toLowerCase().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    displayOrders();
    updateOrderCount();
});

// View Order Detail
function viewOrderDetail(orderId) {
    window.location.href = `/admin/pages/order-detail.html?id=${orderId}`;
}

// Update Order Count
function updateOrderCount() {
    console.log('updateOrderCount called - totalOrdersCount:', totalOrdersCount, 'allOrders:', allOrders.length, 'filteredOrders:', filteredOrders.length); // Debug
    const totalElement = document.getElementById('totalOrders');
    if (totalElement) {
        // Use total count from API
        const totalText = `${totalOrdersCount} Đơn hàng`;
        console.log('Setting totalOrders to:', totalText); // Debug
        totalElement.textContent = totalText;
    }
    
    const showingCount = document.getElementById('showingCount');
    const totalCount = document.getElementById('totalCount');
    
    if (showingCount && totalCount) {
        const start = (currentPage - 1) * ordersPerPage + 1;
        const end = Math.min(currentPage * ordersPerPage, filteredOrders.length);
        showingCount.textContent = filteredOrders.length > 0 ? `${start} - ${end}` : '0';
        totalCount.textContent = filteredOrders.length;
    }
}

// Pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    const pagination = document.getElementById('pagination');
    
    if (!pagination) return;
    
    let html = '<button class="pagination-btn" onclick="prevPage()">‹</button>';
    
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    if (totalPages > 5) {
        html += '<button class="pagination-btn">...</button>';
        html += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    html += '<button class="pagination-btn" onclick="nextPage()">›</button>';
    
    pagination.innerHTML = html;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayOrders();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayOrders();
    }
}

function goToPage(page) {
    currentPage = page;
    displayOrders();
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Format Price
function formatPrice(price) {
    return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
