import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import { pipeline } from 'stream/promises';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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
      console.log("data", data);
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


const listDataset = async (token, datasetId) => {
  const url = `https://api.domo.com/v1/datasets/${datasetId}/data`;
  const options = {
      method: 'GET',
      headers: {
          Accept: 'text/csv',
          Authorization: 'Bearer ' + token
      }
  };

  try {
      const response = await fetch(url, options);
      const csvData = await response.text();

      //TODO: api call to get schema, and map that schema to below variable.
      // Define your schema and columns here
      const schema = ['Filename', 'Month name', 'COntract number', 'score card frequency'];
      const columns = ['id', 'name', 'age'];

      let fileName = 'dataset.csv';

      // Check if file already exists
      if (fs.existsSync(fileName)) {
          // Append timestamp to make filename unique
          const timestamp = Date.now();
          const fileParts = fileName.split('.');
          fileName = `${fileParts[0]}_${timestamp}.${fileParts[1]}`;
      }

      // Prepend schema to CSV data
      const csvWithSchema = `${schema.join(',')}\n${csvData}`;

      // Save CSV data with schema to a file
      fs.writeFileSync(fileName, csvWithSchema);
      //fs.writeFileSync(fileName, csvData);

      console.log('CSV file saved successfully as', fileName);
      return fileName;
  } catch (error) {
      console.error(error);
  }
};

app.get('/me', async (req, res) => {
  try {
    const access_token = await domoAuth();
    if (access_token) {
      const metaData = await queryDataset(access_token.access_token, 'SAMPLE DATASET ID');

      const schema = metaData.columns;
      const csvData = metaData.rows;
      console.log(`Received shcema and csvData for the requested dataset`);

      let fileName = 'dataset.csv';

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
    res.json({ message: access_token });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});







app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
