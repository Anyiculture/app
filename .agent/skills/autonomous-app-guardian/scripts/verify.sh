# Verification Script for Autonomous App Guardian
# This script runs basic checks before deployment.

echo "Running Autonomous App Guardian Verification..."

# 1. Type Check
echo "Checking types..."
npm run typecheck
if [ $? -ne 0 ]; then
    echo "ERROR: Type check failed."
    exit 1
fi

# 2. Build Check
echo "Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo "ERROR: Build failed."
    exit 1
fi

echo "Verification SUCCESS."
exit 0
