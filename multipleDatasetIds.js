import fetch from 'node-fetch';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

/**
 * IMPROVEMNTS & TODO
 * LINE 33: UPDATE USER_AUTH_TOKEN TO RECEIVE FROM .txt FILE OR ENV VARIABLES
 * LINE 106: Update multiple datasetIds to received from text file.
 * LINE 126: Update csv file name with datasetName (easy to identify)
 */

/**
 * Authenticate DOMO api using client credentials, https://developer.domo.com/portal/d9520f5752d56-get-access-token.
 * @returns 
 *  SAMPLE RESPONSE
    "access_token": "eyzadkjhapoajsk",
    "role": null,
    "domain": "sydneytrains.domo.com",
    "scope": "data workflow audit buzz user account dashboard",
    "token_type": "Bearer",
    "env": "prod8",
    "expires_in": 3599,
    "userId": USER ID,
    "customer": "transport-nsw-gov-au"
 */
const domoAuth = async () => {
    const url = 'https://api.domo.com/oauth/token?grant_type=client_credentials';
    const options = {
        method: 'GET',
        headers: {
            Accept: 'application/json',
            //TODO: UPDATE USER_AUTH_TOKEN TO RECEIVE FROM .txt FILE OR ENV VARIABLES
            Authorization: `Basic ${process.env.USER_AUTH_TOKEN}`
        }
    };

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        if (data) {
            console.log(`User Authenticated successful`);
        } else {
            console.log(`No token received from DOMO`);
        }
        return data;
    } catch (error) {
        console.error(error);
    }
};

/**
 * Query a datasetId, https://developer.domo.com/portal/52fd0777839f4-query-a-data-set.
 * @param {ACCESS_TOKEN} token 
 * @param {DATASET_ID} datasetIds 
 * 
 * @returns {
 * datasourse: DATASET_ID,
 * colums: [ COLUMN_NAME ],
 * metadata: [ MEATADATA ],
 * rows: [ ROWS_WITH_DATA ]
 * }
 * 
 */
const queryDataset = async (token, datasetId) => {
  console.log(`querrying dataset for datasetId: ${datasetId}`);
    const url = `https://api.domo.com/v1/datasets/query/execute/${datasetId}`;
    const queries = {
       sql: 'select * from table'
    };

    const options = {
        method: 'POST',
        headers: {
            Authorization: 'Bearer ' + token,
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({ 'sql': 'select * from table' })
    };

    try {
        const response = await fetch(url, options);
        const metadata = await response.json();
        if(metadata) {
          console.log(`Received dataset data, processing your data in csv...`);
          return metadata;
        }
        
    } catch (error) {
        console.error(`Error while querying dataset: ${error}`);
    }
};

/**
 * Multiple calls to get data from multiple datasetIds.
 * Returns multiple csv, based on number of datasetIds mentioned.
 * TODO: Find better way to implement.
 */
(async () => {
  try {
      const access_token = await domoAuth();
      if (access_token) {
        //TODO: update it to received from text file.
          let datasetIds = ['PASET', 'YOUR', 'SAMPLE', 'MULTIPLE IDS HERE'];
          
          // Ensure datasetIds is an array
          if (!Array.isArray(datasetIds)) {
              console.error('datasetIds is not an array');
              return;
          }
          
          //Iterating over multiple datasetids, to process REST api call and appending data in csv.
          for (let i = 0; i < datasetIds.length; i++) {
              const datasetId = datasetIds[i];
              const metaData = await queryDataset(access_token.access_token, datasetId);

              if (metaData.status === 404) {
                  console.error(`Error: ${metaData.statusReason} - ${metaData.message}`);
                  continue;
              }
              //Directory to mentioned where csv will stored.
              //TODO: Update csv file name with datasetName (easy to identify)
              const directory = 'C:/Users/asingh52/projects/domo_csv_files';
              const fileName = path.join(directory, `dataset_${i+1}.csv`);

              const schema = metaData.columns;
              const csvData = metaData.rows;
              console.log(`Received schema and csvData for dataset ID: ${datasetId}`);

              // Write schema to CSV file
              let csvWithSchema = schema.map(col => `"${col}"`).join(',') + '\n';
              fs.writeFileSync(fileName, csvWithSchema);

              // Append rows to the CSV file
              for (const row of csvData) {
                  const formattedRow = row.map(val => typeof val === 'string' && val.includes(',') ? `"${val}"` : val);
                  const rowToAppend = formattedRow.join(',') + '\n';
                  fs.appendFileSync(fileName, rowToAppend);
              }

              console.log(`CSV file saved successfully at ${fileName}`);
          }
      }
  } catch (error) {
      console.error(error);
  }
})();



