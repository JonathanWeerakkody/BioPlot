from app import app

# For Vercel deployment
from flask import Flask, request, jsonify, send_file

# Add this for Vercel serverless functions
app.debug = False

# Entry point for Vercel
def handler(request, context):
    return app(request, context)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
