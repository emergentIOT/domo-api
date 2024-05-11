from flask import Flask, jsonify
import requests
import os
import csv
from datetime import datetime

app = Flask(__name__)

@app.route('/me')
def get_data():
    try:
        access_token = domo_auth()
        if access_token:
            metadata = query_dataset(access_token['access_token'], '9372383f-d9a9-4a57-a2ee-5383793f80f4')
            schema = metadata['columns']
            csv_data = metadata['rows']
            print('Received schema and csvData for the requested dataset')

            file_name = 'dataset.csv'
            if os.path.exists(file_name):
                timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
                file_parts = file_name.split('.')
                file_name = f"{file_parts[0]}_{timestamp}.{file_parts[1]}"

            with open(file_name, 'w', newline='') as csvfile:
                writer = csv.writer(csvfile)
                writer.writerow(schema)
                for row in csv_data:
                    writer.writerow(row)

            print('CSV file saved successfully as', file_name)
    except Exception as e:
        return jsonify({'error': 'Internal Server Error'}), 500

    return jsonify({'message': access_token})

def domo_auth():
    url = 'https://api.domo.com/oauth/token?grant_type=client_credentials'
    headers = {
        'Accept': 'application/json',
        'Authorization': f'Basic {os.environ["USER_AUTH_TOKEN"]}'
    }
    
    try:
        response = requests.get(url, headers=headers)
        data = response.json()
        print("data", data)
        return data
    except Exception as e:
        print(e)

def query_dataset(token, dataset_id):
    url = f'https://api.domo.com/v1/datasets/query/execute/{dataset_id}'
    headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    payload = {
        'sql': 'select * from table'
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        metadata = response.json()
        return metadata
    except Exception as e:
        print(f'Error while querying dataset: {e}')

if __name__ == '__main__':
    app.run(port=3000)
