const AWS = require('aws-sdk')
const _ = require('lodash');
const q = require('q');
const path = require('path');
const { readFile } = require('fs');
const mime = require('mime')
const fs = require('fs')

require('dotenv').config()

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();

function write(path,file){
    let deferred = q.defer()

    s3.putObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        // process.env.AWS_BUCKET_PATH
        Key: path,
        Body: file,
        // ContentType: mime.getType(file)
    },(err,data)=> {
        deferred.resolve(data||err);
    })
    return deferred.promise;
}

function readFiles(path){
    let deferred = q.defer()
    path = path.replace(process.env.AWS_BUCKET_PATH + '/' ,'')
    s3.getObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: path,
    },(err,data)=>{
        if(!data){
            deferred.resolve(err);
        } else {
            console.log("data from bucket",data)
            deferred.resolve(_.extend(data,{
                path: path
            }))
        }
    })

    return deferred.promise;
}

function read(path){
    let deferred = q.defer()

    readFiles(path).then((data) => {
        if(data.Body){
            var buf = new Buffer(data.Body);
            deferred.resolve(buf.toString());
        } else {
            deferred.resolve(null);
        }
    })

    return deferred.promise;
}


// let s = write(fs.createReadStream(path.join(__dirname,'./demo.jpg')), 'demo.png')

// s.then((data)=> {
//     console.log(data)
// }).catch(err => console.log("error",err))

// let f = readFiles(s)
// f.then((data) => {
//     console.log(data)
// }).catch((err) => {
//     console.log(err)
// })

module.exports = {
    write,
    readFiles, 
    read
}