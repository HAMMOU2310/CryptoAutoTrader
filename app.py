from flask import Flask
import os

app = Flask(__name__)

@app.route('/')
def home():
    return "✅ Crypto Auto Trader is Running!"
