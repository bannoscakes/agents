FROM python:3.11-slim

WORKDIR /app

# Copy agent code
COPY ../../python /app/agents

# Install dependencies (add your requirements here)
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# Copy server script
COPY server.py .

# Expose port
EXPOSE 8080

# Run the server
CMD ["python", "server.py"]
