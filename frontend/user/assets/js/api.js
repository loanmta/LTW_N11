/**
 * API Client Configuration
 * 
 * File này chứa class APIClient để gọi các API endpoints
 * Tất cả requests đều sử dụng credentials: 'include' để gửi cookies (session)
 */

// URL gốc của API backend
const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * API Client Class
 * Xử lý tất cả các request đến backend API
 */
class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    /**
     * Gửi request đến API
     * @param {string} endpoint - API endpoint (vd: '/products/')
     * @param {object} options - Fetch options (method, body, headers, etc.)
     * @returns {Promise} Response data dạng JSON
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            credentials: 'include', // Gửi cookies để maintain session
            ...options,
        };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // ===== CATEGORIES API =====
    /**
     * Lấy danh sách danh mục
     * GET /api/categories/
     */
    async getCategories() {
        return this.request('/categories/');
    }

    // ===== PRODUCTS API =====
    /**
     * Lấy danh sách sản phẩm với filters
     * GET /api/products/?search=...&category=...&page=...
     * @param {object} params - Query parameters (search, category, page, etc.)
     */
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/products/?${queryString}`);
    }

    /**
     * Lấy chi tiết một sản phẩm
     * GET /api/products/{id}/
     * @param {number} id - Product ID
     */
    async getProduct(id) {
        return this.request(`/products/${id}/`);
    }

    /**
     * Tìm kiếm sản phẩm
     * GET /api/products/search/?q=...
     * @param {string} query - Search query
     */
    async searchProducts(query) {
        return this.request(`/products/search/?q=${encodeURIComponent(query)}`);
    }

    // ===== CART API =====
    /**
     * Lấy giỏ hàng hiện tại
     * GET /api/cart/
     */
    async getCart() {
        return this.request('/cart/');
    }

    /**
     * Thêm sản phẩm vào giỏ hàng
     * POST /api/cart/add_item/
     * @param {number} productId - Product ID
     * @param {number} quantity - Số lượng
     * @param {string} color - Màu sắc đã chọn
     * @param {string} size - Kích cỡ đã chọn
     */
    async addToCart(productId, quantity = 1, color = null, size = null) {
        const payload = { 
            product_id: productId, 
            quantity 
        };
        
        if (color) payload.color = color;
        if (size) payload.size = size;
        
        return this.request('/cart/add_item/', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    /**
     * Lấy số lượng items trong giỏ hàng
     * GET /api/cart/count/
     */
    async getCartCount() {
        return this.request('/cart/count/');
    }

    /**
     * Cập nhật số lượng item trong giỏ hàng
     * PATCH /api/cart/{id}/update_quantity/
     * @param {number} id - Cart item ID
     * @param {number} quantity - Số lượng mới
     */
    async updateCartItem(id, quantity) {
        return this.request(`/cart/${id}/update_quantity/`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity }),
        });
    }

    /**
     * Toggle trạng thái chọn của item trong giỏ hàng
     * PATCH /api/cart/{id}/toggle_select/
     * @param {number} id - Cart item ID
     * @param {boolean} selected - Trạng thái chọn
     */
    async toggleCartItemSelect(id, selected) {
        return this.request(`/cart/${id}/toggle_select/`, {
            method: 'PATCH',
            body: JSON.stringify({ selected }),
        });
    }

    /**
     * Chọn/bỏ chọn tất cả items trong giỏ hàng
     * POST /api/cart/select_all/
     * @param {boolean} selected - Trạng thái chọn
     */
    async selectAllCartItems(selected) {
        return this.request('/cart/select_all/', {
            method: 'POST',
            body: JSON.stringify({ selected }),
        });
    }

    /**
     * Xóa item khỏi giỏ hàng
     * DELETE /api/cart/{id}/
     * @param {number} id - Cart item ID
     */
    async removeCartItem(id) {
        return this.request(`/cart/${id}/`, {
            method: 'DELETE',
        });
    }

    /**
     * Xóa toàn bộ giỏ hàng
     * DELETE /api/cart/clear/
     */
    async clearCart() {
        return this.request('/cart/clear/', {
            method: 'DELETE',
        });
    }

    // ===== ORDERS API =====
    /**
     * Lấy danh sách đơn hàng
     * GET /api/orders/?status=...
     * @param {object} params - Query parameters (status, etc.)
     */
    async getOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/orders/?${queryString}`);
    }

    /**
     * Lấy chi tiết đơn hàng
     * GET /api/orders/{id}/
     * @param {number} id - Order ID
     */
    async getOrder(id) {
        return this.request(`/orders/${id}/`);
    }

    /**
     * Tạo đơn hàng mới
     * POST /api/orders/
     * @param {object} data - Order data (full_name, phone, address, etc.)
     */
    async createOrder(data) {
        return this.request('/orders/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    /**
     * Tìm kiếm đơn hàng
     * GET /api/orders/search/?q=...
     * @param {string} query - Search query (order number, customer name)
     */
    async searchOrders(query) {
        return this.request(`/orders/search/?q=${encodeURIComponent(query)}`);
    }

    // ===== PROFILE API =====
    /**
     * Lấy thông tin profile
     * GET /api/profile/
     */
    async getProfile() {
        return this.request('/profile/');
    }

    /**
     * Cập nhật thông tin profile
     * PATCH /api/profile/{id}/
     * @param {number} id - Profile ID
     * @param {object} data - Profile data
     */
    async updateProfile(id, data) {
        return this.request(`/profile/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }
}

// Export API instance để sử dụng trong các file khác
const api = new APIClient(API_BASE_URL);
