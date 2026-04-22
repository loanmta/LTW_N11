// Reports JavaScript
let revenueChart = null;
let productChart = null;

document.addEventListener('DOMContentLoaded', async function() {
    await loadReportData();
    initializeCharts();
});

// Load Report Data
async function loadReportData() {
    try {
        // Load dashboard stats from API
        const statsResponse = await fetch(`${API_BASE_URL}/dashboard/stats/`, {
            credentials: 'include'
        });
        const response = await statsResponse.json();
        const stats = response.stats;
        
        // Update stats cards
        document.getElementById('totalRevenue').textContent = formatRevenue(stats.total_revenue);
        document.getElementById('totalOrders').textContent = stats.total_orders.toLocaleString();
        document.getElementById('totalProducts').textContent = stats.total_products;
        document.getElementById('totalCustomers').textContent = stats.total_customers;
        
        // Store stats for charts
        window.dashboardStats = stats;
        
    } catch (error) {
        console.error('Error loading report data:', error);
        // Use mock data
        document.getElementById('totalRevenue').textContent = '0 VNĐ';
        document.getElementById('totalOrders').textContent = '0';
        document.getElementById('totalProducts').textContent = '0';
        document.getElementById('totalCustomers').textContent = '0';
    }
}

// Initialize Charts
function initializeCharts() {
    initializeRevenueChart();
    initializeProductChart();
}

// Initialize Revenue Chart
function initializeRevenueChart() {
    const ctx = document.getElementById('revenueChart');
    
    // Get revenue data from API
    const revenueByMonth = window.dashboardStats?.revenue_by_month || [];
    
    // Extract labels and data
    const labels = revenueByMonth.map(item => item.month);
    const revenueData = revenueByMonth.map(item => (item.revenue / 1000000).toFixed(1)); // Convert to millions
    
    const data = {
        labels: labels,
        datasets: [
            {
                label: 'Doanh thu thực tế',
                data: revenueData,
                backgroundColor: '#D32F2F',
                borderColor: '#D32F2F',
                borderWidth: 0,
                borderRadius: 4,
            }
        ]
    };
    
    const config = {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 13
                    },
                    bodyFont: {
                        size: 12
                    },
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + ' triệu VNĐ';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            size: 12
                        },
                        callback: function(value) {
                            return value + ' tr';
                        }
                    },
                    grid: {
                        color: '#f0f0f0'
                    }
                }
            }
        }
    };
    
    revenueChart = new Chart(ctx, config);
}

// Initialize Product Chart
function initializeProductChart() {
    const ctx = document.getElementById('productChart');
    
    // Get top products from API
    const topProducts = window.dashboardStats?.top_products || [];
    
    // Take top 3 products
    const top3 = topProducts.slice(0, 3);
    const labels = top3.map(p => p.product_name);
    const data = top3.map(p => p.total_sold);
    
    // If no data, show placeholder
    if (labels.length === 0) {
        labels.push('Chưa có dữ liệu');
        data.push(1);
    }
    
    const chartData = {
        labels: labels,
        datasets: [{
            data: data,
            backgroundColor: [
                '#D32F2F',
                '#9E9E9E',
                '#2196F3'
            ],
            borderWidth: 0
        }]
    };
    
    const config = {
        type: 'pie',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 13
                    },
                    bodyFont: {
                        size: 12
                    },
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return label + ': ' + value + ' sản phẩm (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    };
    
    productChart = new Chart(ctx, config);
    
    // Update legend
    updateProductLegend(top3);
}

// Update Product Legend
function updateProductLegend(products) {
    const legendContainer = document.querySelector('.chart-legend');
    if (!legendContainer) return;
    
    const colors = ['red', 'gray', 'blue'];
    
    if (products.length === 0) {
        legendContainer.innerHTML = '<div class="legend-item"><span class="legend-label">Chưa có dữ liệu</span></div>';
        return;
    }
    
    legendContainer.innerHTML = products.map((product, index) => `
        <div class="legend-item">
            <span class="legend-color ${colors[index] || 'gray'}"></span>
            <span class="legend-label">: ${product.product_name}</span>
        </div>
    `).join('');
}

// Update Revenue Chart
async function updateRevenueChart() {
    const filter = document.getElementById('revenueFilter').value;
    
    try {
        // Get current date
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        
        // Load orders from API
        const response = await fetch(`${API_BASE_URL}/orders/`, {
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        // Handle both array and object response
        const orders = Array.isArray(data) ? data : (data.results || []);
        
        let labels = [];
        let revenueData = [];
        
        if (filter === 'month') {
            // Filter by month - show last 6 months
            const monthsData = {};
            
            for (let i = 5; i >= 0; i--) {
                const date = new Date(currentYear, currentMonth - 1 - i, 1);
                const monthKey = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                monthsData[monthKey] = 0;
            }
            
            // Calculate revenue for each month
            orders.forEach(order => {
                if ((order.status === 'completed' || order.status === 'shipping') && order.total) {
                    const orderDate = new Date(order.created_at);
                    const monthKey = `${String(orderDate.getMonth() + 1).padStart(2, '0')}/${orderDate.getFullYear()}`;
                    
                    if (monthsData.hasOwnProperty(monthKey)) {
                        monthsData[monthKey] += parseFloat(order.total) || 0;
                    }
                }
            });
            
            labels = Object.keys(monthsData);
            revenueData = Object.values(monthsData).map(val => (val / 1000000).toFixed(1));
            
        } else if (filter === 'quarter') {
            // Filter by quarter - show 4 quarters of current year
            const quartersData = {
                'Q1': 0,
                'Q2': 0,
                'Q3': 0,
                'Q4': 0
            };
            
            orders.forEach(order => {
                if ((order.status === 'completed' || order.status === 'shipping') && order.total) {
                    const orderDate = new Date(order.created_at);
                    if (orderDate.getFullYear() === currentYear) {
                        const month = orderDate.getMonth() + 1;
                        let quarter;
                        
                        if (month <= 3) quarter = 'Q1';
                        else if (month <= 6) quarter = 'Q2';
                        else if (month <= 9) quarter = 'Q3';
                        else quarter = 'Q4';
                        
                        quartersData[quarter] += parseFloat(order.total) || 0;
                    }
                }
            });
            
            labels = Object.keys(quartersData);
            revenueData = Object.values(quartersData).map(val => (val / 1000000).toFixed(1));
            
        } else if (filter === 'year') {
            // Filter by year - show last 5 years
            const yearsData = {};
            
            for (let i = 4; i >= 0; i--) {
                const year = currentYear - i;
                yearsData[year] = 0;
            }
            
            orders.forEach(order => {
                if ((order.status === 'completed' || order.status === 'shipping') && order.total) {
                    const orderDate = new Date(order.created_at);
                    const year = orderDate.getFullYear();
                    
                    if (yearsData.hasOwnProperty(year)) {
                        yearsData[year] += parseFloat(order.total) || 0;
                    }
                }
            });
            
            labels = Object.keys(yearsData);
            revenueData = Object.values(yearsData).map(val => (val / 1000000).toFixed(1));
        }
        
        // Update chart
        if (revenueChart) {
            revenueChart.data.labels = labels;
            revenueChart.data.datasets[0].data = revenueData;
            revenueChart.update();
        }
        
    } catch (error) {
        console.error('Error updating revenue chart:', error);
        alert('Có lỗi xảy ra khi cập nhật biểu đồ: ' + error.message);
    }
}

// Export Excel
async function exportPDF() {
    try {
        // Show loading
        const btn = document.querySelector('.btn-export');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span>Đang tạo Excel...</span>';
        btn.disabled = true;
        
        // Load SheetJS from CDN if not already loaded
        if (typeof XLSX === 'undefined') {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
        }
        
        // Get data
        const totalRevenue = document.getElementById('totalRevenue').textContent;
        const totalOrders = document.getElementById('totalOrders').textContent;
        const totalProducts = document.getElementById('totalProducts').textContent;
        const totalCustomers = document.getElementById('totalCustomers').textContent;
        
        // Get current date
        const now = new Date();
        const dateStr = now.toLocaleDateString('vi-VN');
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Sheet 1: Tổng quan
        const overviewData = [
            ['BÁO CÁO DOANH THU - OLD SCHOOL'],
            ['Ngày xuất: ' + dateStr],
            [],
            ['THỐNG KÊ TỔNG QUAN'],
            ['Chỉ tiêu', 'Giá trị'],
            ['Tổng doanh thu', totalRevenue],
            ['Số đơn hàng', totalOrders],
            ['Sản phẩm', totalProducts],
            ['Khách hàng', totalCustomers],
        ];
        
        const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
        
        // Set column widths
        ws1['!cols'] = [
            { wch: 25 },
            { wch: 20 }
        ];
        
        // Merge cells for title
        ws1['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
            { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } }
        ];
        
        XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');
        
        // Sheet 2: Doanh thu theo tháng
        if (window.dashboardStats && window.dashboardStats.revenue_by_month) {
            const revenueData = [
                ['DOANH THU THEO THÁNG'],
                [],
                ['Tháng', 'Doanh thu (VNĐ)']
            ];
            
            window.dashboardStats.revenue_by_month.forEach(item => {
                revenueData.push([
                    item.month,
                    item.revenue
                ]);
            });
            
            const ws2 = XLSX.utils.aoa_to_sheet(revenueData);
            ws2['!cols'] = [{ wch: 15 }, { wch: 20 }];
            ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
            
            XLSX.utils.book_append_sheet(wb, ws2, 'Doanh thu theo tháng');
        }
        
        // Sheet 3: Top sản phẩm
        if (window.dashboardStats && window.dashboardStats.top_products) {
            const productsData = [
                ['TOP SẢN PHẨM BÁN CHẠY'],
                [],
                ['STT', 'Tên sản phẩm', 'Số lượng bán']
            ];
            
            window.dashboardStats.top_products.forEach((product, index) => {
                productsData.push([
                    index + 1,
                    product.product_name,
                    product.total_sold
                ]);
            });
            
            const ws3 = XLSX.utils.aoa_to_sheet(productsData);
            ws3['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 15 }];
            ws3['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
            
            XLSX.utils.book_append_sheet(wb, ws3, 'Top sản phẩm');
        }
        
        // Save file
        const fileName = `BaoCao_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        // Restore button
        btn.innerHTML = originalText;
        btn.disabled = false;
        
        // Show success message
        showToast('Đã xuất báo cáo Excel thành công!');
        
    } catch (error) {
        console.error('Error exporting Excel:', error);
        alert('Có lỗi xảy ra khi xuất Excel: ' + error.message);
        
        // Restore button
        const btn = document.querySelector('.btn-export');
        btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Xuất file Excel
        `;
        btn.disabled = false;
    }
}

// Helper function to load external scripts
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Show toast notification
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Format Revenue
function formatRevenue(amount) {
    if (amount >= 1000000000) {
        return (amount / 1000000000).toFixed(1).replace('.', ',') + ' TỶ';
    } else if (amount >= 1000000) {
        return (amount / 1000000).toFixed(0) + ' TRIỆU';
    } else if (amount >= 1000) {
        return (amount / 1000).toFixed(0) + ' NGHÌN';
    } else {
        return amount.toLocaleString('vi-VN');
    }
}
