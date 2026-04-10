// Test Login - For development testing only
// This script simulates a logged-in user without backend

function testLogin(role = 'user') {
    if (role === 'admin') {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userEmail', 'admin@oldschool.vn');
        sessionStorage.setItem('userRole', 'admin');
        sessionStorage.setItem('userName', 'Admin User');
        sessionStorage.setItem('userId', '1');
        console.log('✅ Test login as ADMIN successful');
    } else {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userEmail', 'user@test.com');
        sessionStorage.setItem('userRole', 'user');
        sessionStorage.setItem('userName', 'Test User');
        sessionStorage.setItem('userId', '2');
        console.log('✅ Test login as USER successful');
    }
    
    console.log('Session data:', {
        isLoggedIn: sessionStorage.getItem('isLoggedIn'),
        email: sessionStorage.getItem('userEmail'),
        role: sessionStorage.getItem('userRole'),
        name: sessionStorage.getItem('userName')
    });
    
    alert('Test login successful! Refresh the page to see changes.');
}

function testLogout() {
    sessionStorage.clear();
    console.log('✅ Test logout successful');
    alert('Test logout successful! Refresh the page.');
}

// Make functions available in console
window.testLogin = testLogin;
window.testLogout = testLogout;

console.log('🧪 Test Login Script Loaded');
console.log('Usage:');
console.log('  testLogin("user")  - Login as regular user');
console.log('  testLogin("admin") - Login as admin');
console.log('  testLogout()       - Clear session');
