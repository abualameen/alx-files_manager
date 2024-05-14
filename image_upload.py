import base64
import requests
import sys

file_path = sys.argv[1]
file_name = file_path.split('/')[-1]

file_encoded = None
with open(file_path, "rb") as image_file:
    file_encoded = base64.b64encode(image_file.read()).decode('utf-8')

# r_json = { 'name': image.png, 'type': 'image', 'isPublic': True, 'data': file_encoded, 'parentId': sys.argv[3] }
# r_headers = { 'X-Token': sys.argv[2] }
import requests
import json

headers = {'Content-Type': 'application/json'}
payload = {'name': 'image.png', 'type': 'image', 'isPublic': True, 'data': 'base64_encoded_data', 'parentId': 'parent_id'}

response = requests.post('http://0.0.0.0:5000/files', headers=headers, data=json.dumps(payload))


# r = requests.post("http://0.0.0.0:5000/files", json=r_json, headers=r_headers)
# print('rrr', r.text)
print(response.json())
