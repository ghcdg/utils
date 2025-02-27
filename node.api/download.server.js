function returnReportData(reportHeaderColumnNameList, reportDataMatrix) {
    // get api query info sample
    // var pathParams = request.pathParams;
    // var paramSystemId = pathParams.paramName;
  
    var httpHeader = {};
    httpHeader['Content-Type'] = 'text/csv; charset=utf-8';
    var reportFilename = dateFormat('YYYY-mm-dd', new Date()) + '.csv';
    httpHeader['Content-Disposition'] =
      'attachment; filename=' + '"' + reportFilename + '"';
    response.setHeaders(httpHeader);
    response.setStatus(200);
    var reportData = reportHeaderColumnNameList + reportDataMatrix;
  
    var writer = response.getStreamWriter();
    // write BOM for utf-8 data set, so that the editor can decode it correctly
    writer.writeString('\uFEFF');
    writer.writeString(reportData);
  }
  