// Home page JavaScript

document.addEventListener('DOMContentLoaded', async function() {
    await loadFeaturedProducts();
    await loadNewProducts();
    setupNewsletterForm();
});

// Load Featured Products
async function loadFeaturedProducts() {
    try {
        const response = await api.getProducts({ is_featured: true, page_size: 10 });
        console.log('Featured products:', response);
        displayProducts(response.results || response, 'featuredProducts');
    } catch (error) {
        console.error('Error loading featured products:', error);
        document.getElementById('featuredProducts').innerHTML = '<p class="loading">Không thể tải sản phẩm</p>';
    }
}

// Load New Products
async function loadNewProducts() {
    try {
        const response = await api.getProducts({ is_new: true, page_size: 10 });
        console.log('New products:', response);
        displayProducts(response.results || response, 'newProducts');
    } catch (error) {
        console.error('Error loading new products:', error);
        document.getElementById('newProducts').innerHTML = '<p class="loading">Không thể tải sản phẩm</p>';
    }
}

// Display Products
function displayProducts(products, containerId) {
    const container = document.getElementById(containerId);
    
    if (!products || products.length === 0) {
        container.innerHTML = '<p class="loading">Không có sản phẩm</p>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <a href="/product_detail.html?id=${product.product_id}" class="product-card">
            <div class="product-image-wrap">
                <img src="${product.image_url || 'https://via.placeholder.com/300x300'}" 
                     alt="${product.name}"
                     class="product-image"
                     loading="lazy">
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">
                    <span class="price-current">${formatPrice(product.price)}₫</span>
                    ${product.old_price ? `<span class="price-old">${formatPrice(product.old_price)}₫</span>` : ''}
                </div>
            </div>
        </a>
    `).join('');
}

// Format Price
function formatPrice(price) {
    return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Newsletter Form
function setupNewsletterForm() {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            alert('Cảm ơn bạn đã đăng ký! Email: ' + email);
            this.reset();
        });
    }
}
