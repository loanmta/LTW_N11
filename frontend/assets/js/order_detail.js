// Order Detail page JavaScript
let currentOrder = null;

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    
    if (orderId) {
        await loadOrder(orderId);
    } else {
        alert('Không tìm thấy đơn hàng');
        window.location.href = 'orders.html';
    }
});

async function loadOrder(orderId) {
    try {
        currentOrder = await api.getOrder(orderId);
        console.log('Order loaded:', currentOrder);
        displayOrder(currentOrder);
    } catch (error) {
        console.error('Error loading order:', error);
        alert('Không thể tải đơn hàng');
        window.location.href = 'orders.html';
    }
}

function displayOrder(order) {
    // Update page title
    document.title = `Chi tiết đơn hàng ${order.order_number} - OLD SCHOOL`;
    
    // Update order meta
    document.getElementById('orderNumber').textContent = order.order_number;
    document.getElementById('orderDate').textContent = formatDate(order.created_at);
    document.getElementById('orderedDate').textContent = formatDate(order.created_at);
    
    // Display products
    const productsList = document.getElementById('productsList');
    if (order.items && order.items.length > 0) {
        productsList.innerHTML = order.items.map(item => `
            <div class="product-item">
                <div class="product-image">
                    <img src="${item.product_image || 'https://via.placeholder.com/80x100'}" alt="${item.product_name}">
                </div>
                <div class="product-info">
                    <h4 class="product-name">${item.product_name}</h4>
                    <p class="product-details">Số lượng: ${item.quantity} | Màu: ${item.color || 'N/A'} | Size: ${item.size || 'N/A'}</p>
                </div>
            </div>
        `).join('');
    }
    
    // Update summary
    document.getElementById('subtotal').textContent = formatPrice(order.subtotal) + 'đ';
    document.getElementById('shippingFee').textContent = order.shipping_fee > 0 ? formatPrice(order.shipping_fee) + 'đ' : 'Miễn phí';
    document.getElementById('totalAmount').textContent = formatPrice(order.total) + 'đ';
    
    // Update payment method
    const paymentText = order.payment_method === 'qr' ? 'Thanh toán qua mã QR' : 'Thanh toán khi nhận hàng (COD)';
    document.getElementById('paymentMethod').textContent = paymentText;
    
    // Update shipping info
    document.getElementById('shippingCompany').textContent = order.shipping_company || 'Giao Hàng Nhanh';
    
    const trackingEl = document.getElementById('trackingNumber');
    if (order.tracking_number) {
        trackingEl.innerHTML = `${order.tracking_number} 
            <button class="copy-btn" onclick="copyTracking('${order.tracking_number}')">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="5" y="5" width="8" height="8" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M3 11V3h8" stroke="currentColor" stroke-width="1.5"/>
                </svg>
            </button>`;
    } else {
        trackingEl.textContent = 'Đang cập nhật';
    }
    
    document.getElementById('customerName').textContent = order.full_name;
    document.getElementById('customerPhone').textContent = order.phone;
    document.getElementById('customerAddress').textContent = order.address;
    
    // Update timeline based on status
    updateTimeline(order.status);
    
    // Update action buttons based on status
    updateActionButtons(order.status);
}

function updateTimeline(status) {
    const steps = document.querySelectorAll('.timeline-step');
    
    // Reset all steps
    steps.forEach(step => {
        step.classList.remove('completed', 'active');
    });
    
    // Mark completed steps based on status
    if (status === 'pending') {
        steps[0].classList.add('completed');
        steps[1].classList.add('active');
    } else if (status === 'confirmed') {
        steps[0].classList.add('completed');
        steps[1].classList.add('completed');
        steps[2].classList.add('active');
    } else if (status === 'packed') {
        steps[0].classList.add('completed');
        steps[1].classList.add('completed');
        steps[2].classList.add('completed');
        steps[3].classList.add('active');
    } else if (status === 'shipping') {
        steps[0].classList.add('completed');
        steps[1].classList.add('completed');
        steps[2].classList.add('completed');
        steps[3].classList.add('completed');
        steps[4].classList.add('active');
    } else if (status === 'completed') {
        steps.forEach(step => step.classList.add('completed'));
    }
}

function updateActionButtons(status) {
    const container = document.getElementById('actionButtons');
    
    if (status === 'completed') {
        container.innerHTML = '<button class="btn-reorder" onclick="reorderItems()">Mua lại đơn hàng</button>';
    } else if (status === 'cancelled') {
        container.innerHTML = '<button class="btn-reorder" onclick="reorderItems()">Mua lại đơn hàng</button>';
    } else if (status === 'shipping') {
        container.innerHTML = `
            <button class="btn-reorder" onclick="reorderItems()">Mua lại đơn hàng</button>
            <button class="btn-confirm" onclick="confirmReceived()">Xác nhận đã nhận hàng</button>
        `;
    } else {
        container.innerHTML = `
            <button class="btn-cancel" onclick="cancelOrder()">Hủy đơn hàng</button>
            <button class="btn-reorder" onclick="reorderItems()">Mua lại đơn hàng</button>
        `;
    }
}

async function reorderItems() {
    if (!currentOrder || !currentOrder.items) return;
    
    try {
        // Add all items to cart
        for (const item of currentOrder.items) {
            await api.addToCart(item.product, item.quantity);
        }
        
        alert('Đã thêm tất cả sản phẩm vào giỏ hàng');
        window.location.href = 'cart.html';
    } catch (error) {
        console.error('Error reordering:', error);
        alert('Có lỗi xảy ra khi thêm sản phẩm vào giỏ hàng');
    }
}

function cancelOrder() {
    if (confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
        // TODO: Implement cancel order API
        alert('Chức năng hủy đơn hàng đang được phát triển');
    }
}

function confirmReceived() {
    if (confirm('Xác nhận bạn đã nhận được hàng?')) {
        // TODO: Implement confirm received API
        alert('Chức năng xác nhận nhận hàng đang được phát triển');
    }
}

function copyTracking(trackingNumber) {
    navigator.clipboard.writeText(trackingNumber).then(() => {
        showToast('Đã sao chép mã vận đơn: ' + trackingNumber);
    });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <div class="toast-content">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#4CAF50"/>
                <path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

function formatPrice(price) {
    return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
