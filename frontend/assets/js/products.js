// Products page JavaScript
let allProducts = [];
let currentPage = 1;
let totalPages = 1;
const productsPerPage = 12;

// Load products on page load
document.addEventListener('DOMContentLoaded', async function() {
    await loadCategories();
    await loadProducts();
    setupSearchAndFilters();
});

async function loadCategories() {
    try {
        const data = await api.getCategories();
        const categorySelect = document.querySelector('select[name="category"]');
        if (categorySelect && data) {
            // Handle paginated response
            const categories = data.results || data;
            const options = categories.map(cat => 
                `<option value="${cat.category_id}">${cat.name}</option>`
            ).join('');
            categorySelect.innerHTML = '<option value="">TẤT CẢ DANH MỤC</option>' + options;
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadProducts(page = 1) {
    try {
        // Get filter values
        const searchQuery = document.querySelector('.filter-search')?.value || '';
        const category = document.querySelector('select[name="category"]')?.value || '';
        const size = document.querySelector('select[name="size"]')?.value || '';
        const color = document.querySelector('select[name="color"]')?.value || '';
        const price = document.querySelector('select[name="price"]')?.value || '';
        
        console.log('Filter values:', { searchQuery, category, size, color, price });
        
        // Build query params
        const params = {};
        if (searchQuery) params.search = searchQuery;
        if (category) params.category = category;
        params.page = page;
        params.page_size = productsPerPage;
        
        console.log('API params:', params);
        
        const data = await api.getProducts(params);
        console.log('API response:', data);
        
        // Handle paginated response
        if (data.results) {
            allProducts = data.results;
            totalPages = Math.ceil(data.count / productsPerPage);
            currentPage = page;
        } else {
            allProducts = data;
            totalPages = 1;
            currentPage = 1;
        }
        
        console.log('All products:', allProducts.length);
        
        // Apply client-side filters (size, color, price)
        let filteredProducts = allProducts;
        
        if (size) {
            filteredProducts = filteredProducts.filter(p => 
                p.size && p.size.includes(size)
            );
            console.log('After size filter:', filteredProducts.length);
        }
        
        if (color) {
            filteredProducts = filteredProducts.filter(p => 
                p.color && p.color.toLowerCase().includes(color.toLowerCase())
            );
            console.log('After color filter:', filteredProducts.length);
        }
        
        if (price) {
            filteredProducts = filterByPrice(filteredProducts, price);
            console.log('After price filter:', filteredProducts.length);
        }
        
        console.log('Final filtered products:', filteredProducts.length);
        
        displayProducts(filteredProducts);
        updatePagination();
    } catch (error) {
        console.error('Error loading products:', error);
        showEmptyState('Không thể tải sản phẩm. Vui lòng thử lại sau.');
    }
}

function filterByPrice(products, priceRange) {
    if (!priceRange) return products;
    
    if (priceRange === '0-500') {
        return products.filter(p => parseFloat(p.price) < 500000);
    } else if (priceRange === '500-1000') {
        return products.filter(p => parseFloat(p.price) >= 500000 && parseFloat(p.price) < 1000000);
    } else if (priceRange === '1000-2000') {
        return products.filter(p => parseFloat(p.price) >= 1000000 && parseFloat(p.price) < 2000000);
    } else if (priceRange === '2000+') {
        return products.filter(p => parseFloat(p.price) >= 2000000);
    }
    
    return products;
}

function displayProducts(products) {
    const grid = document.querySelector('.products-grid');
    
    if (!grid) {
        console.error('Products grid element not found');
        return;
    }
    
    if (!products || products.length === 0) {
        showEmptyState('Không tìm thấy sản phẩm phù hợp với bộ lọc');
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="product-card">
            ${product.is_new ? '<span class="badge-new">NEW ARRIVAL</span>' : ''}
            ${product.is_featured ? '<span class="badge-featured">HOT</span>' : ''}
            
            <a href="product_detail.html?id=${product.product_id}" class="product-link">
                <div class="product-image">
                    <img src="${product.image_url || 'https://via.placeholder.com/400x500?text=' + encodeURIComponent(product.name)}" 
                         alt="${product.name}"
                         onerror="this.src='https://via.placeholder.com/400x500?text=No+Image'">
                    <button class="quick-add-btn" onclick="event.preventDefault(); addToCart(${product.product_id})">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M6 10h8M10 6v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
                
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <div class="product-price">
                        <div class="price-group">
                            <span class="price">${formatPrice(product.price)}đ</span>
                            ${product.old_price && parseFloat(product.old_price) > 0 ? `<span class="old-price">${formatPrice(product.old_price)}đ</span>` : ''}
                        </div>
                        <button class="cart-icon-btn" onclick="event.preventDefault(); addToCart(${product.product_id})">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M3 3h2l1 9h10l2-7H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                <circle cx="8" cy="17" r="1" fill="currentColor"/>
                                <circle cx="15" cy="17" r="1" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </a>
        </div>
    `).join('');
    
    console.log('Displayed', products.length, 'products');
}

function updatePagination() {
    const container = document.querySelector('.container');
    let paginationHTML = '';
    
    if (totalPages > 1) {
        paginationHTML = `
            <div class="pagination">
                <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="loadProducts(${currentPage - 1})">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M12 5l-5 5 5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                    Trước
                </button>
                
                <div class="pagination-numbers">
                    ${generatePageNumbers()}
                </div>
                
                <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="loadProducts(${currentPage + 1})">
                    Sau
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M8 5l5 5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        `;
    }
    
    // Remove old pagination
    const oldPagination = document.querySelector('.pagination');
    if (oldPagination) oldPagination.remove();
    
    // Add new pagination
    if (paginationHTML) {
        const grid = document.querySelector('.products-grid');
        grid.insertAdjacentHTML('afterend', paginationHTML);
    }
}

function generatePageNumbers() {
    let html = '';
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    if (startPage > 1) {
        html += `<button class="page-number" onclick="loadProducts(1)">1</button>`;
        if (startPage > 2) html += `<span class="page-dots">...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-number ${i === currentPage ? 'active' : ''}" onclick="loadProducts(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="page-dots">...</span>`;
        html += `<button class="page-number" onclick="loadProducts(${totalPages})">${totalPages}</button>`;
    }
    
    return html;
}

function showEmptyState(message) {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;
    
    grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <div class="empty-state-content">
                <div class="empty-state-image">
                    <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
                        <circle cx="80" cy="80" r="35" stroke="#8A8A8A" stroke-width="6" fill="none"/>
                        <line x1="105" y1="105" x2="130" y2="130" stroke="#8A8A8A" stroke-width="6" stroke-linecap="round"/>
                    </svg>
                </div>
                <h2 class="empty-state-title">${message}</h2>
                <button class="back-btn" onclick="clearFilters()">
                    XÓA BỘ LỌC
                </button>
            </div>
        </div>
    `;
}

function clearFilters() {
    document.querySelector('.filter-search').value = '';
    document.querySelectorAll('.filter-select').forEach(select => select.value = '');
    loadProducts(1);
}

async function addToCart(productId) {
    try {
        const data = await api.addToCart(productId, 1);
        if (data.success) {
            updateCartBadge(data.cart_count);
            showAddToCartPopup();
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showAddToCartPopup(); // Show anyway for demo
    }
}

function updateCartBadge(count) {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = count;
    }
}

function showAddToCartPopup() {
    const popup = document.getElementById('addToCartPopup');
    if (!popup) return;
    
    popup.classList.add('show');
    
    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function setupSearchAndFilters() {
    const searchInput = document.querySelector('.filter-search');
    const filterSelects = document.querySelectorAll('.filter-select');
    const filterBtn = document.querySelector('.filter-btn');
    const filterForm = document.querySelector('.filter-content');
    
    let searchTimeout;
    
    // Search with debounce
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadProducts(1);
            }, 500);
        });
    }
    
    // Filter on change
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            loadProducts(1);
        });
    });
    
    // Prevent form submission
    if (filterForm) {
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            loadProducts(1);
        });
    }
}
