'use strict';

const fetch           = require("node-fetch");
const GoogleSpreadSheet = require("google-spreadsheet");
const { promisify }     = require("util");
const creds             = require('./client_secret.json');
const GOOGLE_SHEETS     = "https://sheets.googleapis.com/v4/spreadsheets/";
const SHEETS_KEY      = process.env.google_sheets_id;
const GOOGLE_API_KEY  = process.env.google_api_key;
const APP_CORS_HEADER = {
  "Content-Type" : "text/plain",
  "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
  "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
};
const response = {
  statusCode: 200,
  headers: APP_CORS_HEADER,
  body: ""
};

function googleSheetsUrl(endpoint="",queryParams=[])
{
    let baseUrl = GOOGLE_SHEETS+SHEETS_KEY+endpoint+"?key="+GOOGLE_API_KEY;
    if(queryParams.length > 0){
        return queryParams.reduce((finalUrl,currentQuery) => {
            return finalUrl + "&" + currentQuery;
        },baseUrl);
    }
    else
    {
      return GOOGLE_SHEETS+SHEETS_KEY+endpoint+"?key="+GOOGLE_API_KEY+"&valueRenderOption=FORMATTED_VALUE";
    }
}

function huntObjects(rows)
{
  //console.log(rows[0].nameofobjective);
    return rows.map( currentRow => {
      return {
        name: currentRow.nameofobjective,
        description: currentRow.descriptionofobjective
      };
    });
}

function hunters(rows)
{
  
  return rows.map( currentRow => {
    return {
      name: currentRow.name,
      email: currentRow.email,
      team: currentRow.team
    };
  });
}

/**
 * Test sls invoke local --f doesHunterExist -l --data '{"body":{"email":"chrishill9@gmail.com"} }'
 */
module.exports.doesHunterExist = async (event, context) =>
{
  const parsedBody = JSON.parse(event.body);
  console.log("DATA SUBMITTED: ",parsedBody);

  const doc = new GoogleSpreadSheet(SHEETS_KEY);
  await promisify(doc.useServiceAccountAuth)(creds);
  const info  = await promisify(doc.getInfo)();
  const sheet = info.worksheets[1];
  const rows  = await promisify(sheet.getRows)({
    offset: 1
  });
  const listOfHunters = hunters(rows);
  let result        = { exists: false };
  response.statusCode = 404;

  while(listOfHunters.length > 0)
  {
    let user = listOfHunters.pop();
    if(user.email === parsedBody.email)
    {
      result.exists = true;
      result = {...result,...user};
      response.statusCode = 200;
      break;
    } 
  }

  response.body = JSON.stringify(result);
  return response;
}

module.exports.addHuntSubmission = async (event,context) => 
{

  const dataSample = {
    "range": "Sheet1!A1:E1",
    "majorDimension": "ROWS",
    "values": [
      ["Door", "$15", "2", "3/15/2016"],
      ["Engine", "$100", "1", "3/20/2016"],
    ],
  };

  let url = googleSheetsUrl("/values/submissions!A1:E1:append");

  console.log(url);

  const gResponse   = await fetch( url, { method: "POST", body: JSON.stringify(dataSample) } );
  const gParsed     = await gResponse.json();

  console.log(gParsed);

}

module.exports.huntObjectives = async (event, context) => 
{

  const doc = new GoogleSpreadSheet(SHEETS_KEY);
  await promisify(doc.useServiceAccountAuth)(creds);
  const info  = await promisify(doc.getInfo)();
  console.log("WORKSHEETS: ",JSON.stringify(info.worksheets,null,2));
  const sheet = info.worksheets[0];
  const rows  = await promisify(sheet.getRows)({
    offset: 1
  });
  response.body = JSON.stringify(huntObjects(rows));
 return response;

};
