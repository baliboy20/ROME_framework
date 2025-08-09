#!/bin/bash

# Load environment variables from .env file
export $(cat .env | grep -v '^#' | xargs)

# Change to backend directory and run the ingestion command
cd backend && npm run ingest-docs -- "$@"