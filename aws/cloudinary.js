const cloudinary = require('cloudinary')

cloudinary.config({
    cloud_name:"rohitbrcode",
    api_key: "543214914856476",
    api_secret:"bRQppdFSEN_skDGPJm3onfaUqDo"
})

const cloudinaryUploadImg = async fileupload => {
    try {
        const data = await cloudinary.uploader.upload(fileupload,{
            resource_type: "auto"
        });
        return {
            url: data?.secure_url
        }
    } catch (error) {
        return error
    }
}

module.exports = cloudinaryUploadImg 