import os
import sys

# Ensure backend directory is in Python path for module resolution
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, "..", "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# On Vercel Serverless environment, filesystem is read-only except for /tmp
if os.environ.get("VERCEL"):
    os.environ["PROMPTSHIELD_DB_PATH"] = "/tmp/promptshield.db"

from app.main import app
