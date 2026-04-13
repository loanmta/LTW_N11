// Auth Check - Kiểm tra đăng nhập khi vào trang

// Check if user is authenticated
async function checkAuthentication() {
    // Check sessionStorage first
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        // Redirect to login page
        window.location.href = '/login.html';
        return false;
    }
    
    // Verify with backend
    try {
        const API_URL = 'http://127.0.0.1:8000/api';
        const response = await fetch(`${API_URL}/auth/check/`, {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!data.authenticated) {
            // Session expired, clear and redirect
            sessionStorage.clear();
            window.location.href = '/login.html';
            return false;
        }
        
        // Update session storage with fresh data
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userEmail', data.user.email);
        sessionStorage.setItem('userRole', data.user.role);
        sessionStorage.setItem('userName', data.user.full_name);
        sessionStorage.setItem('userId', data.user.user_id);
        
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        // If backend is down, allow access based on sessionStorage
        return isLoggedIn;
    }
}

// Check authentication on page load (for protected pages)
// Call this function in pages that require authentication
function requireAuth() {
    checkAuthentication();
}
