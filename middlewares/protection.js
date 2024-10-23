const User = require('../models').User;
require('dotenv').config()
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const sharp = require('sharp');
const s3Storage = require('multer-sharp-s3');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();


const authenticate_user = (req,res,next) => {
    if( req.session && req.session.user ){
        next()
    } else {
        return res.status(402).json({
            message: "user is not authenticated"
        })
    }
};

const token_authenticate_user = async (req,res,next) => {
    let token;
    if(req?.headers?.authorization?.startsWith('Bearer')){
        try{
            token = req.headers.authorization.split(" ")[1]
            
            const decoded = jwt.verify(token,process.env.SECRET_KEY)
            if(!decoded) throw new Error("invalid token")
            req.user = await User.findOne({
                where:{
                    id: decoded.id
                }
            })
            next()
        } catch(err){
            res.sendStatus(500)
            throw new Error(err)
        }
    } else {
        res.sendStatus(500)
        throw new Error("no token in headers")
    }
}


const socketAuthToken = async(socket,next) => {
    let token = socket.handshake.auth.token;
    if (token){
        const decoded = jwt.verify(token,process.env.SECRET_KEY)
        if(!decoded) next(new Error("invalid token from verify process (jwt)"))
        socket.user = {...decoded}
        console.log(`user with ${socket.user.id} connected`)
        next()
    } else {
        next(new Error(" this user don't have an authorized token in order to complete a socket connection"))
    }
}


const multerStorage = multer.diskStorage({

    destination: (req,file,cb) => {
        cb(null,"public/files/");
    },
    filename:(req,file,cb) => {
        const ext = path.extname(file.originalname)
        cb(null,`${file.fieldname}${Date.now()}${ext}`)
    },
})

const fileFilterFunc = (req,file,cb) => {
    const ext = path.extname(file.originalname)
    if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png' && ext !== '.pdf') {
      return cb(new Error('file are allowed'));
    }
    cb(null,true)
}

const FileUploadMulter = multer({
    
    storage: s3Storage({
        acl:'public-read',
        s3,
        Bucket: process.env.AWS_BUCKET_NAME,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        resize: {
            width: 400,
            height: 400
        },        
        metadata: function(req,file,cb){
            cb(null,{ fieldName: file.fieldname })
        },
        key: function (req,file,cb) {
            cb(null,file.originalname + " " + Date.now().toString())
        }
    }),
    fileFilter: fileFilterFunc,
    limits:{
        fileSize:2000000000,
    },
    
});

const photoResize = async (req,res,next) => {
    if (!req.file) return next();
    req.file.filename = `${req.file.originalname}-resized-${Date.now()}`
    sharp(req.file.buffer).resize(200,200).toFormat("jpeg").jpeg({quality: 90})
    next()
}


module.exports = {
    authenticate_user,
    token_authenticate_user,
    socketAuthToken,
    FileUploadMulter,
    photoResize
}