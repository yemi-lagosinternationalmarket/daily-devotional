#!/bin/bash
export OPENAI_API_KEY=8cacc864d2fc34e016c0478186fb6e0d0cada360fbdc3e32901909107d4c40b5
export AI_MODEL=chatgpt/gpt-5.4-pro
exec /root/.hermes/hermes-agent/venv/bin/python /root/daily-devotional/agent/server.py
