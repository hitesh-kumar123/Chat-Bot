FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY app /app/app
COPY config.yaml /app/config.yaml

# Models and storage directories (mount at runtime)
RUN mkdir -p /app/models /app/app/storage
VOLUME ["/app/models", "/app/app/storage"]

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]


