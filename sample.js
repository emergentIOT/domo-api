import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path'; // Import path module for handling file paths

dotenv.config();

// Domo API authentication
const domoAuth = async () => {
  
    const url = 'https://api.domo.com/oauth/token?grant_type=client_credentials';
    const options = {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${process.env.USER_AUTH_TOKEN}`
      }
    };
    
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      console.log(`User Authenticated successful`);
      return data;
    } catch (error) {
      console.error(error);
    }
};

const queryDataset = async (token, datasetId) => {
  const url = `https://api.domo.com/v1/datasets/query/execute/${datasetId}`;

  const options = {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      "Content-Type": "application/json",
      "Accept": "application/json"
    }, 
    body: JSON.stringify({ 'sql': 'select * from table' }) // Stringify the JSON body
  };

  try {
    const response = await fetch(url, options);
    const metadata = await response.json();
    return metadata;
  } catch (error) {
    console.error(`Error while querying dataset: ${error}`);
  }
};

(async () => {
  try {
    const access_token = await domoAuth();
    if (access_token) {
      const metaData = await queryDataset(access_token.access_token, 'SAMPLE DATASET ID');

      const schema = metaData.columns;
      const csvData = metaData.rows;
      console.log(`Received schema and csvData for the requested dataset`);

      const directory = 'C:/Users/asingh52/projects/domo_csv_files'; // Specify the directory path where you want to save the file
      let fileName = path.join(directory, 'dataset.csv'); // Join directory path and filename

      // Check if file already exists
      if (fs.existsSync(fileName)) {
        // Append timestamp to make filename unique
        const timestamp = Date.now();
        const fileParts = fileName.split('.');
        fileName = `${fileParts[0]}_${timestamp}.${fileParts[1]}`;
      }

      // Prepend schema to CSV data
      let csvWithSchema = schema.map(col => `"${col}"`).join(',') + '\n';

      // Iterate over each row and format it as CSV
      for (const row of csvData) {
        const formattedRow = row.map(val => typeof val === 'string' && val.includes(',') ? `"${val}"` : val);
        csvWithSchema += formattedRow.join(',') + '\n';
      }

      // Save CSV data with schema to a file
      fs.writeFileSync(fileName, csvWithSchema);

      console.log('CSV file saved successfully as', fileName);
    }
  } catch (error) {
    console.error(error);
  }
})();
