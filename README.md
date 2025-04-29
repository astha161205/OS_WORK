# System Monitor Dashboard

A real-time system monitoring dashboard that provides detailed insights into system performance, process management, and resource utilization.

## Features

- **Real-time Performance Monitoring**
  - Interactive line chart showing CPU and Memory usage
  - Process-specific resource consumption tracking
  - Historical performance data visualization
  - Top process identification for CPU and Memory usage

- **Process Management**
  - Detailed process table with sorting and filtering
  - Real-time process updates
  - Process search functionality
  - Resource usage tracking per process

- **System Insights**
  - Resource leaders identification
  - System health analysis
  - Performance trend analysis
  - Process anomaly detection

- **User Interface**
  - Responsive design
  - Dark/Light theme support
  - Interactive charts and tables
  - Real-time data updates

## Technical Details

### Frontend
- Built with HTML, CSS, and JavaScript
- Uses Chart.js for performance visualization
- Responsive design with Tailwind CSS
- Real-time data updates every 2 seconds

### Backend
- Python-based server
- Process monitoring and analysis
- RESTful API endpoints
- Real-time data processing

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd system-monitor
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Start the server:
```bash
python server.py
```

4. Open the dashboard in your browser:
```
http://localhost:8000
```

## Usage

1. **Performance Monitoring**
   - View real-time CPU and Memory usage in the interactive chart
   - Hover over data points to see detailed process information
   - Track performance trends over time

2. **Process Management**
   - View all running processes in the process table
   - Sort processes by different metrics
   - Search for specific processes
   - Monitor individual process resource usage

3. **System Insights**
   - View top resource-consuming processes
   - Monitor system health status
   - Track performance trends
   - Identify potential system issues

## Theme Support

The dashboard supports both light and dark themes:
- Automatic theme detection based on system preferences
- Manual theme toggle available
- Theme preference is saved in local storage

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
