
// const listDataset = async (token, datasetId) => {
//     const url = `https://api.domo.com/v1/datasets/${datasetId}/data`;
//     const options = {
//         method: 'GET',
//         headers: {
//             Accept: 'text/csv',
//             Authorization: 'Bearer ' + token
//         }
//     };

//     const timestamp = new Date().toISOString().replace(/:/g, '-');
//     const fileName = `dataset_${timestamp}.csv`;

//     try {
//         const response = await fetch(url, options);
       

//         if (!response.ok) {
//             throw new Error(`Failed to fetch data: ${response.statusText}`);
//         }

//         // Create a writable stream to write data to the file
//         const fileStream = fs.createWriteStream(fileName);
        
//         // Pipe the response body stream to the file stream
//         await pipeline(response.body, fileStream);

//         console.log('CSV file saved successfully as', fileName);
//         return fileName;
//     } catch (error) {
//         console.error(error);
//     }
// };



// Example protected route


function downloadCSV(csvData, fileName) {
    // Create Blob
    const blob = new Blob([csvData], { type: 'text/csv' });
    
    // Create URL
    const url = window.URL.createObjectURL(blob);
    
    // Create anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    
    // Append anchor element to body
    document.body.appendChild(a);
    
    // Click anchor element to trigger download
    a.click();
    
    // Remove anchor element from body
    document.body.removeChild(a);
    
    // Revoke URL
    window.URL.revokeObjectURL(url);
  }

  
// List dataset
const queryDataset = async (token) => {
  
  const url = 'https://api.domo.com/v1/datasets/query/execute/6e30f7b6-e6b8-403c-b96e-6779071c8c57';
  const bodyData = {
      sql : 'select * from table'
    };
  const options = {
    method: 'POST',
    headers: {
      "Authorization": "bearer " + token,
      "Content-Type": "application/json",
      "Accept": "application/json"
  
       // 'x-domo-authentication': token,
    },
    body: JSON.stringify(bodyData)
  };
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log("Query dataset", data);
    return data;
  } catch (error) {
    console.error(error);
  }
};


app.post('/query', async(req, res) => {
  try {
      const access_token = await domoAuth();
      const q = await queryDataset(access_token.access_token);
      console.log("q", q);
      res.json({ message: `Query dataset Domo API successfully: ${q}` });
  } catch(error) {
      res.status(500).json({error: `Error at : ${error}`})
  }
})

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

      // Define your schema and columns here
      /*const schema = ['ID', 'Name', 'Age'];
      const columns = ['id', 'name', 'age'];*/

      let fileName = 'dataset.csv';

      // Check if file already exists
      if (fs.existsSync(fileName)) {
          // Append timestamp to make filename unique
          const timestamp = Date.now();
          const fileParts = fileName.split('.');
          fileName = `${fileParts[0]}_${timestamp}.${fileParts[1]}`;
      }

      // Prepend schema to CSV data
      //const csvWithSchema = `${schema.join(',')}\n${csvData}`;

      // Save CSV data with schema to a file
      //fs.writeFileSync(fileName, csvWithSchema);
      fs.writeFileSync(fileName, csvData);

      console.log('CSV file saved successfully as', fileName);
      return fileName;
  } catch (error) {
      console.error(error);
  }
};

// Example protected route
app.get('/list/:datasetId', async (req, res) => {
  try {
    const access_token = await domoAuth();
    const datasetId = req.params.datasetId;
    const list = await listDataset(access_token.access_token, datasetId);
    console.log("list", list);
   // const data = await accessToken.json();
    // Make authenticated request to Domo API here using accessToken
    res.json({ success: true, datasets: list });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//Query a dataset
app.post('/quey/:datasetId', async (req, res) => {
  try {
    const access_token = await domoAuth();
    const datasetId = req.params.datasetId;
    const queryList = await queryDataset(access_token.access_token, datasetId);
    
    res.json({ success: true, datasets: queryList })
  } catch (error) {

  }
});
