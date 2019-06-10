# B.O.B. Scavenger Hunt - Backend API

## Overview 
This is a set of lambda functions that act as the API/backend to the B.O.B. scavenger hunt app. 

## Requirements
* NodeJS 8 or higher 
* Serverless framework (https://serverless.com/)
* An AWS account with a AWS key and secret attached to a full admin user. That user must be in your ~/.aws/credentials file under the profile "pasley_hill_admin".  
* You also will need a env.yml file provided to you with the proper credentials.

## Once you have all the requirements listed above...
1. Run `npm install` 

## Usage
* Local invocation: `sls invoke local -f <function-name>`
* Remote invocation: `sls invoke -f <function-name>` You will need some options when passing data.