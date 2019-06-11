'use strict';

const fetch           = require("node-fetch");
const GOOGLE_SHEETS   = "https://sheets.googleapis.com/v4/spreadsheets/";
const SHEETS_KEY      = process.env.google_sheets_id;
const GOOGLE_API_KEY  = process.env.google_api_key;
const response = {
  statusCode: 200,
  body: ""
};

function googleSheetsUrl(endpoint="")
{
    return GOOGLE_SHEETS+SHEETS_KEY+endpoint+"?key="+GOOGLE_API_KEY+"&valueRenderOption=FORMATTED_VALUE";
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

module.exports.huntObjectives = async (event, context) => 
{

  response.message = await huntObjects();
  return response;

};
