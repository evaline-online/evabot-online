"""EvaBot Online Backend — launcher.

Usage:
    python run.py            # start uvicorn on HOST:PORT from .env
"""

from app.main import start

if __name__ == "__main__":
    start()
