// Admin Login
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Simple validation (replace with real API call)
    if (username === 'admin' && password === 'admin123') {
        // Save login state
        sessionStorage.setItem('adminLoggedIn', 'true');
        sessionStorage.setItem('adminUsername', username);
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } else {
        alert('Tên đăng nhập hoặc mật khẩu không đúng!');
    }
});

// Check if already logged in
if (sessionStorage.getItem('adminLoggedIn') === 'true') {
    window.location.href = 'dashboard.html';
}
