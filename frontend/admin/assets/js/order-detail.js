// Order Detail JavaScript
let orderId = null;
let orderData = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Get order ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    orderId = urlParams.get('id');
    
    if (orderId) {
        await loadOrderDetail(orderId);
    } else {
        alert('Không tìm thấy mã đơn hàng');
        window.location.href = '/admin/pages/orders.html';
    }
});

// Load Order Detail
async function loadOrderDetail(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${id}/`, {
            credentials: 'include'
        });
        orderData = await response.json();
        
        displayOrderDetail(orderData);
    } catch (error) {
        console.error('Error loading order:', error);
        alert('Không thể tải thông tin đơn hàng');
    }
}

// Display Order Detail
function displayOrderDetail(order) {
    // Update header
    document.getElementById('orderNumber').textContent = order.order_number;
    document.getElementById('orderDate').textContent = formatDate(order.created_at);
    
    // Display products
    displayProducts(order.items);
    
    // Display shipping timeline
    displayShippingTimeline(order.status, order.created_at);
    
    // Display shipping info
    displayShippingInfo(order);
    
    // Display summary
    document.getElementById('subtotal').textContent = formatPrice(order.subtotal) + '₫';
    document.getElementById('shippingFee').textContent = formatPrice(order.shipping_fee) + '₫';
    document.getElementById('totalAmount').textContent = formatPrice(order.total) + '₫';
    
    // Payment method
    const paymentText = order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng';
    document.getElementById('paymentMethod').textContent = paymentText;
    
    // Set current status
    document.getElementById('statusSelect').value = order.status;
}

// Display Products
function displayProducts(items) {
    const container = document.getElementById('productsList');
    
    if (!items || items.length === 0) {
        container.innerHTML = '<p style="color: #999;">Không có sản phẩm</p>';
        return;
    }
    
    container.innerHTML = items.map(item => `
        <div class="product-item">
            <img src="${item.product_image || 'https://via.placeholder.com/80'}" 
                 alt="${item.product_name}" 
                 class="product-image">
            <div class="product-info">
                <div class="product-name">${item.product_name}</div>
                <div class="product-details">
                    Số lượng: ${item.quantity} | Màu: ${item.color || 'N/A'} | Size: ${item.size || 'N/A'}<br>
                    Giá: ${formatPrice(item.price)}₫
                </div>
            </div>
        </div>
    `).join('');
}

// Display Shipping Timeline
function displayShippingTimeline(status, createdAt) {
    const container = document.getElementById('shippingTimeline');
    
    const statuses = [
        { key: 'pending', title: 'Đã đặt hàng', date: formatDateTime(createdAt) },
        { key: 'confirmed', title: 'Chờ xác nhận', date: '02:10, 10/10/2023' },
        { key: 'packed', title: 'Đã xác nhận', date: '16:44, 10/10/2023' },
        { key: 'shipping', title: 'Đang giao hàng', date: '09:00, 16/10/2023' },
        { key: 'completed', title: 'Thành công', date: 'Dự kiến: 20:10' }
    ];
    
    const statusOrder = ['pending', 'confirmed', 'packed', 'shipping', 'completed'];
    const currentIndex = statusOrder.indexOf(status);
    
    // Horizontal timeline
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; position: relative; padding: 20px 0;">
            ${statuses.map((item, index) => {
                const isCompleted = index <= currentIndex;
                const isActive = index === currentIndex;
                
                return `
                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; z-index: 2;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: ${isCompleted ? '#D32F2F' : '#E0E0E0'}; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; transition: all 0.3s;">
                            ${isCompleted ? `
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            ` : ''}
                        </div>
                        <div style="text-align: center;">
                            <div style="font-weight: ${isActive ? '600' : '500'}; color: ${isCompleted ? '#D32F2F' : '#999'}; font-size: 14px; margin-bottom: 4px;">${item.title}</div>
                            <div style="font-size: 12px; color: #999;">${item.date}</div>
                        </div>
                        ${index < statuses.length - 1 ? `
                            <div style="position: absolute; top: 20px; left: 50%; width: 100%; height: 2px; background: ${index < currentIndex ? '#D32F2F' : '#E0E0E0'}; z-index: -1;"></div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Display Shipping Info
function displayShippingInfo(order) {
    const container = document.getElementById('shippingInfo');
    
    container.innerHTML = `
        <div class="info-group">
            <div class="info-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M5 7h14M5 12h14M5 17h10" stroke="currentColor" stroke-width="2"/>
                </svg>
            </div>
            <div class="info-content">
                <div class="info-label">ĐƠN VỊ VẬN CHUYỂN</div>
                <div class="info-value">Giao Hàng Nhanh (GHN Express)</div>
            </div>
        </div>
        
        <div class="info-group">
            <div class="info-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="2"/>
                </svg>
            </div>
            <div class="info-content">
                <div class="info-label">MÃ VẬN ĐƠN</div>
                <div class="info-value">
                    <span class="tracking-number">
                        GHN987654321
                        <button class="copy-btn" onclick="copyTrackingNumber()">Sao chép</button>
                    </span>
                </div>
            </div>
        </div>
        
        <div class="info-group">
            <div class="info-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke="currentColor" stroke-width="2"/>
                    <circle cx="12" cy="11" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
            </div>
            <div class="info-content">
                <div class="info-label">ĐỊA CHỈ NHẬN HÀNG</div>
                <div class="info-value">
                    <strong>${order.full_name}</strong><br>
                    ${order.phone}<br>
                    ${order.address}, ${order.district}, ${order.city}
                </div>
            </div>
        </div>
    `;
}

// Update Order Status
async function updateOrderStatus() {
    const newStatus = document.getElementById('statusSelect').value;
    
    if (!confirm(`Bạn có chắc muốn cập nhật trạng thái đơn hàng thành "${getStatusText(newStatus)}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            alert('Đã cập nhật trạng thái đơn hàng');
            await loadOrderDetail(orderId);
        } else {
            alert('Không thể cập nhật trạng thái');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Có lỗi xảy ra khi cập nhật trạng thái');
    }
}

// Get Status Text
function getStatusText(status) {
    const statusMap = {
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'shipping': 'Đang giao hàng',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy'
    };
    return statusMap[status] || status;
}

// Copy Tracking Number
function copyTrackingNumber() {
    const trackingNumber = 'GHN987654321';
    navigator.clipboard.writeText(trackingNumber).then(() => {
        alert('Đã sao chép mã vận đơn');
    });
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Format DateTime
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes}, ${day}/${month}/${year}`;
}

// Format Price
function formatPrice(price) {
    return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
