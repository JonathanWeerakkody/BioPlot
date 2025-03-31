#!/bin/bash

# Build frontend
cd frontend
npm install
npm run build

# Setup backend
cd ../backend
pip install -r requirements.txt

# Start services
python run.py &
cd ../frontend
npx serve -s build -l 3000
