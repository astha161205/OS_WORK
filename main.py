from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import psutil
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
import sqlite3
from datetime import datetime
import json
from typing import List, Dict
import numpy as np
import os

app = FastAPI(title="Process Analyzer API")

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=["*"]
)

# Mount static files
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "frontend")), name="static")

# Get the absolute path for the database
DB_PATH = os.path.join(BASE_DIR, 'data', 'process_data.db')

# Initialize SQLite database
def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS process_history
                 (timestamp TEXT, pid INTEGER, name TEXT, cpu_percent REAL, 
                  memory_percent REAL, io_read_count INTEGER, io_write_count INTEGER)''')
    c.execute('''CREATE TABLE IF NOT EXISTS alerts
                 (timestamp TEXT, process_name TEXT, alert_type TEXT, 
                  alert_message TEXT, severity TEXT)''')
    conn.commit()
    conn.close()

init_db()

# Initialize ML models
def init_models():
    # Load historical data for training
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql_query("SELECT * FROM process_history", conn)
    conn.close()
    
    if len(df) > 0:
        # Prepare features for clustering
        features = df[['cpu_percent', 'memory_percent']].values
        kmeans = KMeans(n_clusters=3)
        kmeans.fit(features)
        
        # Prepare features for classification
        X = df[['cpu_percent', 'memory_percent', 'io_read_count', 'io_write_count']]
        y = (df['cpu_percent'] > 80) | (df['memory_percent'] > 80)  # Binary classification
        rf = RandomForestClassifier()
        rf.fit(X, y)
        
        return kmeans, rf
    return None, None

kmeans_model, rf_model = init_models()

@app.get("/")
async def read_root():
    return {"message": "Welcome to AI-Powered Performance Analyzer"}

@app.get("/processes")
async def get_processes():
    try:
        processes = []
        # Update CPU times for all processes
        psutil.cpu_percent(interval=None, percpu=True)
        
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent', 'io_counters']):
            try:
                process_info = proc.info
                cpu_percent = process_info['cpu_percent'] or 0.0
                memory_percent = process_info['memory_percent'] or 0.0
                
                if process_info['io_counters']:
                    io_read = process_info['io_counters'].read_count
                    io_write = process_info['io_counters'].write_count
                else:
                    io_read = io_write = 0
                    
                process_data = {
                    'pid': process_info['pid'],
                    'name': process_info['name'],
                    'cpu_percent': float(cpu_percent),
                    'memory_percent': float(memory_percent),
                    'io_read_count': io_read,
                    'io_write_count': io_write
                }
                
                # Store in database
                conn = sqlite3.connect(DB_PATH)
                c = conn.cursor()
                c.execute('''INSERT INTO process_history 
                            (timestamp, pid, name, cpu_percent, memory_percent, io_read_count, io_write_count)
                            VALUES (?, ?, ?, ?, ?, ?, ?)''',
                         (datetime.now().isoformat(), process_info['pid'], process_info['name'],
                          cpu_percent, memory_percent, io_read, io_write))
                conn.commit()
                conn.close()
                
                processes.append(process_data)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
            except Exception as e:
                print(f"Error processing {process_info['pid'] if 'pid' in process_info else 'unknown'}: {str(e)}")
                continue
                
        return processes
    except Exception as e:
        print(f"Error in get_processes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/alerts")
async def get_alerts():
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 10")
        alerts = [dict(zip(['timestamp', 'process_name', 'alert_type', 'alert_message', 'severity'], row))
                 for row in c.fetchall()]
        conn.close()
        return alerts
    except Exception as e:
        print(f"Error in get_alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history")
async def get_history(limit: int = 100):
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT * FROM process_history ORDER BY timestamp DESC LIMIT ?", (limit,))
        history = [dict(zip(['timestamp', 'pid', 'name', 'cpu_percent', 'memory_percent',
                            'io_read_count', 'io_write_count'], row))
                  for row in c.fetchall()]
        conn.close()
        return JSONResponse(content=history)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 