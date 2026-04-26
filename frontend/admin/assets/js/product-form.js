// Product Form JavaScript
let selectedSizes = [];
let selectedColors = [];
let productId = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Get product ID from URL if editing
    const urlParams = new URLSearchParams(window.location.search);
    productId = urlParams.get('id');
    
    // Load categories first
    await loadCategories();
    
    // Then load product data if editing
    if (productId) {
        document.getElementById('breadcrumbTitle').textContent = 'Chỉnh sửa sản phẩm';
        await loadProductData(productId);
    }
    
    setupEventListeners();
});

// Load Product Data for Editing
async function loadProductData(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${id}/`, {
            credentials: 'include'
        });
        const product = await response.json();
        
        console.log('Loaded product data:', product);
        
        // Fill form
        document.querySelector('[name="name"]').value = product.name || '';
        
        // Set category - handle both object and ID
        const categoryId = product.category?.category_id || product.category_id || product.category;
        console.log('Setting category to:', categoryId);
        document.querySelector('[name="category"]').value = categoryId || '';
        
        document.querySelector('[name="price"]').value = Math.round(product.price) || '';
        document.querySelector('[name="old_price"]').value = product.old_price ? Math.round(product.old_price) : '';
        document.querySelector('[name="stock"]').value = product.stock_quantity || '';
        document.querySelector('[name="description"]').value = product.description || '';
        
        // Set sizes and colors if available
        if (product.size) {
            selectedSizes = product.size.split(',').map(s => s.trim());
            selectedSizes.forEach(size => {
                const btn = document.querySelector(`.size-btn[data-size="${size}"]`);
                if (btn) btn.classList.add('active');
            });
        }
        
        if (product.color) {
            selectedColors = product.color.split(',').map(c => c.trim());
            selectedColors.forEach(color => {
                const btn = document.querySelector(`.color-btn[data-color="${color}"]`);
                if (btn) btn.classList.add('active');
            });
        }
        
        updateSelectedVariants();
        
        // Load images
        if (product.image_url) {
            const mainImagePreview = document.getElementById('mainImagePreview');
            mainImagePreview.innerHTML = `<img src="${product.image_url}" alt="Preview">`;
            mainImagePreview.classList.add('active');
            const mainImageLabel = document.querySelector('label[for="mainImage"]');
            if (mainImageLabel) mainImageLabel.style.display = 'none';
        }
        
        if (product.image_2_url) {
            const image2Preview = document.getElementById('image2Preview');
            image2Preview.innerHTML = `<img src="${product.image_2_url}" alt="Preview">`;
            image2Preview.classList.add('active');
            const image2Label = document.querySelector('label[for="image2"]');
            if (image2Label) image2Label.style.display = 'none';
        }
        
        if (product.image_3_url) {
            const image3Preview = document.getElementById('image3Preview');
            image3Preview.innerHTML = `<img src="${product.image_3_url}" alt="Preview">`;
            image3Preview.classList.add('active');
            const image3Label = document.querySelector('label[for="image3"]');
            if (image3Label) image3Label.style.display = 'none';
        }
        
        // Show delete button when editing
        const deleteBtn = document.getElementById('deleteBtn');
        if (deleteBtn) {
            deleteBtn.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading product:', error);
        alert('Không thể tải thông tin sản phẩm');
    }
}

// Load Categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/`, {
            credentials: 'include'
        });
        const data = await response.json();
        const categories = data.results || data;
        
        const select = document.querySelector('[name="category"]');
        select.innerHTML = '<option value="">Chọn danh mục</option>' + 
            categories.map(cat => `<option value="${cat.category_id}">${cat.name}</option>`).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Size buttons
    document.querySelectorAll('.size-btn:not(.add-size)').forEach(btn => {
        btn.addEventListener('click', function() {
            const size = this.dataset.size;
            this.classList.toggle('active');
            
            if (this.classList.contains('active')) {
                if (!selectedSizes.includes(size)) {
                    selectedSizes.push(size);
                }
            } else {
                selectedSizes = selectedSizes.filter(s => s !== size);
            }
            
            updateSelectedVariants();
        });
    });
    
    // Color buttons
    document.querySelectorAll('.color-btn:not(.add-color)').forEach(btn => {
        btn.addEventListener('click', function() {
            const color = this.dataset.color;
            this.classList.toggle('active');
            
            if (this.classList.contains('active')) {
                if (!selectedColors.includes(color)) {
                    selectedColors.push(color);
                }
            } else {
                selectedColors = selectedColors.filter(c => c !== color);
            }
            
            updateSelectedVariants();
        });
    });
    
    // Image uploads
    setupImageUpload('mainImage', 'mainImagePreview');
    setupImageUpload('image2', 'image2Preview');
    setupImageUpload('image3', 'image3Preview');
    
    // Form submit
    document.getElementById('productForm').addEventListener('submit', handleFormSubmit);
}

// Update Selected Variants Display
function updateSelectedVariants() {
    const container = document.getElementById('selectedVariants');
    
    if (selectedSizes.length === 0 && selectedColors.length === 0) {
        container.innerHTML = '<p style="color: #999; font-size: 14px;">Chưa chọn biến thể nào</p>';
        return;
    }
    
    let html = '<div style="display: flex; gap: 16px; flex-wrap: wrap;">';
    
    if (selectedSizes.length > 0) {
        html += '<div><strong>Size:</strong> ' + selectedSizes.join(', ') + '</div>';
    }
    
    if (selectedColors.length > 0) {
        html += '<div><strong>Màu:</strong> ' + selectedColors.join(', ') + '</div>';
    }
    
    html += '</div>';
    container.innerHTML = html;
}

// Setup Image Upload
function setupImageUpload(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                preview.classList.add('active');
                preview.previousElementSibling.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });
}

// Handle Form Submit
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const productName = formData.get('name')?.trim();
    const categoryValue = formData.get('category');
    const priceValue = formData.get('price');
    const stockValue = formData.get('stock');
    
    // Validate required fields
    if (!productName) {
        alert('Vui lòng nhập tên sản phẩm');
        return;
    }
    
    if (!categoryValue) {
        alert('Vui lòng chọn danh mục');
        return;
    }
    
    if (!priceValue || priceValue === '') {
        alert('Vui lòng nhập giá bán');
        return;
    }
    
    if (!stockValue || stockValue === '') {
        alert('Vui lòng nhập số lượng tồn kho');
        return;
    }
    
    const price = parseFloat(priceValue);
    const stockQuantity = parseInt(stockValue);
    
    if (isNaN(price) || price <= 0) {
        alert('Giá bán phải là số lớn hơn 0');
        return;
    }
    
    if (isNaN(stockQuantity) || stockQuantity < 0) {
        alert('Số lượng tồn kho phải là số không âm');
        return;
    }
    
    // Generate slug from product name
    const slug = productName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    
    // Get image URLs from preview or use uploaded files
    let imageUrl = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400';
    let image2Url = '';
    let image3Url = '';
    
    // Check if images were uploaded (as base64 or URL)
    const mainImagePreview = document.getElementById('mainImagePreview');
    if (mainImagePreview && mainImagePreview.querySelector('img')) {
        imageUrl = mainImagePreview.querySelector('img').src;
    }
    
    const image2Preview = document.getElementById('image2Preview');
    if (image2Preview && image2Preview.querySelector('img')) {
        image2Url = image2Preview.querySelector('img').src;
    }
    
    const image3Preview = document.getElementById('image3Preview');
    if (image3Preview && image3Preview.querySelector('img')) {
        image3Url = image3Preview.querySelector('img').src;
    }
    
    const oldPriceValue = formData.get('old_price');
    const oldPrice = oldPriceValue && oldPriceValue !== '' ? parseFloat(oldPriceValue) : 0;
    
    const data = {
        name: productName,
        slug: slug,
        category: parseInt(categoryValue),
        price: price,
        old_price: oldPrice,
        stock_quantity: stockQuantity,
        description: formData.get('description')?.trim() || '',
        size: selectedSizes.join(', ') || '',
        color: selectedColors.join(', ') || '',
        image_url: imageUrl,
        image_2_url: image2Url,
        image_3_url: image3Url,
        is_active: true,
        is_new: false,
        is_featured: false
    };
    
    console.log('Form data collected:', {
        productName,
        categoryValue,
        priceValue,
        stockValue,
        price,
        stockQuantity
    });
    console.log('Sending data:', data);
    
    const method = productId ? 'PATCH' : 'POST';
    const url = productId ? `${API_BASE_URL}/products/${productId}/` : `${API_BASE_URL}/products/`;
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('Response data:', result);
            alert(productId ? 'Đã cập nhật sản phẩm thành công!' : 'Đã thêm sản phẩm mới thành công!');
            window.location.href = '/admin/pages/products.html';
        } else {
            const error = await response.json();
            console.error('Error response:', error);
            alert('Có lỗi xảy ra: ' + JSON.stringify(error));
        }
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Có lỗi xảy ra khi lưu sản phẩm: ' + error.message);
    }
}

// Delete Modal Functions
function openDeleteModal() {
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
}

async function confirmDelete() {
    if (!productId) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}/`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            alert('Đã xóa sản phẩm thành công!');
            window.location.href = '/admin/pages/products.html';
        } else {
            alert('Không thể xóa sản phẩm');
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Có lỗi xảy ra khi xóa sản phẩm');
    }
}

// Admin user dropdown (same as products.html)
function handleAdminUserClick() {
    const userName = sessionStorage.getItem('userName') || sessionStorage.getItem('userEmail') || 'Admin';
    const userEmail = sessionStorage.getItem('userEmail') || '';
    
    const existingMenu = document.querySelector('.admin-user-dropdown');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const menu = document.createElement('div');
    menu.className = 'admin-user-dropdown';
    menu.innerHTML = `
        <div class="dropdown-header">
            <img src="/user/assets/images/avatar.svg" alt="Avatar" class="dropdown-avatar">
            <div class="dropdown-info">
                <div class="dropdown-name">${userName}</div>
                <div class="dropdown-email">${userEmail}</div>
            </div>
        </div>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item" onclick="window.location.href='/admin/pages/dashboard.html'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Về trang chủ
        </button>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item logout-btn" onclick="logout(); event.stopPropagation();">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Đăng xuất
        </button>
    `;
    
    document.body.appendChild(menu);
    
    const avatarBtn = document.querySelector('.admin-user');
    if (avatarBtn) {
        const rect = avatarBtn.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = `${rect.bottom + 10}px`;
        menu.style.right = `${window.innerWidth - rect.right}px`;
    }
    
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && !avatarBtn.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 0);
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/auth/logout/`, {
            method: 'POST',
            credentials: 'include'
        });
        
        sessionStorage.clear();
        window.location.href = '/login';
    } catch (error) {
        console.error('Logout error:', error);
        sessionStorage.clear();
        window.location.href = '/login';
    }
}
