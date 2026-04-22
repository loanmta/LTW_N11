// Products Management JavaScript
let currentPage = 1;
let totalPages = 1;
let currentView = 'list';
let allProducts = [];

document.addEventListener('DOMContentLoaded', async function() {
    await loadProducts();
    await loadCategories();
    setupEventListeners();
});

// Load Products
async function loadProducts(page = 1) {
    try {
        console.log('Loading products from:', `${API_BASE_URL}/products/`);
        const response = await fetch(`${API_BASE_URL}/products/?page=${page}&page_size=12`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Products data:', data);
        
        allProducts = data.results || data;
        const totalCount = data.count || allProducts.length;
        currentPage = page;
        totalPages = Math.ceil(totalCount / 12);
        
        console.log('Total products:', totalCount);
        
        displayProducts(allProducts);
        updateStats(allProducts, totalCount);
        updatePagination();
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsList').innerHTML = `
            <div class="loading" style="color: red;">
                <p>Không thể tải sản phẩm</p>
                <p style="font-size: 12px;">Lỗi: ${error.message}</p>
                <p style="font-size: 12px;">Kiểm tra console để biết thêm chi tiết</p>
            </div>
        `;
    }
}

// Display Products
function displayProducts(products) {
    const container = document.getElementById('productsList');
    
    if (!products || products.length === 0) {
        container.innerHTML = '<p class="loading">Không có sản phẩm</p>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-item">
            <img src="${product.image_url || '/assets/images/placeholder.svg'}" 
                 alt="${product.name}" 
                 class="product-image"
                 onerror="this.src='/assets/images/placeholder.svg'">
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-meta">
                    <span class="product-status">
                        <span class="status-dot ${getStockStatus(product.stock_quantity)}"></span>
                        ${product.stock_quantity > 0 ? 'Còn hàng' : 'Hết hàng'}
                    </span>
                    <span>Giá: ${formatPrice(product.price)}₫</span>
                    <span>Kho: ${product.stock_quantity}</span>
                </div>
            </div>
            <div class="product-actions">
                <button class="btn-action" onclick="editProduct(${product.product_id})" title="Chỉnh sửa">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M14 2l4 4-10 10H4v-4L14 2z" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
                <button class="btn-action delete" onclick="deleteProduct(${product.product_id})" title="Xóa">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M3 5h14M8 5V3h4v2M6 5v12h8V5" stroke="currentColor" stroke-width="2"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// Get Stock Status
function getStockStatus(quantity) {
    if (quantity === 0) return 'danger';
    if (quantity < 10) return 'warning';
    return '';
}

// Update Stats
async function updateStats(products, totalCount) {
    const total = totalCount || products.length;
    const lowStock = products.filter(p => p.stock_quantity < 10 && p.stock_quantity > 0).length;
    
    // Get total categories from API
    let totalCategories = 0;
    try {
        const response = await fetch(`${API_BASE_URL}/categories/`, {
            credentials: 'include'
        });
        const data = await response.json();
        const categories = data.results || data;
        totalCategories = categories.length;
    } catch (error) {
        console.error('Error loading categories count:', error);
        // Fallback to counting from products
        totalCategories = new Set(products.map(p => p.category)).size;
    }
    
    console.log('Stats - Total:', total, 'LowStock:', lowStock, 'Categories:', totalCategories);
    
    document.getElementById('totalProducts').textContent = total.toLocaleString();
    document.getElementById('lowStock').textContent = lowStock;
    document.getElementById('totalCategories').textContent = totalCategories;
}

// Load Categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/`, {
            credentials: 'include'
        });
        const data = await response.json();
        const categories = data.results || data;
        
        // Only update if select element exists (in product-form page)
        const select = document.querySelector('select[name="category"]');
        if (select) {
            select.innerHTML = '<option value="">Chọn danh mục</option>' + 
                categories.map(cat => `<option value="${cat.category_id}">${cat.name}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        // Don't show error if element doesn't exist (normal for products list page)
    }
}

// Search Products
async function searchProducts() {
    const searchTerm = document.getElementById('searchProducts').value.trim();
    
    if (!searchTerm) {
        await loadProducts(1);
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/products/?search=${encodeURIComponent(searchTerm)}`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const products = data.results || data;
        
        displayProducts(products);
        
        // Update stats with search results
        const totalCount = data.count || products.length;
        await updateStats(products, totalCount);
        
        // Hide pagination when searching
        document.getElementById('pagination').style.display = 'none';
        
        if (products.length === 0) {
            document.getElementById('productsList').innerHTML = '<p class="loading">Không tìm thấy sản phẩm nào</p>';
        }
    } catch (error) {
        console.error('Error searching products:', error);
        alert('Có lỗi xảy ra khi tìm kiếm');
    }
}

// Change View
function changeView(view) {
    currentView = view;
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.btn-view[data-view="${view}"]`).classList.add('active');
    
    // TODO: Implement grid view
    if (view === 'grid') {
        alert('Grid view sẽ được triển khai sau');
    }
}

// Open Add Product Modal
function openAddProductModal() {
    window.location.href = '/admin/pages/product-form.html';
}

// Edit Product
async function editProduct(productId) {
    window.location.href = `/admin/pages/product-form.html?id=${productId}`;
}

// Delete Product
let productToDelete = null;

async function deleteProduct(productId) {
    productToDelete = productId;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    productToDelete = null;
}

async function confirmDeleteProduct() {
    if (!productToDelete) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productToDelete}/`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            closeDeleteModal();
            await loadProducts();
        } else {
            alert('Không thể xóa sản phẩm');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Có lỗi xảy ra khi xóa sản phẩm');
    }
}

// Pagination
function setupEventListeners() {
    // Search on Enter
    const searchInput = document.getElementById('searchProducts');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchProducts();
        }
    });
    
    // Clear search and reload when input is empty
    searchInput.addEventListener('input', function(e) {
        if (e.target.value.trim() === '') {
            loadProducts(1);
            document.getElementById('pagination').style.display = 'flex';
        }
    });
}

// Pagination
function updatePagination() {
    const container = document.getElementById('pagination');
    if (!container) return;
    
    let html = '';
    
    // Previous button
    html += `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="loadProducts(${currentPage - 1})">‹</button>`;
    
    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    if (startPage > 1) {
        html += `<button class="pagination-btn" onclick="loadProducts(1)">1</button>`;
        if (startPage > 2) html += `<span class="pagination-dots">...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="loadProducts(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="pagination-dots">...</span>`;
        html += `<button class="pagination-btn" onclick="loadProducts(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    html += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="loadProducts(${currentPage + 1})">›</button>`;
    
    container.innerHTML = html;
}

function prevPage() {
    if (currentPage > 1) {
        loadProducts(currentPage - 1);
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        loadProducts(currentPage + 1);
    }
}

// Format Price
function formatPrice(price) {
    return Math.round(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
