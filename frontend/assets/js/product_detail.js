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
        
        try {
            const data = await api.addToCart(currentProduct.product_id, 1);
            if (data.success) {
                updateCartBadge(data.cart_count);
                showAddToCartPopup();
            }
        } catch (error) {
            console.error('Error:', error);
            showAddToCartPopup(); // Show anyway for demo
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
