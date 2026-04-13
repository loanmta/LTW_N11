// Customers Management JavaScript
let allCustomers = [];
let filteredCustomers = [];
let currentPage = 1;
const customersPerPage = 10;
let customerToDelete = null;

document.addEventListener('DOMContentLoaded', async function() {
    await loadCustomers();
});

// Load Customers
async function loadCustomers() {
    try {
        console.log('Loading customers from:', `${API_BASE_URL}/users/`);
        // Get all users from API
        const response = await fetch(`${API_BASE_URL}/users/`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Customers data:', data);
        
        allCustomers = data.results || data;
        console.log('Total customers:', allCustomers.length);
        
        // Map order_count from API to orders field for display
        allCustomers.forEach(customer => {
            customer.orders = customer.order_count || 0;
        });
        
        filteredCustomers = allCustomers;
        displayCustomers();
        updateCustomerCount();
    } catch (error) {
        console.error('Error loading customers:', error);
        
        // Use mock data if API fails
        console.log('Using mock data...');
        allCustomers = generateMockCustomers();
        filteredCustomers = allCustomers;
        displayCustomers();
        updateCustomerCount();
    }
}

// Generate Mock Customers
function generateMockCustomers() {
    return [
        { id: 'KH000001', name: 'Nguyễn Minh Khoa', email: 'hung.nv@gmail.com', phone: '090 123 4567', orders: 12 },
        { id: 'KH000002', name: 'Trần Thị Thảo', email: 'thaotran@gmail.com', phone: '091 888 7766', orders: 5 },
        { id: 'KH000003', name: 'Trần Minh Khôi', email: 'uichukhongtien@gmail.com', phone: '091 458 7762', orders: 4 },
        { id: 'KH000004', name: 'Bùi Thị Lan', email: 'lanbui@gmail.com', phone: '091 248 7476', orders: 16 },
        { id: 'KH000005', name: 'Nguyễn Cao Sơn Thạch', email: 'tmemeo@gmail.com', phone: '093 883 7202', orders: 8 },
        { id: 'KH000006', name: 'Lê Minh', email: 'leminh_dev@gmail.com', phone: '098 765 4321', orders: 32 },
        { id: 'KH000007', name: 'Phạm Thanh', email: 'pt.thanh@gmail.com', phone: '093 444 5555', orders: 2 }
    ];
}

// Load Order Counts
async function loadOrderCounts() {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/`, {
            credentials: 'include'
        });
        const orders = await response.json();
        const orderData = orders.results || orders;
        
        // Count orders per customer
        const orderCounts = {};
        orderData.forEach(order => {
            const userId = order.user_id || order.email;
            orderCounts[userId] = (orderCounts[userId] || 0) + 1;
        });
        
        // Update customer order counts
        allCustomers.forEach(customer => {
            customer.orders = orderCounts[customer.id] || orderCounts[customer.email] || 0;
        });
    } catch (error) {
        console.error('Error loading order counts:', error);
    }
}

// Display Customers
function displayCustomers() {
    const tbody = document.getElementById('customersTableBody');
    
    if (!filteredCustomers || filteredCustomers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">Không có khách hàng</td></tr>';
        return;
    }
    
    // Pagination
    const startIndex = (currentPage - 1) * customersPerPage;
    const endIndex = startIndex + customersPerPage;
    const customersToShow = filteredCustomers.slice(startIndex, endIndex);
    
    tbody.innerHTML = customersToShow.map(customer => `
        <tr>
            <td>
                <span class="customer-id">${customer.id || 'KH' + String(customer.user_id || '000000').padStart(6, '0')}</span>
            </td>
            <td>
                <span class="customer-name">${customer.name || customer.full_name || customer.email}</span>
            </td>
            <td>
                <span class="customer-email">${customer.email}</span>
            </td>
            <td>
                <span class="customer-phone">${customer.phone || 'N/A'}</span>
            </td>
            <td>
                <span class="customer-orders">${customer.orders || 0}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action" onclick="viewCustomer('${customer.id || customer.user_id}')" title="Xem chi tiết">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    <button class="btn-action delete" onclick="openDeleteModal('${customer.id || customer.user_id}', '${customer.name || customer.email}')" title="Xóa">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    updatePagination();
}

// View Customer
async function viewCustomer(customerId) {
    try {
        // Get customer info
        const customer = allCustomers.find(c => (c.id || c.user_id) == customerId);
        if (!customer) {
            alert('Không tìm thấy khách hàng');
            return;
        }
        
        // Get customer orders
        const response = await fetch(`${API_BASE_URL}/orders/?user=${customerId}`, {
            credentials: 'include'
        });
        const ordersData = await response.json();
        const orders = ordersData.results || ordersData;
        
        // Filter orders by this customer
        const customerOrders = orders.filter(order => 
            order.user == customerId || 
            order.user_id == customerId ||
            order.email === customer.email
        );
        
        showCustomerDetailModal(customer, customerOrders);
    } catch (error) {
        console.error('Error loading customer details:', error);
        alert('Không thể tải thông tin khách hàng');
    }
}

// Show Customer Detail Modal
function showCustomerDetailModal(customer, orders) {
    const modal = document.getElementById('customerDetailModal');
    if (!modal) {
        createCustomerDetailModal();
        return showCustomerDetailModal(customer, orders);
    }
    
    // Calculate total spent
    const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
    
    // Update modal content
    document.getElementById('customerDetailName').textContent = customer.name || customer.full_name || customer.email;
    document.getElementById('customerDetailEmail').textContent = customer.email;
    document.getElementById('customerDetailPhone').textContent = customer.phone || 'N/A';
    document.getElementById('customerDetailOrders').textContent = orders.length;
    document.getElementById('customerDetailSpent').textContent = formatCurrency(totalSpent);
    
    // Display orders
    const ordersContainer = document.getElementById('customerOrdersList');
    if (orders.length === 0) {
        ordersContainer.innerHTML = '<div class="no-orders">Khách hàng chưa có đơn hàng nào</div>';
    } else {
        ordersContainer.innerHTML = orders.map(order => `
            <div class="customer-order-item">
                <div class="order-item-header">
                    <span class="order-number">#${order.order_number}</span>
                    <span class="order-status status-${order.status}">${getStatusText(order.status)}</span>
                </div>
                <div class="order-item-details">
                    <div class="order-detail">
                        <span class="detail-label">Ngày đặt:</span>
                        <span class="detail-value">${formatDate(order.created_at)}</span>
                    </div>
                    <div class="order-detail">
                        <span class="detail-label">Tổng tiền:</span>
                        <span class="detail-value">${formatCurrency(order.total)}</span>
                    </div>
                    <div class="order-detail">
                        <span class="detail-label">Sản phẩm:</span>
                        <span class="detail-value">${order.items?.length || 0} sản phẩm</span>
                    </div>
                </div>
                <button class="btn-view-order" onclick="window.location.href='/admin/pages/order-detail.html?id=${order.order_id}'">
                    Xem chi tiết
                </button>
            </div>
        `).join('');
    }
    
    modal.classList.add('active');
}

// Create Customer Detail Modal
function createCustomerDetailModal() {
    const modal = document.createElement('div');
    modal.id = 'customerDetailModal';
    modal.className = 'customer-detail-modal';
    modal.innerHTML = `
        <div class="customer-detail-content">
            <button class="modal-close" onclick="closeCustomerDetailModal()">×</button>
            <h2 class="modal-title">Chi tiết khách hàng</h2>
            
            <div class="customer-info-section">
                <div class="info-row">
                    <span class="info-label">Họ và tên:</span>
                    <span class="info-value" id="customerDetailName">-</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value" id="customerDetailEmail">-</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Số điện thoại:</span>
                    <span class="info-value" id="customerDetailPhone">-</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Tổng đơn hàng:</span>
                    <span class="info-value" id="customerDetailOrders">0</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Tổng chi tiêu:</span>
                    <span class="info-value highlight" id="customerDetailSpent">0đ</span>
                </div>
            </div>
            
            <h3 class="orders-title">Lịch sử đơn hàng</h3>
            <div class="customer-orders-list" id="customerOrdersList">
                <div class="loading">Đang tải...</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Close Customer Detail Modal
function closeCustomerDetailModal() {
    const modal = document.getElementById('customerDetailModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Helper Functions
function formatCurrency(amount) {
    return parseFloat(amount || 0).toLocaleString('vi-VN') + 'đ';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'packed': 'Đã đóng gói',
        'shipping': 'Đang giao',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
}

// Open Delete Modal
function openDeleteModal(customerId, customerName) {
    customerToDelete = customerId;
    document.getElementById('deleteModal').classList.add('active');
}

// Close Delete Modal
function closeDeleteModal() {
    customerToDelete = null;
    document.getElementById('deleteModal').classList.remove('active');
}

// Confirm Delete
async function confirmDelete() {
    if (!customerToDelete) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/${customerToDelete}/`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            alert('Đã xóa khách hàng thành công');
            closeDeleteModal();
            await loadCustomers();
        } else {
            alert('Không thể xóa khách hàng');
        }
    } catch (error) {
        console.error('Error deleting customer:', error);
        
        // For demo: remove from mock data
        allCustomers = allCustomers.filter(c => (c.id || c.user_id) !== customerToDelete);
        filteredCustomers = allCustomers;
        displayCustomers();
        updateCustomerCount();
        closeDeleteModal();
        alert('Đã xóa khách hàng thành công');
    }
}

// Filter by Date
function filterByDate() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate && !endDate) {
        filteredCustomers = allCustomers;
    } else {
        // TODO: Implement date filtering when API supports it
        alert('Chức năng lọc theo ngày sẽ được triển khai sau');
        return;
    }
    
    currentPage = 1;
    displayCustomers();
    updateCustomerCount();
}

// Update Customer Count
function updateCustomerCount() {
    const showingCount = document.getElementById('showingCount');
    const totalCount = document.getElementById('totalCount');
    
    if (showingCount && totalCount) {
        const start = (currentPage - 1) * customersPerPage + 1;
        const end = Math.min(currentPage * customersPerPage, filteredCustomers.length);
        showingCount.textContent = `${start} - ${end}`;
        totalCount.textContent = filteredCustomers.length.toLocaleString();
    }
}

// Pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
    const pagination = document.getElementById('pagination');
    
    if (!pagination) return;
    
    let html = '<button class="pagination-btn" onclick="prevPage()">‹</button>';
    
    // Show first 3 pages
    for (let i = 1; i <= Math.min(totalPages, 3); i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    if (totalPages > 5) {
        html += '<button class="pagination-btn">...</button>';
        html += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    } else if (totalPages > 3) {
        for (let i = 4; i <= totalPages; i++) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        }
    }
    
    html += '<button class="pagination-btn" onclick="nextPage()">›</button>';
    
    pagination.innerHTML = html;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayCustomers();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayCustomers();
    }
}

function goToPage(page) {
    currentPage = page;
    displayCustomers();
}
