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
        step.classList.remove('completed', 'active', 'cancelled');
    });
    
    // Mark completed steps based on status
    if (status === 'pending') {
        steps[0].classList.add('completed');
        if (steps[1]) steps[1].classList.add('active');
    } else if (status === 'confirmed') {
        steps[0].classList.add('completed');
        steps[1].classList.add('completed');
        if (steps[2]) steps[2].classList.add('active');
    } else if (status === 'shipping') {
        steps[0].classList.add('completed');
        steps[1].classList.add('completed');
        steps[2].classList.add('completed');
        // Step 3 is active but NOT completed (still shipping)
        if (steps[3]) steps[3].classList.add('active');
    } else if (status === 'completed' || status === 'delivered') {
        // All steps completed
        steps.forEach(step => step.classList.add('completed'));
    } else if (status === 'cancelled') {
        // Only first step completed, rest cancelled
        steps[0].classList.add('completed');
        // Mark remaining steps as cancelled
        for (let i = 1; i < steps.length; i++) {
            steps[i].classList.add('cancelled');
        }
    }
}

function updateActionButtons(status) {
    const container = document.getElementById('actionButtons');
    
    if (status === 'completed') {
        // Show review buttons for each product
        let buttonsHTML = '';
        if (currentOrder && currentOrder.items) {
            currentOrder.items.forEach(item => {
                buttonsHTML += `<button class="btn-review" onclick="openReviewModal(${item.product}, '${item.product_name}', '${item.product_image}')">Đánh giá sản phẩm</button>`;
            });
        }
        buttonsHTML += '<button class="btn-reorder" onclick="reorderItems()">Mua lại đơn hàng</button>';
        container.innerHTML = buttonsHTML;
    } else if (status === 'cancelled') {
        container.innerHTML = `
            <div class="cancelled-notice">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#D32F2F" stroke-width="2"/>
                    <path d="M8 8l8 8M16 8l-8 8" stroke="#D32F2F" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>Đơn hàng đã bị hủy</span>
            </div>
            <button class="btn-reorder" onclick="reorderItems()">Mua lại đơn hàng</button>
        `;
    } else if (status === 'shipping') {
        container.innerHTML = `
            <button class="btn-reorder" onclick="reorderItems()">Mua lại đơn hàng</button>
            <button class="btn-confirm" onclick="confirmReceived()">Xác nhận đã nhận hàng</button>
        `;
    } else if (status === 'pending') {
        // Only pending orders can be cancelled
        container.innerHTML = `
            <button class="btn-cancel" onclick="cancelOrder()">Hủy đơn hàng</button>
            <button class="btn-reorder" onclick="reorderItems()">Mua lại đơn hàng</button>
        `;
    } else {
        // confirmed - cannot cancel anymore
        container.innerHTML = `
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

async function cancelOrder() {
    if (!currentOrder) return;
    
    if (!confirm('Bạn có chắc muốn hủy đơn hàng này?')) {
        return;
    }
    
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/orders/${currentOrder.order_id}/cancel/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Đã hủy đơn hàng thành công');
            // Reload order to update status
            await loadOrder(currentOrder.order_id);
        } else {
            alert(data.message || 'Không thể hủy đơn hàng');
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        alert('Có lỗi xảy ra khi hủy đơn hàng');
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

// Review Modal Functions
let selectedRating = 0;
let currentReviewProduct = null;

function openReviewModal(productId, productName, productImage) {
    currentReviewProduct = productId;
    selectedRating = 0;
    
    // Update product info in modal
    document.getElementById('reviewProductInfo').innerHTML = `
        <div class="review-product-item">
            <img src="${productImage}" alt="${productName}">
            <h4>${productName}</h4>
        </div>
    `;
    
    // Reset form
    document.getElementById('reviewComment').value = '';
    document.getElementById('ratingText').textContent = 'Chọn số sao';
    document.querySelectorAll('.star-btn').forEach(star => star.classList.remove('selected'));
    
    // Show modal
    document.getElementById('reviewModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Star rating interaction
document.addEventListener('DOMContentLoaded', function() {
    const starButtons = document.querySelectorAll('.star-btn');
    const ratingText = document.getElementById('ratingText');
    
    const ratingTexts = {
        1: 'Rất tệ',
        2: 'Tệ',
        3: 'Bình thường',
        4: 'Tốt',
        5: 'Tuyệt vời'
    };
    
    starButtons.forEach(star => {
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.dataset.rating);
            
            // Update star display
            starButtons.forEach(s => {
                const rating = parseInt(s.dataset.rating);
                if (rating <= selectedRating) {
                    s.classList.add('selected');
                } else {
                    s.classList.remove('selected');
                }
            });
            
            // Update rating text
            ratingText.textContent = ratingTexts[selectedRating];
        });
        
        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.dataset.rating);
            starButtons.forEach(s => {
                if (parseInt(s.dataset.rating) <= rating) {
                    s.classList.add('hover');
                } else {
                    s.classList.remove('hover');
                }
            });
        });
    });
    
    document.getElementById('starRating').addEventListener('mouseleave', function() {
        starButtons.forEach(s => s.classList.remove('hover'));
    });
});

async function submitReview() {
    if (!currentReviewProduct) {
        alert('Không tìm thấy thông tin sản phẩm');
        return;
    }
    
    if (selectedRating === 0) {
        alert('Vui lòng chọn số sao đánh giá');
        return;
    }
    
    const comment = document.getElementById('reviewComment').value.trim();
    if (!comment) {
        alert('Vui lòng nhập nhận xét của bạn');
        return;
    }
    
    try {
        const userName = sessionStorage.getItem('userName') || sessionStorage.getItem('userEmail') || 'Khách hàng';
        const userId = sessionStorage.getItem('userId');
        
        const response = await fetch(`http://127.0.0.1:8000/api/products/${currentReviewProduct}/submit_review/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                rating: selectedRating,
                comment: comment,
                name: userName,
                user_id: userId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Cảm ơn bạn đã đánh giá sản phẩm!');
            closeReviewModal();
        } else {
            alert(data.message || 'Có lỗi xảy ra khi gửi đánh giá');
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Có lỗi xảy ra khi gửi đánh giá');
    }
}
