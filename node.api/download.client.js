function fetchData(basicAuth, startDate, endDate) {
    // Define the API endpoint for exporting records
    var apiEndpoint = 'api/xxx';
    var pathParams =
      'startDate=' +
      encodeURIComponent(startDate) +
      '&' +
      'endDate=' +
      encodeURIComponent(endDate);
    var apiFullPath = apiEndpoint + '?' + pathParams;
    var data = {
      reportApiBasicAuth: basicAuth,
    };
  
    // Make the API call
    fetch(apiFullPath, {
      method: 'POST', // or 'POST' if required
      headers: {
        // 'Authorization': 'Basic ' + btoa(basicAuth), // Add your basic auth header here
        'Content-Type': 'application/json', // Adjust if necessary
      },
      body: JSON.stringify(data),
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.blob(); // Assuming the response is a file
      })
      .then(
        function (blob) {
          // Create a link element to download the file
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'report_data.csv'; // Set the file name
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href); // Clean up the object URL
        },
        function (error) {
          console.error(
            'There has been a problem with your fetch operation:',
            error
          );
        }
      );
  }
  