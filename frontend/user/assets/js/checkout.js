// Checkout page JavaScript
let cartData = null;
let customerInfo = {
    full_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: ''
};

document.addEventListener('DOMContentLoaded', async function() {
    await loadCartForCheckout();
    await loadCustomerInfo();
    setupEventListeners();
});

async function loadCartForCheckout() {
    try {
        // Check if this is a quick buy
        const urlParams = new URLSearchParams(window.location.search);
        const isQuickBuy = urlParams.get('quick_buy') === '1';
        
        if (isQuickBuy) {
            // Load product from session storage for quick buy
            const quickBuyProduct = sessionStorage.getItem('quickBuyProduct');
            if (quickBuyProduct) {
                const product = JSON.parse(quickBuyProduct);
                
                // Create cart data structure for quick buy
                cartData = {
                    items: [{
                        product: product,
                        quantity: product.quantity || 1
                    }],
                    subtotal: parseFloat(product.price) * (product.quantity || 1),
                    discount: 0,
                    shipping_fee: 0,
                    total: parseFloat(product.price) * (product.quantity || 1),
                    count: 1
                };
                
                console.log('Quick buy cart data:', cartData);
                displayCheckoutItems(cartData);
                updateOrderSummary(cartData);
                
                // Clear quick buy data
                sessionStorage.removeItem('quickBuyProduct');
                return;
            }
        }
        
        // Normal checkout - load cart from API
        cartData = await api.getCart();
        console.log('Cart data for checkout:', cartData);
        displayCheckoutItems(cartData);
        updateOrderSummary(cartData);
    } catch (error) {
        console.error('Error loading cart:', error);
        alert('Không thể tải giỏ hàng');
        window.location.href = 'cart.html';
    }
}

async function loadCustomerInfo() {
    try {
        // Check if user is logged in
        const authResponse = await fetch('/api/auth/check/', {
            credentials: 'include'
        });
        const authData = await authResponse.json();
        
        if (authData.authenticated && authData.user) {
            // User is logged in, load profile from API
            const profileResponse = await fetch('/api/auth/profile/', {
                credentials: 'include'
            });
            const profileData = await profileResponse.json();
            
            if (profileData.success && profileData.user) {
                customerInfo = {
                    full_name: profileData.user.full_name || '',
                    phone: profileData.user.phone || '',
                    email: profileData.user.email || '',
                    address: profileData.user.address || '',
                    city: profileData.user.city || '',
                    district: profileData.user.district || ''
                };
                
                displayCustomerInfo(customerInfo);
                return;
            }
        }
        
        // User not logged in, try to get from session storage
        const savedInfo = sessionStorage.getItem('customerInfo');
        if (savedInfo) {
            customerInfo = JSON.parse(savedInfo);
            displayCustomerInfo(customerInfo);
        }
    } catch (error) {
        console.error('Error loading customer info:', error);
        // Fallback to session storage
        const savedInfo = sessionStorage.getItem('customerInfo');
        if (savedInfo) {
            customerInfo = JSON.parse(savedInfo);
            displayCustomerInfo(customerInfo);
        }
    }
}

function displayCheckoutItems(data) {
    if (!data.items || data.items.length === 0) {
        alert('Giỏ hàng trống');
        window.location.href = 'cart.html';
        return;
    }
    
    // Filter only selected items
    const selectedItems = data.items.filter(item => item.selected !== false);
    
    if (selectedItems.length === 0) {
        alert('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
        window.location.href = 'cart.html';
        return;
    }
    
    const container = document.getElementById('checkoutItems');
    container.innerHTML = selectedItems.map(item => `
        <div class="checkout-item">
            <div class="checkout-item-image">
                <img src="${item.product.image_url || 'https://via.placeholder.com/80x100'}" 
                     alt="${item.product.name}">
            </div>
            <div class="checkout-item-info">
                <h3 class="checkout-item-name">${item.product.name}</h3>
                <div class="checkout-item-options">
                    <span class="option-text">Màu: ${item.color || item.product.color || 'N/A'}</span>
                    <span class="option-text">Size: ${item.size || item.product.size || 'N/A'}</span>
                    <span class="option-text">SL: ${item.quantity}</span>
                </div>
            </div>
            <div class="checkout-item-price">
                ${formatPrice(parseFloat(item.product.price) * item.quantity)}đ
            </div>
        </div>
    `).join('');
}

function displayCustomerInfo(info) {
    document.getElementById('displayName').textContent = info.full_name || 'Chưa có thông tin';
    document.getElementById('displayPhone').textContent = info.phone || 'Chưa có thông tin';
    document.getElementById('displayAddress').textContent = info.address || 'Chưa có thông tin';
    
    document.getElementById('inputName').value = info.full_name || '';
    document.getElementById('inputPhone').value = info.phone || '';
    document.getElementById('inputAddress').value = info.address || '';
}

function updateOrderSummary(data) {
    const subtotal = data.subtotal || 0;
    const discount = data.discount || 0;
    const shipping = data.shipping_fee || 0;
    const total = data.total || 0;
    
    document.querySelector('.price-row:nth-child(1) .price-value').textContent = formatPrice(subtotal) + 'đ';
    document.querySelector('.price-row:nth-child(2) .price-value').textContent = shipping > 0 ? formatPrice(shipping) + 'đ' : 'Miễn phí';
    document.querySelector('.discount-row .price-value').textContent = discount > 0 ? '- ' + formatPrice(discount) + 'đ' : '0đ';
    document.querySelector('.total-value').textContent = formatPrice(total) + 'đ';
}

function setupEventListeners() {
    // Place order button
    const placeOrderBtn = document.querySelector('.btn-primary');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', handlePlaceOrder);
    }
}

function toggleEditMode() {
    document.getElementById('displayMode').style.display = 'none';
    document.getElementById('editMode').style.display = 'block';
}

function cancelEdit() {
    document.getElementById('displayMode').style.display = 'block';
    document.getElementById('editMode').style.display = 'none';
}

async function saveProfile() {
    const name = document.getElementById('inputName').value.trim();
    const phone = document.getElementById('inputPhone').value.trim();
    const address = document.getElementById('inputAddress').value.trim();
    
    if (!name || !phone || !address) {
        alert('Vui lòng điền đầy đủ thông tin');
        return;
    }
    
    customerInfo = {
        full_name: name,
        phone: phone,
        address: address
    };
    
    try {
        // Check if user is logged in
        const authResponse = await fetch('/api/auth/check/', {
            credentials: 'include'
        });
        const authData = await authResponse.json();
        
        if (authData.authenticated) {
            // User is logged in, update profile in database including address
            const updateResponse = await fetch('/api/auth/profile/', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    full_name: name,
                    phone: phone,
                    address: address,
                    city: customerInfo.city || '',
                    district: customerInfo.district || ''
                })
            });
            
            const updateData = await updateResponse.json();
            if (updateData.success) {
                showToast('Đã cập nhật thông tin vào tài khoản');
            }
        }
    } catch (error) {
        console.error('Error updating profile:', error);
    }
    
    // Always save to session storage
    sessionStorage.setItem('customerInfo', JSON.stringify(customerInfo));
    
    // Update display
    displayCustomerInfo(customerInfo);
    cancelEdit();
    
    showToast('Đã lưu thông tin thành công');
}

async function handlePlaceOrder() {
    // Validate customer info
    if (!customerInfo.full_name || !customerInfo.phone || !customerInfo.address) {
        alert('Vui lòng điền đầy đủ thông tin người nhận');
        toggleEditMode();
        return;
    }
    
    // Get payment method
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'cod';
    
    // Confirm order
    if (!confirm('Xác nhận đặt hàng?')) {
        return;
    }
    
    try {
        // Show loading
        const btn = document.querySelector('.btn-primary');
        btn.disabled = true;
        btn.textContent = 'Đang xử lý...';
        
        // Check if this is a quick buy
        const urlParams = new URLSearchParams(window.location.search);
        const isQuickBuy = urlParams.get('quick_buy') === '1';
        
        // Prepare order data
        const orderData = {
            ...customerInfo,
            payment_method: paymentMethod,
            notes: document.querySelector('.form-input[placeholder*="Ghi chú"]')?.value || ''
        };
        
        // Store order data and cart data for later
        window.pendingOrderData = orderData;
        window.isQuickBuy = isQuickBuy;
        
        if (paymentMethod === 'qr') {
            // For QR payment, show QR popup first, create order after confirmation
            showQRPopup({
                total: cartData.total,
                order_number: 'PENDING' // Temporary order number
            });
            
            // Re-enable button
            btn.disabled = false;
            btn.textContent = 'ĐẶT HÀNG';
        } else {
            // For COD, create order immediately
            let response;
            
            if (isQuickBuy && cartData.items && cartData.items.length > 0) {
                // Quick buy - add to cart first, then create order
                const product = cartData.items[0].product;
                const quantity = cartData.items[0].quantity;
                
                // Add to cart
                await api.addToCart(product.product_id, quantity);
                
                response = await api.createOrder(orderData);
            } else {
                // Normal checkout
                response = await api.createOrder(orderData);
            }
            
            if (response.success) {
                // Clear customer info from session
                sessionStorage.removeItem('customerInfo');
                showSuccessPopup(response);
            } else {
                alert(response.message || 'Đặt hàng thất bại');
                btn.disabled = false;
                btn.textContent = 'ĐẶT HÀNG';
            }
        }
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Có lỗi xảy ra khi đặt hàng');
        const btn = document.querySelector('.btn-primary');
        btn.disabled = false;
        btn.textContent = 'ĐẶT HÀNG';
    }
}

function showQRPopup(orderData) {
    const popup = document.getElementById('qrPopup');
    
    // Update QR code with order info
    const qrImage = popup.querySelector('.qr-image');
    const qrData = orderData.order_number === 'PENDING' 
        ? `PAYMENT_${cartData.total}` 
        : `ORDER_${orderData.order_number}_${orderData.total}`;
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
    
    // Update order details
    const detailValues = popup.querySelectorAll('.detail-value');
    detailValues[0].textContent = formatPrice(orderData.total) + 'đ'; // Amount
    
    // Update order number with copy button
    const orderNumberElement = detailValues[1];
    if (orderData.order_number === 'PENDING') {
        orderNumberElement.textContent = 'Đang chờ xác nhận...';
    } else {
        orderNumberElement.innerHTML = `${orderData.order_number} 
            <button class="copy-btn" onclick="copyToClipboard('${orderData.order_number}')">
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <rect x="6" y="6" width="10" height="10" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M4 14V4h10" stroke="currentColor" stroke-width="1.5"/>
                </svg>
            </button>`;
    }
    
    popup.style.display = 'flex';
    
    // Store order data for later
    window.currentOrder = orderData;
}

function closeQRPopup() {
    document.getElementById('qrPopup').style.display = 'none';
    window.location.href = '/';
}

async function completePayment() {
    try {
        // Show loading
        const btn = document.querySelector('#qrPopup .btn-primary');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Đang xử lý...';
        }
        
        // Create order now
        let response;
        
        if (window.isQuickBuy && cartData.items && cartData.items.length > 0) {
            // Quick buy - add to cart first, then create order
            const product = cartData.items[0].product;
            const quantity = cartData.items[0].quantity;
            
            // Add to cart
            await api.addToCart(product.product_id, quantity);
            
            response = await api.createOrder(window.pendingOrderData);
        } else {
            // Normal checkout
            response = await api.createOrder(window.pendingOrderData);
        }
        
        if (response.success) {
            // Clear customer info from session
            sessionStorage.removeItem('customerInfo');
            
            // Update order with paid status
            await fetch(`${window.API_BASE_URL || 'http://127.0.0.1:8000/api'}/orders/${response.order_id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    payment_status: 'paid'
                })
            });
            
            document.getElementById('qrPopup').style.display = 'none';
            showSuccessPopup(response);
        } else {
            alert(response.message || 'Đặt hàng thất bại');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Đã hoàn tất thanh toán';
            }
        }
    } catch (error) {
        console.error('Error creating order:', error);
        alert('Có lỗi xảy ra khi tạo đơn hàng');
        const btn = document.querySelector('#qrPopup .btn-primary');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Đã hoàn tất thanh toán';
        }
    }
}

function showSuccessPopup(orderData) {
    const popup = document.getElementById('successPopup');
    
    // Update order info
    const infoValues = popup.querySelectorAll('.info-value');
    infoValues[0].textContent = orderData.order_number;
    infoValues[1].textContent = formatPrice(orderData.total) + 'đ';
    
    popup.style.display = 'flex';
    
    // Store order data
    window.currentOrder = orderData;
}

function closeSuccessPopup() {
    document.getElementById('successPopup').style.display = 'none';
    window.location.href = '/';
}

function viewOrder() {
    if (window.currentOrder) {
        window.location.href = `order_detail.html?id=${window.currentOrder.order_id}`;
    } else {
        window.location.href = 'orders.html';
    }
}

function backToHome() {
    window.location.href = '/';
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Đã sao chép: ' + text);
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

function formatPrice(price) {
    return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
