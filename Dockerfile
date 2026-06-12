# Stage 1: Build the React Frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Setup Python Backend and serve
FROM python:3.10-slim

# Create user with UID 1000 as required by Hugging Face Spaces
RUN useradd -m -u 1000 user

WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy all project files (Python scripts for bots)
COPY . .

# Copy built frontend from Stage 1
# We remove the local frontend folder completely and only copy the dist folder
RUN rm -rf frontend
RUN mkdir -p frontend/dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Change ownership of the app directory to the new user
RUN chown -R user:user /app

# Switch to user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

# Expose Hugging Face default port
EXPOSE 7860

# Set environment variable for FastAPI to use
ENV PORT=7860

# Start the FastAPI server
CMD ["python", "backend/main.py"]
