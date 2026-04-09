import requests

# Auto-generated code using the requests library
# Operation: invokeaction on "toggle"

url = "https://mylamp.example.com/toggle"

# TODO: Set the action input parameters
payload = {}

response = requests.post(url, json=payload)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")