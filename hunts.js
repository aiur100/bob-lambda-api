'use strict';

const GoogleSpreadSheet = require("google-spreadsheet");
const { promisify }     = require("util");
const creds             = require('./client_secret.json');
const SHEETS_KEY        = process.env.google_sheets_id;
const APP_CORS_HEADER   = {
  "Content-Type" : "text/plain",
  "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
  "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS
};
const response = {
  statusCode: 200,
  headers: APP_CORS_HEADER,
  body: ""
};

function shuffle(items)
{
  let start = items.length - 1;  
  for(let i = start; i > 0; i--)
  {
    const j = Math.floor(Math.random() * i)
    const temp = items[i]
    items[i] = items[j];
    items[j] = temp;
  }
  return items;
}

function huntObjects(rows)
{
  //console.log(rows[0].nameofobjective);
    return shuffle(rows.map( currentRow => {
      return {
        name: currentRow.nameofobjective,
        description: currentRow.descriptionofobjective,
        media: currentRow.mediatype,
        show: currentRow.show
      };
    }));
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
    if(user.email.toLowerCase().trim() === parsedBody.email.toLowerCase().trim())
    {
      result.exists = true;
      result = {...result,...user};
      response.statusCode = 200;
      break;
    } 
  }

  response.body = JSON.stringify(result);
  console.log("RESPONSE SENT TO USER: ",response);
  return response;
}

/**
 * sls invoke local --f addHuntSubmission -l --data '{"body":{\email"\:\"chrishill9@gmail.com\"} }'
 */
module.exports.addHuntSubmission = async (event,context) => 
{

  const parsedBody = JSON.parse(event.body);
  console.log("DATA SUBMITTED: ",parsedBody);

  const doc = new GoogleSpreadSheet(SHEETS_KEY);
  await promisify(doc.useServiceAccountAuth)(creds);
  const info  = await promisify(doc.getInfo)();
  const sheet = info.worksheets[2];

  
  const submissionRows  = await promisify(sheet.getRows)({
    query: `team = "${parsedBody.team}"`
  });
  submissionRows.forEach(aSubmission => {
    console.log(`PREVIOUS SUBMISSION:`,aSubmission.objectivename,'CURRENT SUBMISSION:',parsedBody.objectivename);
    if(aSubmission.objectivename.trim() === parsedBody.objectivename.trim())
    {
      console.log("DUPLICATE FOUND: \n",aSubmission);
      aSubmission.del();
    }    
  });

  await promisify(sheet.addRow)(parsedBody);
  response.body = JSON.stringify({status:"success"});
  return response;

}

/**
 * Test this with ... 
 * sls invoke local -f huntObjectives -l --data '{"queryStringParameters":{"team":"A"}}'
 */
module.exports.huntObjectives = async (event, context) => 
{

  const team = event.queryStringParameters.team.trim();
  console.log("REQUEST RECEIVED FOR TEAM:",team);

  const doc = new GoogleSpreadSheet(SHEETS_KEY);
  await promisify(doc.useServiceAccountAuth)(creds);
  const info  = await promisify(doc.getInfo)();
  //console.log("WORKSHEETS: ",JSON.stringify(info.worksheets,null,2));
  const objectiveSheet = info.worksheets[0];
  const objectiveRows  = await promisify(objectiveSheet.getRows)({
    offset: 1,
    query: `show = TRUE`
  });
  const submissionsSheet = info.worksheets[2];
  const submissionRows  = await promisify(submissionsSheet.getRows)({
    query: `team = "${team}"`
  });
  const submissions = submissionRows.map(aSubmission => {
        return {
            name: aSubmission.objectivename,
            team: aSubmission.team,
            media: aSubmission.media
        };
  });

  console.log("SUBMISSIONS BY TEAM: ",submissions);

  response.body = JSON.stringify({
    objectives: huntObjects(objectiveRows),
    submitted: submissions
  });
 return response;

};
