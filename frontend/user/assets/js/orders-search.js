// Orders Search Handler - New file to avoid cache
function handleOrderSearch(event) {
    event.preventDefault();
    
    const searchInput = document.getElementById('orderSearchInput');
    const query = searchInput.value.trim();
    const urlParams = new URLSearchParams(window.location.search);
    const currentStatus = urlParams.get('status') || 'all';
    
    console.log('=== ORDER SEARCH ===');
    console.log('Query:', query);
    console.log('Status:', currentStatus);
    
    if (query) {
        const newUrl = `${window.location.pathname}?status=${currentStatus}&search=${encodeURIComponent(query)}`;
        console.log('Redirecting to:', newUrl);
        window.location.href = newUrl;
    } else {
        const newUrl = `${window.location.pathname}?status=${currentStatus}`;
        console.log('Redirecting to:', newUrl);
        window.location.href = newUrl;
    }
}
