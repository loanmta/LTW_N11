/**
 * Admin Login Handler
 * 
 * Xử lý đăng nhập cho admin panel
 * - Gọi API backend để xác thực
 * - Kiểm tra role phải là 'admin'
 * - Lưu thông tin vào sessionStorage
 * - Redirect đến dashboard nếu thành công
 */

// Xử lý form đăng nhập
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Lấy thông tin từ form
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        // Gọi API đăng nhập
        const response = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Gửi cookies để tạo session
            body: JSON.stringify({
                email: username,
                password: password
            })
        });
        
        const data = await response.json();
        
        // Kiểm tra đăng nhập thành công
        if (data.success && data.user) {
            // Kiểm tra role phải là admin
            if (data.user.role !== 'admin') {
                errorDiv.textContent = 'Bạn không có quyền truy cập trang quản trị!';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Lưu thông tin đăng nhập vào sessionStorage
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userRole', data.user.role);
            sessionStorage.setItem('adminUsername', data.user.email);
            sessionStorage.setItem('adminUserId', data.user.user_id);
            
            // Chuyển đến trang dashboard
            window.location.href = '/admin/pages/dashboard.html';
        } else {
            // Hiển thị lỗi
            errorDiv.textContent = data.message || 'Tên đăng nhập hoặc mật khẩu không đúng!';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Không thể kết nối đến server. Vui lòng thử lại!';
        errorDiv.style.display = 'block';
    }
});

// Kiểm tra nếu đã đăng nhập rồi thì redirect đến dashboard
if (sessionStorage.getItem('isLoggedIn') === 'true' && sessionStorage.getItem('userRole') === 'admin') {
    window.location.href = '/admin/pages/dashboard.html';
}
