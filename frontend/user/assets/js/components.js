// Header Component
function createHeader() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    return `
        <header class="header">
            <div class="container">
                <div class="header-content">
                    <a href="/" class="logo">
                        <span class="logo-icon"></span>
                        <span class="logo-text">OLD SCHOOL</span>
                    </a>
                    <nav class="nav">
                        <a href="/" class="nav-link ${currentPage === '' || currentPage === 'index.html' ? 'active' : ''}">Tổng quan</a>
                        <a href="/products.html" class="nav-link ${currentPage === 'products.html' ? 'active' : ''}">Sản phẩm</a>
                        <a href="/orders.html" class="nav-link ${currentPage === 'orders.html' ? 'active' : ''}">Đơn hàng</a>
                        <a href="#" class="nav-link">Bộ sưu tập</a>
                        <a href="#" class="nav-link">Tết sale</a>
                    </nav>
                    <div class="header-actions">
                        <input type="text" class="search-input" placeholder="Tìm kiếm nhanh...">
                        
                        <button class="user-avatar-btn" onclick="handleUserClick()">
                            <img src="/user/assets/images/avatar.svg" alt="User" class="user-avatar-img">
                        </button>
                        
                        <button class="cart-icon-btn" onclick="window.location.href='/cart.html'">
                            <svg class="cart-icon-svg" viewBox="0 0 64 64" fill="none">
                                <path d="M8 12h6l6 32h28l6-24H18" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
                                <circle cx="24" cy="52" r="3" fill="currentColor"/>
                                <circle cx="44" cy="52" r="3" fill="currentColor"/>
                            </svg>
                            <span class="cart-badge-large" id="cartBadge">0</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    `;
}

// Footer Component
function createFooter() {
    return `
        <footer class="footer">
            <div class="container">
                <div class="footer-content">
                    <!-- Company Info -->
                    <div class="footer-column">
                        <div class="footer-logo">
                            <span class="logo-icon"></span>
                            <span class="logo-text">OLD SCHOOL</span>
                        </div>
                        <p class="footer-description">
                            Thời trang cao cấp với phong cách cổ điển, sang trọng. 
                            Chất liệu premium, thiết kế tinh tế.
                        </p>
                        <div class="footer-social">
                            <a href="#" class="social-link">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>
                            <a href="#" class="social-link">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                            </a>
                            <a href="#" class="social-link">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                </svg>
                            </a>
                        </div>
                    </div>

                    <!-- Quick Links -->
                    <div class="footer-column">
                        <h3 class="footer-title">Liên kết nhanh</h3>
                        <ul class="footer-links">
                            <li><a href="index.html">Tổng quan</a></li>
                            <li><a href="products.html">Sản phẩm</a></li>
                            <li><a href="orders.html">Đơn hàng</a></li>
                            <li><a href="#">Bộ sưu tập</a></li>
                            <li><a href="#">Tết sale</a></li>
                        </ul>
                    </div>

                    <!-- Customer Service -->
                    <div class="footer-column">
                        <h3 class="footer-title">Hỗ trợ khách hàng</h3>
                        <ul class="footer-links">
                            <li><a href="#">Chính sách đổi trả</a></li>
                            <li><a href="#">Hướng dẫn mua hàng</a></li>
                            <li><a href="#">Phương thức thanh toán</a></li>
                            <li><a href="#">Chính sách bảo mật</a></li>
                            <li><a href="#">Điều khoản dịch vụ</a></li>
                        </ul>
                    </div>

                    <!-- Contact Info -->
                    <div class="footer-column">
                        <h3 class="footer-title">Liên hệ</h3>
                        <ul class="footer-contact">
                            <li>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                    <circle cx="12" cy="10" r="3"/>
                                </svg>
                                <span>71 Ngũ Hành Sơn, Đà Nẵng</span>
                            </li>
                            <li>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                                </svg>
                                <span>0971860620</span>
                            </li>
                            <li>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                    <polyline points="22,6 12,13 2,6"/>
                                </svg>
                                <span>contact@oldschool.vn</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <!-- Footer Bottom -->
                <div class="footer-bottom">
                    <p class="footer-copyright">
                        © 2026 OLD SCHOOL. All rights reserved.
                    </p>
                    <div class="footer-payment">
                        <span>Phương thức thanh toán:</span>
                        <div class="payment-icons">
                            <span class="payment-icon">💳</span>
                            <span class="payment-icon">🏦</span>
                            <span class="payment-icon">📱</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    `;
}

// Load components
document.addEventListener('DOMContentLoaded', async function() {
    // Load header
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        headerContainer.innerHTML = createHeader();
    }

    // Load footer
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        footerContainer.innerHTML = createFooter();
    }

    // Load cart count
    try {
        const data = await api.getCartCount();
        const badge = document.getElementById('cartBadge');
        if (badge) {
            badge.textContent = data.cart_count;
        }
    } catch (error) {
        console.error('Error loading cart count:', error);
    }
});


// Handle user avatar click
function handleUserClick() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        // Not logged in, redirect to login page
        window.location.href = '/login.html';
        return;
    }
    
    const userName = sessionStorage.getItem('userName') || sessionStorage.getItem('userEmail') || 'User';
    const userRole = sessionStorage.getItem('userRole') || 'user';
    
    // Create dropdown menu
    const existingMenu = document.querySelector('.user-dropdown-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const menu = document.createElement('div');
    menu.className = 'user-dropdown-menu';
    menu.innerHTML = `
        <div class="user-dropdown-header">
            <img src="/user/assets/images/avatar.svg" alt="Avatar" class="dropdown-avatar">
            <div class="dropdown-user-info">
                <div class="dropdown-user-name">${userName}</div>
                <div class="dropdown-user-role">${userRole === 'admin' ? 'Quản trị viên' : 'Người dùng'}</div>
            </div>
        </div>
        <div class="user-dropdown-divider"></div>
        <button class="user-dropdown-item" onclick="window.location.href='/profile.html'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3-6 8-6s8 2 8 6"/>
            </svg>
            Thông tin cá nhân
        </button>
        <button class="user-dropdown-item" onclick="window.location.href='/orders.html'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2h-3M9 2v4h6V2M9 2h6"/>
            </svg>
            Đơn hàng của tôi
        </button>
        ${userRole === 'admin' ? `
        <button class="user-dropdown-item" onclick="window.location.href='/admin/pages/dashboard.html'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
            </svg>
            Quản trị
        </button>
        ` : ''}
        <div class="user-dropdown-divider"></div>
        <button class="user-dropdown-item logout-btn" onclick="logout(); event.stopPropagation();">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            Đăng xuất
        </button>
    `;
    
    document.body.appendChild(menu);
    
    // Position menu below avatar
    const avatarBtn = document.querySelector('.user-avatar-btn');
    if (avatarBtn) {
        const rect = avatarBtn.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = `${rect.bottom + 10}px`;
        menu.style.right = `${window.innerWidth - rect.right}px`;
    }
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && !avatarBtn.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 0);
}

// Logout function
async function logout() {
    const API_BASE_URL = 'http://127.0.0.1:8000/api';
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/logout/`, {
            method: 'POST',
            credentials: 'include'
        });
        
        const data = await response.json();
        
        // Clear session storage
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('userEmail');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('userName');
        sessionStorage.removeItem('userId');
        
        alert(data.message || 'Đã đăng xuất!');
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Still clear local session even if API fails
        sessionStorage.clear();
        window.location.href = '/login.html';
    }
}
