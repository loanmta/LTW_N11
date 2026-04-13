// Admin API Client
const API_BASE_URL = 'http://127.0.0.1:8000/api';

class AdminAPI {
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

    // Dashboard Stats
    async getDashboardStats() {
        const response = await this.request('/dashboard/stats/');
        return response.stats;
    }

    // Products
    async getProducts(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/products/?${queryString}`);
    }

    async createProduct(data) {
        return this.request('/products/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateProduct(id, data) {
        return this.request(`/products/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async deleteProduct(id) {
        return this.request(`/products/${id}/`, {
            method: 'DELETE',
        });
    }

    // Orders
    async getOrders(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.request(`/orders/?${queryString}`);
    }

    async updateOrderStatus(id, status) {
        return this.request(`/orders/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    // Recent Activities (mock)
    async getRecentActivities() {
        return [
            {
                type: 'order',
                title: 'Đơn hàng mới #12405',
                description: 'Nguyễn Văn A • 2 phút trước',
                amount: '₫1,250,000'
            },
            {
                type: 'member',
                title: 'Thành viên mới gia nhập',
                description: 'Lê Thị B vừa tạo tài khoản • 10 phút trước',
                amount: ''
            },
            {
                type: 'product',
                title: 'Cập nhật kho sản phẩm',
                description: 'Kimono Modern Blazer, Áo len trắng • 1 giờ trước',
                amount: 'Nhập kho'
            }
        ];
    }
}

// Export API instance
const adminAPI = new AdminAPI(API_BASE_URL);

// Check authentication
function checkAuth() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const userRole = sessionStorage.getItem('userRole');
    
    if (!isLoggedIn || userRole !== 'admin') {
        window.location.href = '/login.html';
    }
}

// Logout function
async function logout() {
    const API_BASE_URL = 'http://127.0.0.1:8000/api';
    
    try {
        await fetch(`${API_BASE_URL}/auth/logout/`, {
            method: 'POST',
            credentials: 'include'
        });
        
        sessionStorage.clear();
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout error:', error);
        sessionStorage.clear();
        window.location.href = '/login.html';
    }
}
