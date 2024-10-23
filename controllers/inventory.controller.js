const Yup = require('yup')
const bcrypt = require('bcrypt')
const { v4: uuidv4 } = require('uuid')
const User = require('../models').User;
const Chat = require('../models').Chat;
const ChatUser = require('../models').ChatUser;
const Messages = require('../models').Messages;


const { generateToken } = require('../token/token');
const { default: axios } = require('axios');
const { sequelize } = require('../models');
const { Op } = require('sequelize');
const aws = require('../aws/aws.service')

const userInventoryRegister = async(req,res) => {
    const { token } = req?.body;

    if(token){

        var config = {

            method: 'GET',
            maxBodyLength: Infinity,
            url: 'https://api-uat-user.sidrabazar.com/user-account_check-auth-token',
            headers:{
                'Authorization': `token ${token}`
            },
            data: ''
        }

        if (config){
            axios(config).then(async function(response){
                if (response.status == 200){

                    const hash_pass = await bcrypt.hash(response.data.data['username'],10)  
                    // console.log(response.data.data['email'])
                    var new_user = {
                        name: response.data.data['fname'] + " " + response.data.data['lname'],
                        email: response.data.data['email'],
                        password: hash_pass,
                        photo: response.data.data['profile_pic'] != null || response.data.data['profile_pic'] != "" ? response.data.data['profile_pic'] : 'https://akiaupxtk6jpfugj2axq-dump.s3.amazonaws.com/communication/singleUserPhotoUrl.png'
                    }

                    let is_user_exists = await User.findOne({
                        where:{
                            email: new_user.email
                        }
                    });


                    // console.log(is_user_exists)

                    if (is_user_exists === null){
                        
                        const user = await User.create(new_user)  
                        if (user){
                            // console.log(user.dataValues['photo'])
                            let data = {
                                id: user.id,
                                username: user.name,
                                email: user.email,
                                photo: user.dataValues['photo'],
                            }
    
                            let token = generateToken(data)

                            return res.status(200).json({
                                response_code: 200,
                                status: 'success',
                                userid: user.id,
                                username: user.name,
                                loggedIn: true,
                                token: token
                            });
                        }                                   
                    } 

                    let is_user = await User.findOne({
                        where:{
                            email: new_user.email
                        }
                    });

                    if(is_user){

                        User.update(new_user,{
                            where:{
                                email: is_user.email
                            }
                        }).then(async(d) => {
                            // console.log(d)
                            var updated_user = await User.findOne({
                                where:{
                                    email: is_user.email
                                }
                            });                       
                            var data = {
                                id: updated_user.id,
                                username: updated_user.name,
                                email: updated_user.email,
                                photo: updated_user.dataValues['photo'],
                            }
                            let token = generateToken(data);
        
                            return res.status(200).json({
                                response_code: 200,
                                status: 'success',
                                message:"user already exists",
                                token: token                  
                            });
                        } ).catch((err) => {
                            return res.status(400).json({
                                response_code: 400,
                                status: 'failed',
                                message:err.message,               
                            });                            
                        })
                        // console.log(update_user)
                                                

                    }
                }
            }).catch(function(error){
                console.log(error)
            })
        }

    }
};

const inventoryConnect = async(req,res) => {
    const { fname , lname, email , photo } = req.body;
    
    const hash_pass = await bcrypt.hash(fname,10)  
    
    var new_user = {
        name: fname == lname ? fname : fname + " " + lname,
        email: email,
        password: hash_pass,
        photo: photo != null || photo != "" ? photo : 'https://akiaupxtk6jpfugj2axq-dump.s3.amazonaws.com/communication/singleUserPhotoUrl.png'
    }

    let is_user_exists = await User.findOne({
        where:{
            email: new_user.email
        }
    })

    if ( is_user_exists ){
        console.log("is already exists ....!!!")
        await User.update(new_user,{
            where:{
                id: is_user_exists.id
            }
        })

        const transaction = await sequelize.transaction()
        try{            
            // const transaction = await sequelize.transaction()
            // await User.update(new_user,{
            //     where:{
            //         id: is_user_exists.id
            //     }
            // });

            const user = await User.findOne({
                where:{
                    id: req?.user?.id
                },
                include:[
                    {
                        model: Chat,
                        where:{
                            isGroupChat: false
                        },
                        include:[
                            {
                                model: ChatUser,
                                where:{
                                    userid: is_user_exists.id
                                }
                            }
                        ]
                    }
                ]
            })     
            
            if(user && user.Chats.length > 0){

                return res.status(403).json({
                    "status":"failed",
                    "response_code": 403,
                    "message": "Chat with this user already exists"                
                })
            }     
            
            const new_chat = await Chat.create({ isGroupChat:false , name: is_user_exists.name , photoUrl: new_user.photo  },{ transaction: transaction })

            await ChatUser.bulkCreate([

                {
                    chatid: new_chat?.id,
                    userid: req?.user?.id
                },
                {
                    chatid: new_chat?.id,
                    userid: is_user_exists?.id
                }
                
            ],{ transaction: transaction })
            
            await transaction.commit()
            

            const chat = await Chat.findOne({
                where:{
                    id: new_chat.id
                },
                include:[
                    {
                        model: User,
                        where:{
                            [Op.not]:{
                                id: req?.user?.id
                            }
                        }
                    },
                    {
                        model: Messages,
                        limit:5,
                        order:[['id','DESC']]
                    }
                ]
            });

            if(chat){
                return res.status(201).json({
                    status: "success",
                    message: "chat created successfully",
                    data: chat
                })
            }            

        } catch (error){
            await transaction.rollback()
            res.sendStatus(500)
            throw new Error(error.message)            
        }        
    }

    if( is_user_exists === null){
        console.log("is not already exists ...!!")

        let user_create_friendId = await User.create(new_user)
        const transaction = await sequelize.transaction()
        try{
            const user = await User.findOne({
                where:{
                    id: req?.user?.id
                },
                include:[
                    {
                        model: Chat,
                        where:{
                            isGroupChat: false
                        },
                        include:[
                            {
                                model: ChatUser,
                                where:{
                                    userid: user_create_friendId.id
                                }
                            }
                        ]
                    }
                ]
            });  
            
            if(user && user.Chats.length > 0){

                return res.status(403).json({
                    "status":"failed",
                    "response_code": 403,
                    "message": "Chat with this user already exists"                
                })
            };     
            
            // const friend_user = await User.findOne({
            //     where: {
            //         id: is_user_exists.id
            //     }
            // })       
            
            const new_chat = await Chat.create({ isGroupChat:false , name: user_create_friendId.name , photoUrl: new_user.photo  },{ transaction: transaction })

            // const user_exists = await User.findOne({
            //     where:{
            //         id: friendId
            //     }
            // });

            // if(!user_exists){
            //     return res.status(400).send("user does not exists")
            // }

            await ChatUser.bulkCreate([

                {
                    chatid: new_chat?.id,
                    userid: req?.user?.id
                },
                {
                    chatid: new_chat?.id,
                    userid: user_create_friendId?.id
                }
                
            ],{ transaction: transaction });
            
            await transaction.commit()

            const chat = await Chat.findOne({
                where:{
                    id: new_chat.id
                },
                include:[
                    {
                        model: User,
                        where:{
                            [Op.not]:{
                                id: req?.user?.id
                            }
                        }
                    },
                    {
                        model: Messages,
                        limit:5,
                        order:[['id','DESC']]
                    }
                ]
            });

            if(chat){
                return res.status(201).json({
                    status: "success",
                    message: "chat created successfully",
                    data: chat
                })
            }            

        } catch (error){
            await transaction.rollback()
            res.sendStatus(500)
            throw new Error(error.message)            
        }         
    }

};

const inventoryGroup = async(req,res) => {
    const { name , friends , groupPhotoUrl  } = req.body;

    userid_array = []

    if (friends){
        
        // console.log(req.user.name)
        for(let user of friends){
            console.log(user)

            let is_user = await User.findOne({
                where:{
                    email: user.email
                }
            });

            if(is_user){
                userid_array.push(is_user.id)
            } else {
                const hash_pass = await bcrypt.hash(user.fname,10)
                let user_obj = {
                    name: user.fname == user.lname ? user.fname : user.fname + " " + user.lname,
                    email: user.email,
                    password: hash_pass,
                    photo: user.photo != null || user.photo != "" ? user.photo : 'https://akiaupxtk6jpfugj2axq-dump.s3.amazonaws.com/communication/singleUserPhotoUrl.png'
                }
                // 'https://akiaupxtk6jpfugj2axq-dump.s3.amazonaws.com/communication/groupPhotoUrl.png'
                let new_user = await User.create(user_obj)
                userid_array.push(new_user.id)
            }


        }
        console.log(userid_array)

        const transaction = await sequelize.transaction()
        
        try {
            const chat = await Chat.create({  "name": name , "isGroupChat": true , "createdBy": req.user.name , photoUrl: groupPhotoUrl ? groupPhotoUrl : 'https://akiaupxtk6jpfugj2axq-dump.s3.amazonaws.com/communication/groupPhotoUrl.png' },{ transaction: transaction })
            await ChatUser.bulkCreate([
                {
                    chatid: chat.id,
                    userid: req?.user?.id,
                },
            ],{ transaction: transaction }) 
            

            userid_array.forEach(async id => {
                try{
                    await ChatUser.bulkCreate([
                        {
                            chatid: chat.id,
                            userid: id,
                        }                
                    ])
                } catch (err){
                    console.log(err)
                }
            });

            await transaction.commit()
            return res.status(201).json({
                "status":"success",
                "message":"group created successfully"
            })

        } catch (error) {
            await transaction.rollback()
            return res.status(400).json({
                "status":"error",
                "error": error.message
            })        
        }
    }
};


module.exports = {
    userInventoryRegister,
    inventoryConnect,
    inventoryGroup
}