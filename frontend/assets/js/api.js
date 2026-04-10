// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// API Client
class APIClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            credentials: 'include',
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

    // Categories
    async getCategories() {
        return this.request('/categories/');
    }

    // Products
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/products/?${queryString}`);
    }

    async getProduct(id) {
        return this.request(`/products/${id}/`);
    }

    async searchProducts(query) {
        return this.request(`/products/search/?q=${encodeURIComponent(query)}`);
    }

    // Cart
    async getCart() {
        return this.request('/cart/');
    }

    async addToCart(productId, quantity = 1) {
        return this.request('/cart/add_item/', {
            method: 'POST',
            body: JSON.stringify({ product_id: productId, quantity }),
        });
    }

    async getCartCount() {
        return this.request('/cart/count/');
    }

    async updateCartItem(id, quantity) {
        return this.request(`/cart/${id}/update_quantity/`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity }),
        });
    }

    async removeCartItem(id) {
        return this.request(`/cart/${id}/`, {
            method: 'DELETE',
        });
    }

    async clearCart() {
        return this.request('/cart/clear/', {
            method: 'DELETE',
        });
    }

    // Orders
    async getOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/orders/?${queryString}`);
    }

    async getOrder(id) {
        return this.request(`/orders/${id}/`);
    }

    async createOrder(data) {
        return this.request('/orders/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async searchOrders(query) {
        return this.request(`/orders/search/?q=${encodeURIComponent(query)}`);
    }

    // Profile
    async getProfile() {
        return this.request('/profile/');
    }

    async updateProfile(id, data) {
        return this.request(`/profile/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }
}

// Export API instance
const api = new APIClient(API_BASE_URL);
