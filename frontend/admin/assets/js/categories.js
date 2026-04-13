// Categories Management JavaScript
let allCategories = [];
let currentPage = 1;
const categoriesPerPage = 10;
let categoryToDelete = null;
let editingCategoryId = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Check admin access
    const userRole = sessionStorage.getItem('userRole');
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    console.log('Auth check - isLoggedIn:', isLoggedIn, 'userRole:', userRole);
    
    if (isLoggedIn !== 'true' || userRole !== 'admin') {
        console.log('Not authorized, redirecting to admin login...');
        alert('Bạn cần đăng nhập với quyền admin để truy cập trang này!');
        window.location.href = '/admin/pages/login.html';
        return;
    }
    
    await loadCategories();
    setupFormHandlers();
});

// Load Categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories/`, {
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        allCategories = data.results || data;
        console.log('Loaded categories:', allCategories.length);
        displayCategories();
    } catch (error) {
        console.error('Error loading categories:', error);
        document.getElementById('categoriesTableBody').innerHTML = `
            <tr>
                <td colspan="3" class="loading" style="color: red;">
                    Không thể tải danh mục: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Display Categories
function displayCategories() {
    const tbody = document.getElementById('categoriesTableBody');
    
    if (!allCategories || allCategories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="padding: 40px; text-align: center; color: #999;">Chưa có danh mục nào</td></tr>';
        return;
    }
    
    // Pagination
    const startIndex = (currentPage - 1) * categoriesPerPage;
    const endIndex = startIndex + categoriesPerPage;
    const categoriesToShow = allCategories.slice(startIndex, endIndex);
    
    tbody.innerHTML = categoriesToShow.map((category, index) => `
        <tr style="border-bottom: 1px solid #F0F0F0; transition: background 0.2s;">
            <td style="padding: 16px;">
                <span style="color: #666; font-size: 14px;">${String(category.category_id).padStart(3, '0')}</span>
            </td>
            <td style="padding: 16px;">
                <span style="font-weight: 500; color: #333; font-size: 14px;">${category.name}</span>
            </td>
            <td style="padding: 16px; text-align: center;">
                <button onclick="openDeleteModal(${category.category_id}, '${category.name}')" 
                        style="width: 36px; height: 36px; border: none; background: #FFEBEE; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.3s;"
                        onmouseover="this.style.background='#D32F2F'; this.querySelector('svg').style.stroke='white';"
                        onmouseout="this.style.background='#FFEBEE'; this.querySelector('svg').style.stroke='#D32F2F';"
                        title="Xóa">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D32F2F" stroke-width="2" style="transition: stroke 0.3s;">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
    
    updatePagination();
    updateCategoryCount();
}

// Setup Form Handlers
function setupFormHandlers() {
    const form = document.getElementById('categoryForm');
    form.addEventListener('submit', handleFormSubmit);
}

// Generate Slug
function generateSlug(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// Open Add Category Modal
function openAddCategoryModal() {
    editingCategoryId = null;
    document.getElementById('modalTitle').textContent = 'Thêm danh mục mới';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    
    // Calculate next category ID
    let nextId = 1;
    if (allCategories && allCategories.length > 0) {
        const maxId = Math.max(...allCategories.map(c => c.category_id));
        nextId = maxId + 1;
    }
    document.getElementById('categoryIdDisplay').value = String(nextId).padStart(3, '0');
    
    const modal = document.getElementById('categoryModal');
    modal.style.display = 'flex';
}

// Edit Category
async function editCategory(categoryId) {
    editingCategoryId = categoryId;
    const category = allCategories.find(c => c.category_id === categoryId);
    
    if (!category) {
        alert('Không tìm thấy danh mục');
        return;
    }
    
    document.getElementById('modalTitle').textContent = 'Sửa danh mục';
    document.getElementById('categoryId').value = category.category_id;
    document.getElementById('categoryIdDisplay').value = String(category.category_id).padStart(3, '0');
    document.getElementById('categoryName').value = category.name;
    const modal = document.getElementById('categoryModal');
    modal.style.display = 'flex';
}

// Close Category Modal
function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    modal.style.display = 'none';
    editingCategoryId = null;
}

// Handle Form Submit
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const categoryId = document.getElementById('categoryId').value;
    const name = document.getElementById('categoryName').value.trim();
    
    if (!name) {
        alert('Vui lòng nhập tên danh mục');
        return;
    }
    
    // Auto-generate slug from name
    const slug = generateSlug(name);
    
    const categoryData = {
        name,
        slug,
        description: '',
        is_active: true
    };
    
    try {
        let response;
        if (categoryId) {
            // Update existing category
            response = await fetch(`${API_BASE_URL}/categories/${categoryId}/`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(categoryData)
            });
        } else {
            // Create new category
            response = await fetch(`${API_BASE_URL}/categories/`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(categoryData)
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Có lỗi xảy ra');
        }
        
        alert(categoryId ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục thành công!');
        closeCategoryModal();
        await loadCategories();
    } catch (error) {
        console.error('Error saving category:', error);
        alert('Lỗi: ' + error.message);
    }
}

// Open Delete Modal
function openDeleteModal(categoryId, categoryName) {
    categoryToDelete = categoryId;
    const modal = document.getElementById('deleteModal');
    modal.style.display = 'flex';
}

// Close Delete Modal
function closeDeleteModal() {
    categoryToDelete = null;
    const modal = document.getElementById('deleteModal');
    modal.style.display = 'none';
}

// Confirm Delete
async function confirmDelete() {
    if (!categoryToDelete) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/categories/${categoryToDelete}/`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Không thể xóa danh mục');
        }
        
        alert('Đã xóa danh mục thành công');
        closeDeleteModal();
        await loadCategories();
    } catch (error) {
        console.error('Error deleting category:', error);
        alert('Lỗi: ' + error.message);
    }
}

// Update Category Count
function updateCategoryCount() {
    const showingCount = document.getElementById('showingCount');
    const totalCount = document.getElementById('totalCount');
    
    if (showingCount && totalCount) {
        const start = (currentPage - 1) * categoriesPerPage + 1;
        const end = Math.min(currentPage * categoriesPerPage, allCategories.length);
        showingCount.textContent = allCategories.length > 0 ? `${start} - ${end}` : '0';
        totalCount.textContent = allCategories.length;
    }
}

// Pagination
function updatePagination() {
    const totalPages = Math.ceil(allCategories.length / categoriesPerPage);
    const pagination = document.getElementById('pagination');
    
    if (!pagination || totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `<button class="pagination-btn" onclick="prevPage()" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;
    
    // Page numbers
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    
    if (totalPages > 5) {
        html += '<button class="pagination-btn" disabled>...</button>';
        html += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    html += `<button class="pagination-btn" onclick="nextPage()" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;
    
    pagination.innerHTML = html;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayCategories();
    }
}

function nextPage() {
    const totalPages = Math.ceil(allCategories.length / categoriesPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayCategories();
    }
}

function goToPage(page) {
    currentPage = page;
    displayCategories();
}
