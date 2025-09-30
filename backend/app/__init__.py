import os

# Ensure storage directory exists at import time
STORAGE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'storage'))
os.makedirs(STORAGE, exist_ok=True)


