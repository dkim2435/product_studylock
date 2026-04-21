FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

RUN useradd --create-home --uid 10001 appuser && chown -R appuser /app
USER appuser

CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
