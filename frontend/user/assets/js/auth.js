// Auth JavaScript with Backend API Integration

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Show/Hide sections
function showLogin() {
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('registerSection').classList.add('hidden');
}

function showRegister() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('registerSection').classList.remove('hidden');
}

// Login Form
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('Vui lòng nhập đầy đủ thông tin!');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Save user info to sessionStorage
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userEmail', data.user.email);
            sessionStorage.setItem('userRole', data.user.role);
            sessionStorage.setItem('userName', data.user.full_name);
            sessionStorage.setItem('userId', data.user.user_id);
            
            alert(data.message);
            
            // Redirect based on role
            if (data.user.role === 'admin') {
                window.location.href = '/admin/pages/dashboard.html';
            } else {
                window.location.href = '/';
            }
        } else {
            alert(data.message || 'Đăng nhập thất bại!');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Lỗi kết nối đến server!');
    }
});

// Register Form
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const full_name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const phone = document.getElementById('registerPhone')?.value || '';
    
    // Validation
    if (!full_name || !email || !password || !confirmPassword) {
        alert('Vui lòng điền đầy đủ thông tin!');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Mật khẩu xác nhận không khớp!');
        return;
    }
    
    if (password.length < 6) {
        alert('Mật khẩu phải có ít nhất 6 ký tự!');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password, full_name, phone })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            showLogin();
            // Pre-fill login form
            document.getElementById('loginEmail').value = email;
        } else {
            alert(data.message || 'Đăng ký thất bại!');
        }
    } catch (error) {
        console.error('Register error:', error);
        alert('Lỗi kết nối đến server!');
    }
});

// Check authentication status on page load
async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/check/`, {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.authenticated) {
            // Save user info to sessionStorage
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userEmail', data.user.email);
            sessionStorage.setItem('userRole', data.user.role);
            sessionStorage.setItem('userName', data.user.full_name);
            sessionStorage.setItem('userId', data.user.user_id);
            
            // Redirect based on role
            if (data.user.role === 'admin') {
                window.location.href = '/admin/pages/dashboard.html';
            } else {
                window.location.href = '/';
            }
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}

// Check if already logged in
checkAuth();
