// Cart page JavaScript
let cartData = null;

document.addEventListener('DOMContentLoaded', async function() {
    await loadCart();
    setupEventListeners();
});

async function loadCart() {
    try {
        cartData = await api.getCart();
        console.log('Cart data:', cartData);
        displayCart(cartData);
    } catch (error) {
        console.error('Error loading cart:', error);
        showEmptyCart();
    }
}

function displayCart(data) {
    if (!data.items || data.items.length === 0) {
        showEmptyCart();
        return;
    }
    
    // Update page subtitle
    const subtitle = document.querySelector('.page-subtitle');
    if (subtitle) {
        subtitle.textContent = `Bạn đang có ${data.count} sản phẩm trong giỏ hàng`;
    }
    
    // Display cart items
    const cartItemsContainer = document.querySelector('.cart-items');
    cartItemsContainer.innerHTML = data.items.map(item => `
        <div class="cart-item" data-item-id="${item.cart_item_id}">
            <div class="item-checkbox">
                <input type="checkbox" class="item-select" ${item.selected ? 'checked' : ''}>
            </div>
            <div class="item-image">
                <img src="${item.product.image_url || 'https://via.placeholder.com/100x120'}" 
                     alt="${item.product.name}">
            </div>
            <div class="item-details">
                <h3 class="item-name">${item.product.name}</h3>
                <p class="item-color">Màu: ${item.product.color || 'Không xác định'}</p>
                <p class="item-size">Size: ${item.product.size || 'Không xác định'}</p>
            </div>
            <div class="item-quantity">
                <button class="qty-btn minus" onclick="updateQuantity(${item.cart_item_id}, ${item.quantity - 1})">-</button>
                <input type="number" class="qty-input" value="${item.quantity}" min="1" 
                       onchange="updateQuantity(${item.cart_item_id}, this.value)">
                <button class="qty-btn plus" onclick="updateQuantity(${item.cart_item_id}, ${item.quantity + 1})">+</button>
            </div>
            <div class="item-price">
                ${formatPrice(parseFloat(item.product.price) * item.quantity)}đ
            </div>
            <button class="item-delete" onclick="removeItem(${item.cart_item_id})">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M6 8v8M10 8v8M14 8v8M3 5h14M8 5V3h4v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
            </button>
        </div>
    `).join('');
    
    // Update order summary
    updateOrderSummary(data);
}

function updateOrderSummary(data) {
    // Update selected items list
    const selectedItemsContainer = document.querySelector('.summary-section');
    const selectedItems = data.items.filter(item => item.selected);
    
    if (selectedItems.length > 0) {
        selectedItemsContainer.innerHTML = `
            <h3 class="section-title">SẢN PHẨM ĐÃ CHỌN</h3>
            ${selectedItems.map(item => `
                <div class="selected-item">
                    <span class="selected-item-name">${item.product.name} (x${item.quantity})</span>
                    <span class="selected-item-price">${formatPrice(parseFloat(item.product.price) * item.quantity)}đ</span>
                </div>
            `).join('')}
        `;
    } else {
        selectedItemsContainer.innerHTML = '<p class="empty-message">Chưa có sản phẩm nào được chọn</p>';
    }
    
    // Update calculations
    document.querySelector('.calc-row .calc-value').textContent = formatPrice(data.subtotal) + 'đ';
    document.querySelector('.calc-row.discount .calc-value').textContent = '-' + formatPrice(data.discount) + 'đ';
    document.querySelector('.total-value').textContent = formatPrice(data.total) + 'đ';
}

function showEmptyCart() {
    const cartItemsSection = document.querySelector('.cart-items-section');
    cartItemsSection.innerHTML = `
        <div class="empty-cart">
            <div class="empty-cart-icon">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                    <circle cx="60" cy="60" r="50" stroke="#E0E0E0" stroke-width="4"/>
                    <path d="M40 50h40M50 50l5 30h10l5-30" stroke="#E0E0E0" stroke-width="4" stroke-linecap="round"/>
                    <circle cx="55" cy="85" r="3" fill="#E0E0E0"/>
                    <circle cx="65" cy="85" r="3" fill="#E0E0E0"/>
                </svg>
            </div>
            <h2 class="empty-cart-title">Giỏ hàng trống</h2>
            <p class="empty-cart-text">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
            <a href="products.html" class="btn-shopping">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M12 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Tiếp tục mua sắm
            </a>
        </div>
    `;
    
    // Hide order summary
    const orderSummary = document.querySelector('.order-summary');
    if (orderSummary) {
        orderSummary.style.display = 'none';
    }
}

async function updateQuantity(itemId, quantity) {
    quantity = parseInt(quantity);
    
    if (quantity < 1) {
        if (confirm('Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?')) {
            await removeItem(itemId);
        }
        return;
    }
    
    try {
        await api.updateCartItem(itemId, quantity);
        await loadCart();
        updateCartBadge();
    } catch (error) {
        console.error('Error updating quantity:', error);
        alert('Không thể cập nhật số lượng');
    }
}

async function removeItem(itemId) {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
        return;
    }
    
    try {
        await api.removeCartItem(itemId);
        await loadCart();
        updateCartBadge();
        showToast('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (error) {
        console.error('Error removing item:', error);
        alert('Không thể xóa sản phẩm');
    }
}

async function clearCart() {
    if (!confirm('Bạn có chắc muốn xóa tất cả sản phẩm?')) {
        return;
    }
    
    try {
        await api.clearCart();
        await loadCart();
        updateCartBadge();
        showToast('Đã xóa tất cả sản phẩm');
    } catch (error) {
        console.error('Error clearing cart:', error);
        alert('Không thể xóa giỏ hàng');
    }
}

function setupEventListeners() {
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.item-select');
            checkboxes.forEach(cb => cb.checked = this.checked);
            // TODO: Update selected status in backend
        });
    }
    
    // Continue shopping button
    const continueBtn = document.querySelector('.continue-shopping');
    if (continueBtn) {
        continueBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'products.html';
        });
    }
    
    // Checkout button
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (!cartData || !cartData.items || cartData.items.length === 0) {
                alert('Giỏ hàng trống');
                return;
            }
            window.location.href = 'checkout.html';
        });
    }
}

async function updateCartBadge() {
    try {
        const data = await api.getCartCount();
        const badge = document.getElementById('cartBadge');
        if (badge) {
            badge.textContent = data.cart_count;
        }
    } catch (error) {
        console.error('Error updating cart badge:', error);
    }
}

function showToast(message) {
    // Create toast element
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
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatPrice(price) {
    return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
