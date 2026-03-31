// Handle order placement
document.addEventListener('DOMContentLoaded', function() {
    const orderBtn = document.querySelector('.btn-primary');
    if (orderBtn) {
        orderBtn.addEventListener('click', handleOrderPlacement);
    }
});

function handleOrderPlacement(e) {
    e.preventDefault();
    
    // Validate form - check if in edit mode or display mode
    const editMode = document.getElementById('editMode');
    const isEditing = editMode.style.display !== 'none';
    
    if (isEditing) {
        alert('Vui lòng lưu thông tin người nhận trước khi đặt hàng');
        return;
    }
    
    // Check if profile info exists
    const name = document.getElementById('displayName').textContent.trim();
    const phone = document.getElementById('displayPhone').textContent.trim();
    const address = document.getElementById('displayAddress').textContent.trim();
    
    if (!name || !phone || !address) {
        alert('Vui lòng điền đầy đủ thông tin người nhận');
        toggleEditMode();
        return;
    }
    
    // Check payment method
    const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
    
    if (paymentMethod === 'cod') {
        // Show success popup directly for COD
        showSuccessPopup();
    } else if (paymentMethod === 'qr') {
        // Show QR payment popup for QR payment
        showQRPopup();
    }
}

// QR Popup Functions
function showQRPopup() {
    const popup = document.getElementById('qrPopup');
    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Simulate payment processing
    setTimeout(() => {
        const statusText = document.querySelector('.status-text');
        statusText.textContent = 'Đang xác nhận thanh toán...';
    }, 2000);
}

function closeQRPopup() {
    const popup = document.getElementById('qrPopup');
    popup.style.display = 'none';
    document.body.style.overflow = 'auto';
    window.location.href = '/';
}

function completePayment() {
    closeQRPopup();
    setTimeout(() => {
        showSuccessPopup();
    }, 300);
}

// Success Popup Functions
function showSuccessPopup() {
    const popup = document.getElementById('successPopup');
    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeSuccessPopup() {
    const popup = document.getElementById('successPopup');
    popup.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function viewOrder() {
    closeSuccessPopup();
    // Redirect to order detail page
    window.location.href = '/orders/CAT003/';
}

function backToHome() {
    closeSuccessPopup();
    window.location.href = '/';
}

// Copy to clipboard function
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Đã sao chép: ' + text);
    });
}

// Close popup when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('popup-overlay')) {
        if (e.target.id === 'successPopup') {
            closeSuccessPopup();
        }
    }
});
