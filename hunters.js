'use strict';
const AWS       = require('aws-sdk');
const s3        = new AWS.S3();
const bucket    = process.env.bob_bucket;
const response  = {
    statusCode: 200,
    body: ""
  };

module.exports.huntMediaUploadUrl = async (event, context) => 
{
 
    console.log("BUCKET: ",bucket);

    s3.getSignedUrl('putObject', {
        Bucket: bucket, // your bucket name,
        Key: 'test.json', // path to the object you're looking for
        ACL: "public-read"
    }, function (err, url) {

        if(err){
            const errorMessage = JSON.stringify(err,null,2);
            console.error(errorMessage);
            response.body = errorMessage;
            response.statusCode = 500;
            return response;
        }
        else{
            response.body = url;
            const message = JSON.stringify(url,null,2);
            console.log(message);
            return response;
        }
    });

    return response;

};