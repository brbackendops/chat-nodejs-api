const Yup = require('yup')
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')
const User = require('../models').User;
const { generateToken } = require('../token/token')

const loginFormSchema = Yup.object({
    username: Yup.string()
    .required("username is required")
    .min(3,"username too short")
    .max(30,"username too long"),

    password: Yup.string()
    .required("password is required")
    .min(5,"password is too short")
    .max(200,"password too long")
});

/**
 * @swagger
 * /login:
 *  post:
 *      description: login user
 *      responses: 
 *          200:
 *              description: Success
 */
const loginController = async(req,res) => {
    const formData = req.body;
    loginFormSchema.validate(formData).catch((err)=>{
        return res.status(400).json({
            "status_code":400,
            "status":"failed",
            "message": err.errors
        })
    }).then(async (valid) => {
        if (valid){

            const user = await User.findOne({
                where:{
                    name: req?.body?.username
                },
                attributes:['id','name','email','password','connected','photo']
            });

            if (user === undefined || user === null){
                return res.status(400).json({
                    status_code: 400,
                    status:"failed",
                    message: "user does not exists"
                })
            }

            let hashedPassword = user?.password
            is_confirmed = await bcrypt.compare(req?.body?.password,hashedPassword)
            if (is_confirmed){
                data = {
                    id: user.id,
                    username: user.name,
                    email: user.email,
                    photo: user.dataValues['photo']
                }

                let token = generateToken(data)
                if (token){
                    
                    return res.status(200).json({
                        status_code: 200,
                        status:"success",
                        "userid":user.id,
                        username: user.name,
                        loggedIn: true,
                        token: token
                    })

                } else {
                    return res.status(200).json({
                        status_code: 400,
                        status:"failed",
                        loggedIn: false,
                        token: "invalid token"                        
                    })
                }
            }
            
        } else {
            return res.status(500).send("Internal Error")
        }
    })
}

const registerFormData = Yup.object({
    email: Yup.string()
    .required("email is required")
    .min(5,"emali is too short")
    .max(100,"email is too long"),

    username: Yup.string()
    .required("username is required")
    .min(3,"username too short")
    .max(30,"username too long"),

    password: Yup.string()
    .required("password is required")
    .min(5,"password is too short")
    .max(200,"password too long")

})

const registerHandler = async (req,res) => {
    const formData = req.body;
    registerFormData.validate(formData).catch((err)=>{
        return res.status(400).json({
            "status_code":400,
            "status":"failed",
            "message": err.errors
        })        
    }).then(async (valid) => {
        if(valid){
            const hash_pass = await bcrypt.hash(req?.body?.password,10)
            const new_user = {
                name: req?.body?.username,
                email:req?.body?.email,
                password: hash_pass,
            }
            const user = await User.create(new_user)
            if(user){
                return res.status(200).json({
                    status_code: 200,
                    "status": "success",
                    "data": user
                })
            }

        } else {
            return res.status(500).send("form data is incorrect")
        }
    })
}




module.exports = {
    loginController,
    registerHandler
}