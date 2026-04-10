// Auth JavaScript

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
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Simple validation (replace with real API call)
    if (email === 'admin@oldschool.vn' && password === 'admin123') {
        // Save login state
        sessionStorage.setItem('adminLoggedIn', 'true');
        sessionStorage.setItem('adminEmail', email);
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } else if (email && password) {
        // For demo: any email/password works
        sessionStorage.setItem('userLoggedIn', 'true');
        sessionStorage.setItem('userEmail', email);
        
        // Redirect to user homepage
        window.location.href = '../../pages/index.html';
    } else {
        alert('Vui lòng nhập đầy đủ thông tin!');
    }
});

// Register Form
document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
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
    
    // Success
    alert('Đăng ký thành công! Vui lòng đăng nhập.');
    showLogin();
    
    // Pre-fill login form
    document.getElementById('loginEmail').value = email;
});

// Check if already logged in
if (sessionStorage.getItem('adminLoggedIn') === 'true') {
    window.location.href = 'dashboard.html';
}
