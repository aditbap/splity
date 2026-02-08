#!/bin/bash
# Source the env file
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

if [ -z "$GOOGLE_GENERATIVE_AI_API_KEY" ]; then
  echo "Error: GOOGLE_GENERATIVE_AI_API_KEY not found in .env.local"
  exit 1
fi

echo "Checking available models for the provided API Key..."
curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=$GOOGLE_GENERATIVE_AI_API_KEY"
