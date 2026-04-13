// Profile page JavaScript
let currentUser = null;

document.addEventListener('DOMContentLoaded', async function() {
    await loadProfile();
    setupEventListeners();
});

async function loadProfile() {
    try {
        const response = await fetch('/api/auth/profile/', {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            displayProfile(currentUser);
        } else {
            showToast('Không thể tải thông tin profile', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Có lỗi xảy ra khi tải thông tin', 'error');
    }
}

function displayProfile(user) {
    document.getElementById('email').value = user.email || '';
    document.getElementById('fullName').value = user.full_name || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('address').value = user.address || '';
    document.getElementById('district').value = user.district || '';
    document.getElementById('city').value = user.city || '';
}

function setupEventListeners() {
    // Tab switching
    const menuItems = document.querySelectorAll('.menu-item[data-tab]');
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
    
    // Profile form submit
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    // Password form submit
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
}

function switchTab(tabName) {
    // Update menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`.menu-item[data-tab="${tabName}"]`)?.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`)?.classList.add('active');
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const district = document.getElementById('district').value.trim();
    const city = document.getElementById('city').value.trim();
    
    if (!fullName) {
        showToast('Vui lòng nhập họ tên', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/profile/', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                full_name: fullName,
                phone: phone,
                address: address,
                district: district,
                city: city
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            showToast('Cập nhật thông tin thành công', 'success');
            
            // Update session storage if exists
            const sessionUser = sessionStorage.getItem('user');
            if (sessionUser) {
                const user = JSON.parse(sessionUser);
                user.full_name = fullName;
                user.phone = phone;
                user.address = address;
                user.district = district;
                user.city = city;
                sessionStorage.setItem('user', JSON.stringify(user));
            }
            
            // Reload header to update user name
            if (window.loadHeader) {
                window.loadHeader();
            }
        } else {
            showToast(data.message || 'Cập nhật thất bại', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Có lỗi xảy ra khi cập nhật', 'error');
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('Vui lòng điền đầy đủ thông tin', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showToast('Mật khẩu mới không khớp', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/auth/change-password/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Đổi mật khẩu thành công', 'success');
            
            // Clear form
            document.getElementById('passwordForm').reset();
            
            // Optionally logout and redirect to login
            setTimeout(() => {
                if (confirm('Đổi mật khẩu thành công. Bạn có muốn đăng nhập lại?')) {
                    logout();
                }
            }, 1500);
        } else {
            showToast(data.message || 'Đổi mật khẩu thất bại', 'error');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showToast('Có lỗi xảy ra khi đổi mật khẩu', 'error');
    }
}

async function logout() {
    try {
        await fetch('/api/auth/logout/', {
            method: 'POST',
            credentials: 'include'
        });
        
        sessionStorage.clear();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    
    const icon = type === 'success' 
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#4CAF50"/><path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#f44336"/><path d="M8 8l8 8M16 8l-8 8" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>';
    
    toast.innerHTML = `
        <div class="toast-content">
            ${icon}
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
