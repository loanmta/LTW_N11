// Product Detail page JavaScript
let currentProduct = null;
let selectedColor = null;
let selectedSize = null;

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        await loadProduct(productId);
    } else {
        alert('Không tìm thấy sản phẩm');
        window.location.href = 'products.html';
    }
});

async function loadProduct(productId) {
    try {
        currentProduct = await api.getProduct(productId);
        console.log('Loaded product:', currentProduct);
        displayProduct(currentProduct);
        
        // Load reviews
        await loadReviews(productId);
    } catch (error) {
        console.error('Error loading product:', error);
        alert('Không thể tải sản phẩm');
        window.location.href = 'products.html';
    }
}

function displayProduct(product) {
    // Update title
    document.title = `${product.name} - OLD SCHOOL`;
    
    // Update product name
    document.getElementById('productName').textContent = product.name;
    document.getElementById('productNameMobile').textContent = product.name;
    
    // Update main image
    const mainImage = document.getElementById('mainImage');
    mainImage.src = product.image_url || 'https://via.placeholder.com/600x700?text=' + encodeURIComponent(product.name);
    mainImage.alt = product.name;
    
    // Update thumbnails
    const thumbnailsContainer = document.getElementById('thumbnailImages');
    const images = [product.image_url, product.image_2_url, product.image_3_url].filter(img => img);
    
    if (images.length > 0) {
        thumbnailsContainer.innerHTML = images.map((img, index) => `
            <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeImage('${img}', this)">
                <img src="${img}" alt="Ảnh ${index + 1}">
            </div>
        `).join('');
    }
    
    // Update price
    document.getElementById('currentPrice').textContent = formatPrice(product.price) + 'đ';
    
    if (product.old_price && parseFloat(product.old_price) > 0) {
        const oldPriceEl = document.getElementById('oldPrice');
        oldPriceEl.textContent = formatPrice(product.old_price) + 'đ';
        oldPriceEl.style.display = 'inline';
        
        const discount = Math.round((1 - parseFloat(product.price) / parseFloat(product.old_price)) * 100);
        const discountBadge = document.getElementById('discountBadge');
        discountBadge.textContent = `-${discount}%`;
        discountBadge.style.display = 'inline-block';
    }
    
    // Update description
    document.getElementById('productDescription').textContent = product.description || 'Sản phẩm chất lượng cao từ OLD SCHOOL';
    
    // Setup color options
    if (product.color) {
        setupColorOptions(product.color);
    }
    
    // Setup size options
    if (product.size) {
        setupSizeOptions(product.size);
    }
    
    // Setup action buttons
    setupActionButtons();
}

function setupColorOptions(colorString) {
    const colors = colorString.split(',').map(c => c.trim());
    if (colors.length === 0) return;
    
    const colorGroup = document.getElementById('colorGroup');
    const colorOptions = document.getElementById('colorOptions');
    const selectedColorEl = document.getElementById('selectedColor');
    
    // Color mapping
    const colorMap = {
        'Đỏ': '#D32F2F',
        'Đen': '#000000',
        'Trắng': '#FFFFFF',
        'Xanh': '#1976D2',
        'Xanh Navy': '#0D47A1',
        'Xám': '#757575',
        'Nâu': '#795548',
        'Hồng': '#E91E63',
        'Vàng': '#FFC107',
        'Xanh Đậm': '#0D47A1',
        'Xám Nhạt': '#BDBDBD',
        'Trắng Xanh': '#E3F2FD'
    };
    
    colorOptions.innerHTML = colors.map((color, index) => {
        const bgColor = colorMap[color] || '#999999';
        const isLight = ['Trắng', 'Xám Nhạt', 'Trắng Xanh', 'Vàng'].includes(color);
        return `
            <button class="color-btn ${index === 0 ? 'active' : ''}" 
                    data-color="${color}" 
                    style="background-color: ${bgColor}; ${isLight ? 'border: 2px solid #ddd;' : ''}">
                <span class="color-check" style="color: ${isLight ? '#333' : 'white'};">✓</span>
            </button>
        `;
    }).join('');
    
    selectedColor = colors[0];
    selectedColorEl.textContent = selectedColor;
    colorGroup.style.display = 'block';
    
    // Add event listeners
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedColor = this.dataset.color;
            selectedColorEl.textContent = selectedColor;
        });
    });
}

function setupSizeOptions(sizeString) {
    const sizes = sizeString.split(',').map(s => s.trim());
    if (sizes.length === 0) return;
    
    const sizeGroup = document.getElementById('sizeGroup');
    const sizeOptions = document.getElementById('sizeOptions');
    
    sizeOptions.innerHTML = sizes.map((size, index) => `
        <button class="size-btn ${index === 0 ? 'active' : ''}" data-size="${size}">${size}</button>
    `).join('');
    
    selectedSize = sizes[0];
    sizeGroup.style.display = 'block';
    
    // Add event listeners
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedSize = this.dataset.size;
        });
    });
}

function setupActionButtons() {
    // Buy now button
    document.getElementById('btnBuy').addEventListener('click', function() {
        sessionStorage.setItem('quickBuyProduct', JSON.stringify({
            ...currentProduct,
            color: selectedColor,
            size: selectedSize,
            quantity: 1
        }));
        
        window.location.href = 'checkout.html?quick_buy=1';
    });
    
    // Add to cart button
    document.getElementById('btnAddCart').addEventListener('click', async function() {
        if (!currentProduct) return;
        
        // Validate color and size selection
        if (currentProduct.color && !selectedColor) {
            alert('Vui lòng chọn màu sắc');
            return;
        }
        
        if (currentProduct.size && !selectedSize) {
            alert('Vui lòng chọn kích cỡ');
            return;
        }
        
        // Check stock availability
        if (currentProduct.stock_quantity <= 0) {
            alert('Sản phẩm đã hết hàng');
            return;
        }
        
        try {
            const data = await api.addToCart(
                currentProduct.product_id, 
                1,
                selectedColor,
                selectedSize
            );
            if (data.success) {
                updateCartBadge(data.cart_count);
                showAddToCartPopup();
            } else if (data.error) {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            if (error.message && error.message.includes('stock')) {
                alert('Số lượng sản phẩm trong kho không đủ');
            } else {
                showAddToCartPopup(); // Show anyway for demo
            }
        }
    });
}

function changeImage(imageSrc, thumbnail) {
    document.getElementById('mainImage').src = imageSrc;
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    thumbnail.classList.add('active');
}

function updateCartBadge(count) {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = count;
    }
}

function showAddToCartPopup() {
    const popup = document.getElementById('addToCartPopup');
    popup.classList.add('show');
    
    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

function formatPrice(price) {
    return parseFloat(price).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

async function loadReviews(productId) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/products/${productId}/reviews/`);
        const data = await response.json();
        
        if (data.reviews && data.reviews.length > 0) {
            displayReviews(data.reviews, data.average_rating, data.total_reviews);
        } else {
            document.getElementById('reviewsList').innerHTML = '<p class="no-reviews">Chưa có đánh giá nào cho sản phẩm này</p>';
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        document.getElementById('reviewsList').innerHTML = '<p class="no-reviews">Không thể tải đánh giá</p>';
    }
}

function displayReviews(reviews, avgRating, totalReviews) {
    // Update rating summary
    document.getElementById('avgRating').textContent = avgRating.toFixed(1);
    document.getElementById('reviewCount').textContent = `(${totalReviews} đánh giá)`;
    
    // Update stars
    const starsContainer = document.getElementById('avgStars');
    starsContainer.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = i <= Math.round(avgRating) ? 'star filled' : 'star';
        star.textContent = '★';
        starsContainer.appendChild(star);
    }
    
    // Display reviews
    const reviewsList = document.getElementById('reviewsList');
    reviewsList.innerHTML = reviews.map(review => `
        <div class="review-item">
            <div class="review-avatar">
                <img src="${review.avatar_url || '/user/assets/images/avatar.svg'}" alt="${review.name}">
            </div>
            <div class="review-content">
                <div class="review-header">
                    <div>
                        <h4 class="reviewer-name">${review.name}</h4>
                        <div class="stars">
                            ${generateStars(review.rating)}
                        </div>
                    </div>
                    <span class="review-date">${formatTimeAgo(review.created_at)}</span>
                </div>
                <p class="review-text">${review.comment || ''}</p>
            </div>
        </div>
    `).join('');
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= rating ? 'filled' : ''}">★</span>`;
    }
    return stars;
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return date.toLocaleDateString('vi-VN');
}
