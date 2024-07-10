#!/bin/bash

# Run yarn export
echo "Running yarn export..."
yarn export

# Check if yarn export was successful
if [ $? -eq 0 ]; then
    echo "yarn export completed successfully."
    
    # Create zip file
    echo "Creating zip file..."
    # Change to the "out" directory
    cd out

    # Create zip file
    echo "Creating zip file..."
    zip -r ../brclient-web.zip *

    # Change back to the parent directory
    cd ..
    
    # Check if zip was successful
    if [ $? -eq 0 ]; then
        echo "Zip file created successfully: brclient-web.zip"
    else
        echo "Error: Failed to create zip file."
        exit 1
    fi
else
    echo "Error: yarn export failed."
    exit 1
fi

echo "Script completed."

