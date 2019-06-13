'use strict';

const fetch           = require("node-fetch");
const GOOGLE_SHEETS   = "https://sheets.googleapis.com/v4/spreadsheets/";
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

async function huntObjects()
{
  const gApiUrl     = googleSheetsUrl("/values/objectives!A:D");
  const gResponse   = await fetch( gApiUrl );
  const gParsed     = await gResponse.json();

  const objectives  = gParsed.values.map((record) => 
  {
    const dataMap     = {};
    dataMap[gParsed.values[0][1]] = record[1];
    dataMap[gParsed.values[0][2]] = record[2];
    dataMap[gParsed.values[0][3]] = record[3];
    return dataMap;
  });
  //remove header row.
  objectives.splice(0,1);
  return objectives;
}

async function hunters()
{
  const gApiUrl     = googleSheetsUrl("/values/Hunters!A:D");
  const gResponse   = await fetch( gApiUrl );
  const gParsed     = await gResponse.json();

  const hunters  = gParsed.values.map((record) => 
  {
    const dataMap     = {};
    dataMap[gParsed.values[0][0]] = record[0];
    dataMap[gParsed.values[0][1]] = record[1];
    dataMap[gParsed.values[0][2]] = record[2];
    return dataMap;
  });
  //remove header row.
  hunters.splice(0,1);
  return hunters;
}

/**
 * Test sls invoke local --f doesHunterExist -l --data '{"body":{"email":"chrishill9@gmail.com"} }'
 */
module.exports.doesHunterExist = async (event, context) =>
{
  const parsedBody = JSON.parse(event.body);
  console.log("DATA SUBMITTED: ",parsedBody);

  const listOfHunters = await hunters();
  console.log("LIST OF HUNTERS: ",JSON.stringify(listOfHunters,null,2));

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

  const objectives = await huntObjects();
  response.body = JSON.stringify(objectives,null,2);
  return response;

};
