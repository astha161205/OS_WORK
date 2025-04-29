document.addEventListener('DOMContentLoaded', () => {
    const processTableBody = document.getElementById('processTableBody');
    const processSearch = document.getElementById('processSearch');
    const ctx = document.getElementById('performanceChart').getContext('2d');
    const resourceLeaders = document.getElementById('resourceLeaders');
    const systemHealth = document.getElementById('systemHealth');
    const performanceTrends = document.getElementById('performanceTrends');
    let allProcesses = [];
    let processHistory = [];
    const maxHistoryLength = 30; // Store 1 minute of history (30 * 2 seconds)
    let currentPage = 1;
    const rowsPerPage = 10;
    let sortKey = 'pid';
    let sortDirection = 1; // 1 ascending, -1 descending

    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;

    themeToggle.addEventListener('click', () => {
        html.classList.toggle('dark');
        localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
    });

    // Set initial theme
    if (localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
    }

    // Initialize data storage
    let processData = [];
    let chartLabels = [];
    let cpuData = [];
    let memoryData = [];
    let topProcessesData = []; // Store top processes for each data point
    const maxDataPoints = 30; // Maximum number of data points to show on the chart

    // Initialize Chart.js
    const performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [
                {
                    label: 'CPU Usage',
                    data: cpuData,
                    borderColor: 'rgb(59, 130, 246)', // Blue-500
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 8,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: 'white',
                    pointHoverBackgroundColor: 'white',
                    pointHoverBorderColor: 'rgb(59, 130, 246)',
                    borderWidth: 3,
                    cubicInterpolationMode: 'monotone'
                },
                {
                    label: 'Memory Usage',
                    data: memoryData,
                    borderColor: 'rgb(16, 185, 129)', // Green-500
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 8,
                    pointBackgroundColor: 'rgb(16, 185, 129)',
                    pointBorderColor: 'white',
                    pointHoverBackgroundColor: 'white',
                    pointHoverBorderColor: 'rgb(16, 185, 129)',
                    borderWidth: 3,
                    cubicInterpolationMode: 'monotone'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            },
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    grid: {
                        display: true,
                        color: 'rgba(200, 200, 200, 0.2)',
                        drawBorder: false,
                        drawTicks: true
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 10,
                        padding: 15,
                        color: 'rgba(100, 100, 100, 0.8)',
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        callback: function(value, index, values) {
                            const date = new Date();
                            return date.toLocaleTimeString();
                        }
                    },
                    title: {
                        display: true,
                        text: 'Time',
                        padding: 15,
                        color: 'rgba(100, 100, 100, 0.8)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        display: true,
                        color: 'rgba(200, 200, 200, 0.2)',
                        drawBorder: false,
                        drawTicks: true
                    },
                    ticks: {
                        stepSize: 20,
                        padding: 15,
                        color: 'rgba(100, 100, 100, 0.8)',
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        callback: value => `${value}%`
                    },
                    title: {
                        display: true,
                        text: 'Resource Usage (%)',
                        padding: 15,
                        color: 'rgba(100, 100, 100, 0.8)',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'center',
                    labels: {
                        padding: 25,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13,
                        weight: 'normal'
                    },
                    padding: 15,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        title: (tooltipItems) => {
                            const date = new Date();
                            return `Time: ${date.toLocaleTimeString()}`;
                        },
                        label: (context) => {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            const index = context.dataIndex;
                            const previousValue = index > 0 ? context.dataset.data[index - 1] : null;
                            const change = previousValue ? ((value - previousValue) / previousValue * 100).toFixed(1) : null;
                            
                            let tooltipText = `${label}: ${value.toFixed(1)}%`;
                            if (change) {
                                const changeSymbol = change > 0 ? '↑' : '↓';
                                tooltipText += ` (${changeSymbol}${Math.abs(change)}%)`;
                            }
                            return tooltipText;
                        },
                        afterBody: (tooltipItems) => {
                            const index = tooltipItems[0].dataIndex;
                            const processes = topProcessesData[index];
                            if (!processes) return [];

                            const cpuProcesses = processes.cpu.slice(0, 3);
                            const memoryProcesses = processes.memory.slice(0, 3);

                            const lines = [
                                '\nTop CPU Processes:',
                                ...cpuProcesses.map(p => `  • ${p.name}: ${p.usage.toFixed(1)}%`),
                                '\nTop Memory Processes:',
                                ...memoryProcesses.map(p => `  • ${p.name}: ${p.usage.toFixed(1)}%`)
                            ];

                            return lines;
                        },
                        footer: (tooltipItems) => {
                            const cpuValue = tooltipItems[0].parsed.y;
                            const memoryValue = tooltipItems[1].parsed.y;
                            const totalLoad = ((cpuValue + memoryValue) / 2).toFixed(1);
                            return `System Load: ${totalLoad}%`;
                        }
                    }
                }
            }
        }
    });

    // Add CSS to make the chart container larger and theme-aware
    const chartContainer = document.getElementById('performanceChart').parentElement;
    chartContainer.style.height = '500px';
    chartContainer.style.width = '100%';
    chartContainer.style.padding = '20px';
    chartContainer.style.borderRadius = '8px';
    chartContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    chartContainer.style.transition = 'background-color 0.3s ease';

    // Update chart theme function
    function updateChartTheme(isDark) {
        const textColor = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(100, 100, 100, 0.8)';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(200, 200, 200, 0.2)';
        const bgColor = isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.8)';
        
        performanceChart.options.scales.x.grid.color = gridColor;
        performanceChart.options.scales.y.grid.color = gridColor;
        performanceChart.options.scales.x.ticks.color = textColor;
        performanceChart.options.scales.y.ticks.color = textColor;
        performanceChart.options.scales.x.title.color = textColor;
        performanceChart.options.scales.y.title.color = textColor;
        
        chartContainer.style.backgroundColor = bgColor;
        
        performanceChart.update('none');
    }

    // Update chart theme when theme changes
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const isDark = document.documentElement.classList.contains('dark');
                updateChartTheme(isDark);
            }
        });
    });

    observer.observe(document.documentElement, {
        attributes: true
    });

    // Initial theme setup
    updateChartTheme(document.documentElement.classList.contains('dark'));

    function filterRelevantProcesses(processes) {
        return processes.filter(process => 
            process.name.toLowerCase() !== 'system idle process' && 
            process.name.toLowerCase() !== 'system'
        );
    }

    // Process table functionality
    function updateProcessTable(processes) {
        const relevantProcesses = filterRelevantProcesses(processes);
        
        if (!relevantProcesses || relevantProcesses.length === 0) {
            processTableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">No processes found</td></tr>';
            return;
        }

        // Sort processes by CPU usage
        relevantProcesses.sort((a, b) => b.cpu_percent - a.cpu_percent);

        processTableBody.innerHTML = '';
        relevantProcesses.forEach(process => {
            const row = document.createElement('tr');
            row.className = 'border-b border-gray-200 dark:border-dark-300 hover:bg-gray-50 dark:hover:bg-dark-300';
            row.innerHTML = `
                <td class="px-4 py-2">${process.pid}</td>
                <td class="px-4 py-2">${process.name}</td>
                <td class="px-4 py-2">${process.cpu_percent.toFixed(1)}%</td>
                <td class="px-4 py-2">${process.memory_percent.toFixed(1)}%</td>
            `;
            processTableBody.appendChild(row);
        });
    }

    function analyzeResourceLeaders(processes) {
        const relevantProcesses = filterRelevantProcesses(processes);
        const topCPU = [...relevantProcesses]
            .sort((a, b) => b.cpu_percent - a.cpu_percent)
            .slice(0, 3);
        const topMemory = [...relevantProcesses]
            .sort((a, b) => b.memory_percent - a.memory_percent)
            .slice(0, 3);
        
        return `
            <div class="mb-2">
                <p class="font-semibold">Top CPU Users:</p>
                ${topCPU.map(p => `<div>${p.name}: ${p.cpu_percent.toFixed(1)}%</div>`).join('')}
            </div>
            <div>
                <p class="font-semibold">Top Memory Users:</p>
                ${topMemory.map(p => `<div>${p.name}: ${p.memory_percent.toFixed(1)}%</div>`).join('')}
            </div>
        `;
    }

    function analyzeSystemHealth(processes) {
        const relevantProcesses = filterRelevantProcesses(processes);
        const totalCPU = relevantProcesses.reduce((sum, p) => sum + p.cpu_percent, 0);
        const totalMemory = relevantProcesses.reduce((sum, p) => sum + p.memory_percent, 0);
        const processCount = relevantProcesses.length;
        
        let status = 'Healthy';
        let recommendations = [];
        
        if (totalCPU > 80) {
            status = 'Critical';
            recommendations.push('High CPU usage detected. Consider closing resource-intensive applications.');
        } else if (totalCPU > 60) {
            status = 'Warning';
            recommendations.push('Moderate CPU load. Monitor system performance.');
        }
        
        if (totalMemory > 80) {
            status = 'Critical';
            recommendations.push('High memory usage. Consider freeing up memory.');
        } else if (totalMemory > 60) {
            status = 'Warning';
            recommendations.push('Memory usage is elevated.');
        }
        
        return `
            <div class="mb-2">
                <p class="font-semibold">System Status: <span class="${
                    status === 'Healthy' ? 'text-green-600 dark:text-green-400' :
                    status === 'Warning' ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                }">${status}</span></p>
                <div>Active CPU: ${totalCPU.toFixed(1)}%</div>
                <div>Active Memory: ${totalMemory.toFixed(1)}%</div>
                <div>Active Processes: ${processCount}</div>
            </div>
            ${recommendations.length > 0 ? `
                <div class="mt-2">
                    <p class="font-semibold">Recommendations:</p>
                    ${recommendations.map(r => `<div class="text-sm">${r}</div>`).join('')}
                </div>
            ` : ''}
        `;
    }

    function analyzePerformanceTrends(processes) {
        // Add current data point to history
        const timestamp = Date.now();
        const totalCPU = processes.reduce((sum, p) => sum + p.cpu_percent, 0);
        const totalMemory = processes.reduce((sum, p) => sum + p.memory_percent, 0);
        
        processHistory.push({ timestamp, totalCPU, totalMemory });
        if (processHistory.length > maxHistoryLength) {
            processHistory.shift();
        }
        
        // Analyze trends
        let cpuTrend = 'stable';
        let memoryTrend = 'stable';
        
        if (processHistory.length > 5) {
            const recentCPU = processHistory.slice(-5).map(h => h.totalCPU);
            const recentMemory = processHistory.slice(-5).map(h => h.totalMemory);
            
            const cpuChange = recentCPU[recentCPU.length - 1] - recentCPU[0];
            const memoryChange = recentMemory[recentMemory.length - 1] - recentMemory[0];
            
            cpuTrend = Math.abs(cpuChange) < 5 ? 'stable' :
                       cpuChange > 0 ? 'increasing' : 'decreasing';
            
            memoryTrend = Math.abs(memoryChange) < 5 ? 'stable' :
                         memoryChange > 0 ? 'increasing' : 'decreasing';
        }
        
        return `
            <div>
                <p class="font-semibold">Current Trends:</p>
                <div>CPU Usage: <span class="${
                    cpuTrend === 'stable' ? 'text-green-600' :
                    cpuTrend === 'increasing' ? 'text-yellow-600' :
                    'text-blue-600'
                }">${cpuTrend}</span></div>
                <div>Memory Usage: <span class="${
                    memoryTrend === 'stable' ? 'text-green-600' :
                    memoryTrend === 'increasing' ? 'text-yellow-600' :
                    'text-blue-600'
                }">${memoryTrend}</span></div>
            </div>
        `;
    }

    // Update chart with enhanced visualization
    function updateChart(processes) {
        const relevantProcesses = filterRelevantProcesses(processes);
        const timestamp = new Date().toLocaleTimeString();
        const totalCpu = relevantProcesses.reduce((sum, p) => sum + p.cpu_percent, 0);
        const totalMemory = relevantProcesses.reduce((sum, p) => sum + p.memory_percent, 0);

        // Get top processes for CPU and Memory
        const topCpuProcesses = [...relevantProcesses]
            .sort((a, b) => b.cpu_percent - a.cpu_percent)
            .slice(0, 5)
            .map(p => ({ name: p.name, usage: p.cpu_percent }));

        const topMemoryProcesses = [...relevantProcesses]
            .sort((a, b) => b.memory_percent - a.memory_percent)
            .slice(0, 5)
            .map(p => ({ name: p.name, usage: p.memory_percent }));

        // Store process data in history
        processHistory.push({
            timestamp: Date.now(),
            totalCPU: totalCpu,
            totalMemory: totalMemory,
            processes: relevantProcesses
        });

        if (processHistory.length > maxHistoryLength) {
            processHistory.shift();
        }

        // Add new data points
        chartLabels.push(timestamp);
        cpuData.push(totalCpu);
        memoryData.push(totalMemory);
        topProcessesData.push({
            cpu: topCpuProcesses,
            memory: topMemoryProcesses
        });

        // Keep only the last maxDataPoints
        if (chartLabels.length > maxDataPoints) {
            chartLabels.shift();
            cpuData.shift();
            memoryData.shift();
            topProcessesData.shift();
        }

        // Update chart
        performanceChart.data.labels = chartLabels;
        performanceChart.data.datasets[0].data = cpuData;
        performanceChart.data.datasets[1].data = memoryData;
        performanceChart.update();
    }

    // Data fetching and updates
    async function fetchData() {
        try {
            const processesResponse = await fetch('http://127.0.0.1:8000/processes');

            if (!processesResponse.ok) {
                throw new Error(`HTTP error! status: ${processesResponse.status}`);
            }

            const processes = await processesResponse.json();
            if (Array.isArray(processes)) {
                processData = processes;
                updateProcessTable(processes);
                updateChart(processes);
                
                // Update AI insights
                resourceLeaders.innerHTML = analyzeResourceLeaders(processes);
                systemHealth.innerHTML = analyzeSystemHealth(processes);
                performanceTrends.innerHTML = analyzePerformanceTrends(processes);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    // Search functionality
    processSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredProcesses = processData.filter(process => 
            process.name.toLowerCase().includes(searchTerm)
        );
        updateProcessTable(filteredProcesses);
    });

    // Initial data fetch and periodic updates
    fetchData();
    const updateInterval = setInterval(fetchData, 2000);

    // Cleanup on page unload
    window.addEventListener('unload', () => {
        clearInterval(updateInterval);
    });
});
