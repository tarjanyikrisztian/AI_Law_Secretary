import os
from dotenv import dotenv_values

# Install required Python packages in the Server folder
os.chdir("Server")
os.system('pip install -r requirements.txt')

# Create or update .env file with base fields in the Server folder
base_env = {
    "OPENAI_API_KEY": "",
    "SERPAPI_API_KEY": "",
    "OPENAI_MODEL": "'gpt-4o'",
    "DOCS_PATH": "./documents/",
}

existing_env = dotenv_values(".env")  # Load existing .env file if it exists
base_env.update(existing_env)

with open(".env", "w") as f:
    for key, value in base_env.items():
        f.write(f"{key}={value}\n")

# Navigate to the Client folder and run "npm install"
os.chdir("../Client")
os.system('npm install')