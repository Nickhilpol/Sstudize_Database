import os
import sys
import subprocess
import time
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

def main():
    print("=" * 70)
    print("   SStudizer Database Management System - Platform Service Runner")
    print("   Website: https://sstudize.co.in/")
    print("=" * 70)
    print("[1/2] Launching Python FastAPI Backend on http://127.0.0.1:8000...")
    
    # Set PYTHONPATH to include backend
    env = os.environ.copy()
    env["PYTHONPATH"] = str(BACKEND_DIR)

    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=str(BACKEND_DIR),
        env=env
    )

    time.sleep(1.5)

    print("[2/2] Launching Node.js Vite UI on http://localhost:5173...")
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=str(FRONTEND_DIR),
        shell=True
    )

    print("\n" + "=" * 70)
    print("   SERVICES RUNNING SUCCESSFULLY:")
    print("   - Web UI Dashboard:  http://localhost:5173")
    print("   - Backend REST API:  http://127.0.0.1:8000/api")
    print("   - API Documentation: http://127.0.0.1:8000/api/docs")
    print("=" * 70)
    print("Press Ctrl+C to stop all services.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down services...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("All processes stopped.")

if __name__ == "__main__":
    main()
