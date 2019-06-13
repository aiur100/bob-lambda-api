'use strict';
const AWS       = require('aws-sdk');
const s3        = new AWS.S3();
const bucket    = process.env.bob_bucket;
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

module.exports.huntMediaUploadUrl = async (event, context) => 
{

    console.log("Request for media upload url received",JSON.stringify(event));

    const fileName = event.queryStringParameters.fileName;
    const fileType = event.queryStringParameters.fileType;

    console.log("FileName: ",fileName,"FileType: ",fileType);

    s3.getSignedUrl('putObject', {
        Bucket: bucket, // your bucket name,
        Key: fileName, // path to the object you're looking for
        ContentType: fileType,
        ACL: "public-read"
    }, function (err, url) {

        if(err){
            const errorMessage = JSON.stringify(err,null,2);
            console.error("Error requesting signed URL",errorMessage);
            response.body = errorMessage;
            response.statusCode = 500;
            return response;
        }
        else{
            response.body = url;
            const message = JSON.stringify(url,null,2);
            console.log("Signed URL successfully created",message);
            return response;
        }
    });

    return response;

};