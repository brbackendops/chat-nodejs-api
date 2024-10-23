const models = require('../models');
const User = models.User;
const Chat = models.Chat;
const ChatUser = models.ChatUser;
const Messages = models.Messages;
const Pinned = models.PinnedChat;
const { v4: uuidv4 } = require('uuid')

const { Op } = require('sequelize');
const { sequelize } = require('../models');
const moment = require('moment');
const { async } = require('q');
const cloudinary = require('../aws/cloudinary');
const fs = require('fs');
const { makePaginate } = require('sequelize-cursor-pagination');


require('dotenv').config()


exports.index = async(req,res) => {
  try {
    const { query } = req?.query
    if (!query){
        
        const user = await User.findOne({
            where:{
                id: req?.user?.id
            },   
            include:[
                {
                    model: Chat,
                    attributes:['id','name','isGroupChat','createdAt','photo'],     
                    order:[
                        ['createdAt','order','DESC']
                    ],                          
                    include:[
    
                       {
                        model: User,
                        // [Op.not]:{
                        //     id: req.user.id
                        // },
                        attributes: {
                            exclude: ['createdAt','updatedAt','ChatUser']
                        },
                        attributes:['id','name','email','connected','photo'],
                        where:{
                            id: {
                                [Op.ne]: req.user.id
                            }
                        }
                       },
                       {
                        model: Messages,
                        attributes:{
                            exclude:['id','createdAt','updatedAt']
                        },
                        attributes:['message','chatid','type','fromuserid','time','createdAt'],
                        limit: 2,
                        order:[['id','DESC']]
                       }
                    ],
                    attributes:{
                        exclude: ['updatedAt','ChatUser']
                    },
                }
            ],
            order: [
                [ {model: Chat,}, 'createdAt', 'DESC'],
            ]        
        });
    
    
        // console.log("messages",user.Chats.Messages)  
    
        if(user === undefined || user === null){
            return res.status(402).json({
                "status_code":402,
                "status":"failed",
                "data": []         
            })
        }
    
        return res.status(200).json({
            "status_code":200,
            "status":"success",
            "data": user.Chats
        })
    }

    if (query === "chats"){
        const user = await User.findOne({
            where:{
                id: req?.user?.id
            },   
            include:[
                {
                    model: Chat,
                    attributes:['id','name','isGroupChat','createdAt','photo'],     
                    order:[
                        ['createdAt','order','DESC']
                    ],   
                    where:{
                        isGroupChat: false                        
                    },                                           
                    include:[
    
                       {
                        model: User,
                        // [Op.not]:{
                        //     id: req.user.id
                        // },
                        attributes: {
                            exclude: ['createdAt','updatedAt','ChatUser']
                        },
                        attributes:['id','name','email','connected','photo'],
                        where:{
                            id: {
                                [Op.ne]: req.user.id
                            }
                        }
                       },
                       {
                        model: Messages,
                        attributes:{
                            exclude:['id','createdAt','updatedAt']
                        },
                        attributes:['message','chatid','type','fromuserid','time'],
                        limit: 2,
                        order:[['id','DESC']]
                       }
                    ],
                    attributes:{
                        exclude: ['updatedAt','ChatUser']
                    },
                }
            ],
            order: [
                [ {model: Chat,}, 'createdAt', 'DESC'],
            ]        
        });
    
    
        // console.log("messages",user.Chats.Messages)  
    
        if(user === undefined || user === null){
            return res.status(402).json({
                "status_code":402,
                "status":"failed",
                "data": []         
            })
        }
    
        return res.status(200).json({
            "status_code":200,
            "status":"success",
            "data": user.Chats
        })        
    }

    if (query === "groups"){
        const user = await User.findOne({
            where:{
                id: req?.user?.id
            },   
            include:[
                {
                    model: Chat,
                    attributes:['id','name','isGroupChat','createdAt','photo'],     
                    order:[
                        ['createdAt','order','DESC']
                    ],   
                    where:{
                        isGroupChat: true                        
                    },                                           
                    include:[
    
                       {
                        model: User,
                        // [Op.not]:{
                        //     id: req.user.id
                        // },
                        attributes: {
                            exclude: ['createdAt','updatedAt','ChatUser']
                        },
                        attributes:['id','name','email','connected','photo'],
                        where:{
                            id: {
                                [Op.ne]: req.user.id
                            }
                        }
                       },
                       {
                        model: Messages,
                        attributes:{
                            exclude:['id','createdAt','updatedAt']
                        },
                        attributes:['message','chatid','type','fromuserid','time'],
                        limit: 2,
                        order:[['id','DESC']]
                       }
                    ],
                    attributes:{
                        exclude: ['updatedAt','ChatUser']
                    },
                }
            ],
            order: [
                [ {model: Chat,}, 'createdAt', 'DESC'],
            ]        
        });
    
    
        // console.log("messages",user.Chats.Messages)  
    
        if(user === undefined || user === null){
            return res.status(402).json({
                "status_code":402,
                "status":"failed",
                "data": []         
            })
        }
    
        return res.status(200).json({
            "status_code":200,
            "status":"success",
            "data": user.Chats
        })        
    }      
  } catch (error) {
    return res.status(400).json({
        error: error
    })
  }    
};


// exports.index = async(req,res) => {
//   try {
//     // const { query } = req?.query

//     const user = await User.findOne({
//         where:{
//             id: req?.user?.id
//         },   
//         include:[
//             {
//                 model: Chat,
//                 attributes:['id','name','isGroupChat','createdAt','photo'],     
//                 order:[
//                     ['createdAt','order','DESC']
//                 ],                          
//                 include:[

//                     {
//                     model: User,
//                     // [Op.not]:{
//                     //     id: req.user.id
//                     // },
//                     attributes: {
//                         exclude: ['createdAt','updatedAt','ChatUser']
//                     },
//                     attributes:['id','name','email','connected','photo'],
//                     where:{
//                         id: {
//                             [Op.ne]: req.user.id
//                         }
//                     }
//                     },
//                     {
//                     model: Messages,
//                     attributes:{
//                         exclude:['id','createdAt','updatedAt']
//                     },
//                     attributes:['message','chatid','type','fromuserid','time'],
//                     limit: 2,
//                     order:[['id','DESC']]
//                     }
//                 ],
//                 attributes:{
//                     exclude: ['updatedAt','ChatUser']
//                 },
//             }
//         ],
//         order: [
//             [ {model: Chat,}, 'createdAt', 'DESC'],
//         ]        
//     });


//     // console.log("messages",user.Chats.Messages)  

//     if(user === undefined || user === null){
//         return res.status(402).json({
//             "status_code":402,
//             "status":"failed",
//             "data": []         
//         })
//     }

//     return res.status(200).json({
//         "status_code":200,
//         "status":"success",
//         "data": user.Chats
//     })
  
//   } catch (error) {
//     return res.status(400).json({
//         error: error
//     })
//   }    
// };

exports.create = async(req,res) => {
    const { friendId } = req?.body;

    if( !friendId ) throw new Error("fields are required")

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
                                userid: friendId
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
        
        const friend_user = await User.findOne({
            where: {
                id: friendId
            }
        })

        const user_exists = await User.findOne({
            where:{
                id: friendId
            }
        });

        if(!user_exists){
            return res.status(400).send("user does not exists")
        }
        // let name_of_chat = friend_user.name !== req.user.username ? friend_user.name : req.user.username;
        const new_chat = await Chat.create({ isGroupChat:false , name: friend_user.name },{ transaction: transaction })


        await ChatUser.bulkCreate([

            {
                chatid: new_chat?.id,
                userid: req?.user?.id
            },
            {
                chatid: new_chat?.id,
                userid: user_exists?.id
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

    } catch(error){
        await transaction.rollback()
        return res.status(400).json({
            error: error.message
        })
    }
};

exports.messages = async(req,res) => {

    const limit=10
    const page = req.query.page || 1
    const offset = page > 1 ? limit : 0 

    const chat = await Chat.findOne({
        where:{
            id: req?.params?.chatid
        }
    })

    if(chat.isGroupChat === true){

        var messages = await Messages.findAndCountAll({
            where:{
                chatid: req?.params?.chatid
            },
            include:[
                {
                    model:User,
                    as:"fromUser",
                    attributes:['id','name','email','connected','photo']
                }
            ],
            order:[['createdAt','DESC']],        
            limit: limit,
            offset: offset,
        })
        
    } else {

        var messages = await Messages.findAndCountAll({
            where:{
                chatid: req?.params?.chatid
            },
            order:[['createdAt','DESC']],        
            limit: limit,
            offset: offset,
        });

    }

    const totalPages = Math.ceil(messages.count / limit)
    if (page > totalPages){
        return res.status(400).json({ "status":"failed", "messages":"no messages" ,data: [] })
    }

    const result = {
        pagination: {
            page,
            totalPages,
            // next: page == totalPages ? null : `${process.env.MESSAGES_URL}/${req.params.chatid}?page=${page+1}`
        },
        messages: messages.rows
    }

    return res.status(200).json({
        status: "success",
        message: "request successful",
        data: result
    })
};

exports.search = async(req,res) => {
    const { term } = req?.params;
    try{
        const users = await User.findAll({
            where:{
                [Op.or]:{
                    name:{
                        [Op.iLike]: `%${term}%`
                    },
                    email:{
                        [Op.iLike]: `%${term}%`
                    }
                },
                [Op.not]:{
                    id: req.user.id
                }
            },
            limit: 10
        })

        if(users){

            return res.status(200).json({
                status: 200,
                message:"success",
                data: users
            })
        }
    }catch(error){
        return res.status(500).send(error.message)
    }
};

exports.deleteChat = async(req,res) => {
    try {
        await Chat.destroy({
            where:{
                chatid: req.params.chatid
            }
        })
        return res.status(200).json({
            message:"deleted successfully"
        })
    } catch (error) {
        res.status(400)
        throw new Error(error)
    }
};


exports.send = async(req,res) => {
    const { type , chatid , message  } = req?.body;

    const new_message = {
        type:type,
        chatid:chatid,
        fromuserid: req.user.id,
        message:message,
        time: moment().format('LT')
    }
    try {
        
        let msg = await Messages.create(new_message)
        return res.status(200).json({
            status: "success",
            data: msg
        })
    } catch (error) {
        return res.status(400).json({
            status:"failed",
            error: error
        })
    }

}


exports.groupchat = async(req,res) => {

    const { name , friends } = req?.body;
    
    if ( friends === undefined || friends === null ){
        return res.status(400).json({
            "status":"failed",
            "reason":"body is missing",
            "error":"required body fields are not found"
        });
    }

    const transaction = await sequelize.transaction()
    try {

        const chat = await Chat.create({  "name": name , "isGroupChat": true , "createdBy": req.user.name },{ transaction: transaction })
        await ChatUser.bulkCreate([
            {
                chatid: chat.id,
                userid: req?.user?.id,
            },
        ],{ transaction: transaction }) 
        

        friends.forEach(async id => {
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


exports.userList = async(req,res) => {
    const users_list = await User.findAll({
        where:{
            id:{
                [Op.ne]: req.user.id
            }
        },
        attributes:{
            exclude:['createdAt','updatedAt']
        },        
    })
    if(!users_list){
        return res.status(400).json({
            "status":"failed",
            "error":"no users"
        })
    }

    return res.status(200).json({
        "status":"success",
        "data": users_list
    })
}

exports.imageUpload = async (req,res) => {

        try {
            if (req.file){

                return res.status(200).json({
                    status: "success",
                    "data": {
                        response_code: 200,
                        upload: req.file.Location
                    }
                })
            }

        } catch (error) {
            return res.status(400).json({
                status:"failed",
                error: error
            })
        } 

}


exports.userDetails = async(req,res) => {
    try {

        let options = ['image','file','video']
        let chatid = req?.params?.chatid


        let chat = await Chat.findOne({
            where:{
                id: chatid,
                isGroupChat: false
            },
            attributes: {
                exclude: ['createdAt','updatedAt','ChatUser','id','name','isGroupChat',]
            },            
            include:[
                {
                    model: User,
                    where:{
                        id: {
                            [Op.ne]: req.user.id
                        }                    
                    },
                    attributes: {
                        exclude: ['createdAt','updatedAt','ChatUser']
                    },
                    attributes:['id','name','email','connected','photo'],                    
                },
                {
                    model: Messages,
                    where:{
                        type:{
                            [Op.in]: options
                        }
                    },
                    attributes: {
                        exclude: ['createdAt','updatedAt','ChatUser']
                    },
                    attributes:['message','type'],                 
                }
            ]
        })

        const groups = await Chat.findAll({
            where:{
                isGroupChat: true
            },
            include:[
                {
                    model: User,
                    where:{
                        id: chat.Users[0].dataValues.id
                    }
                }
            ]
        })


        return res.status(200).json({
            response_code: 200,
            status: "success",
            data: {
                media: chat,
                groups: groups
            },
        })
    } catch (error) {
        return res.status(400).json({
            response_code: 400,
            status: "failed",
            message: error.message
        })
    }
};


exports.groupUpdate = async(req,res) => {
    const { chatid } = req?.body;
    if(!chatid) throw new Error("all fields are required")
        try {
            await Chat.update({ name: req?.body?.name },{
                where:{
                    id: chatid
                }
            })
            return res.status(201).send("updated successfully")
        } catch (error) {
            return res.status(500).send(error.message)
        }
};

exports.groupLeave = async(req,res)=>{
    const { chatid } = req?.body;

    try {
        const chat = await Chat.findOne({
            where:{
                id: chatid
            },
            include:[
                {
                    model: User,
                }
            ]
        })

        await ChatUser.destroy({
            where:{
                chatid: chatid,
                userid: req?.user?.id
            }
        })

        return res.status(201).json({ chatid , status:"success" , message: "user left the group successfully"})

    } catch (error) {
        // res.sendStatus(500)
        return res.send({ status:"failed" , message: error.message})
    }

};

exports.streamHomeChats = async(req,res) => {
};

exports.pinnedChats = async(req,res) => {

    const { chatid } = req?.body;
    if(chatid){
        try{

            const pinned = await Pinned.create({ chatid: chatid , creator: req.user.id })
            return res.status(200).json({
                "status":200,
                "message":"chat pinned successully",
                "data": pinned
            }) 
        } catch (error){
            return res.status(400).json({
                "status":400,
                "message": error.message,
            })             
        }
    }

};

exports.deletePinnedChats = async(req,res) => {
    const { chatid } = req?.body;
    if(chatid){
        try{

            await Pinned.destroy({
                where:{
                    chatid: chatid
                }
            })
            return res.status(200).json({
                "status":200,
                "message":"chat deleted successully",
            }) 
        } catch (error){
            return res.status(400).json({
                "status":400,
                "message": error.message,
            })             
        }
    }    
}

exports.getPinnedChats = async(req,res) => {
    try {
        const pinnedChats = await Pinned.findAll({
            where: {
                creator: req.user.id
            },
            attributes:{
                exclude: ['id','chatid','creator','createdAt','updatedAt']
            },
            include:[
                {
                    model: Chat,
                    attributes:['id','name','isGroupChat','createdAt','photoUrl'],     
                    order:[
                        ['createdAt','order','DESC']
                    ],                          
                    include:[
    
                       {

                            model: User,
                         attributes: {
                                exclude: ['createdAt','updatedAt','ChatUser']
                            },
                            attributes:['id','email'],
                            where:{
                                id: {
                                    [Op.ne]: req.user.id
                                }
                            }

                       },
                    ]
                }
            ]
        })


        if (pinnedChats){
            return res.status(200).json({
                status: 200,
                data: pinnedChats
            })
        }        
    } catch (error) {
        return res.status(400).json({
            status: 400,
            error: error.message
        })        
    }

};


exports.groupDetails = async(req,res) => {

    try {

        let options = ['image','file','video']
        let chatid = req?.params?.chatid


        let chat = await Chat.findOne({
            where:{
                id: chatid,
                isGroupChat: true
            },
            attributes: {
                exclude: ['createdAt','updatedAt','ChatUser','id','name','isGroupChat',]
            },            
            include:[
                {
                    model: Messages,
                    where:{
                        type:{
                            [Op.in]: options
                        }
                    },
                    attributes: {
                        exclude: ['createdAt','updatedAt','ChatUser']
                    },
                    attributes:['message','type'],                 
                }
            ]
        })


        return res.status(200).json({
            response_code: 200,
            status: "success",
            data: {
                media: chat,
            },
        })
    } catch (error) {
        return res.status(400).json({
            response_code: 400,
            status: "failed",
            message: error.message
        })
    }
};


// exports.update = asyncHandler(async(req,res)=>{});


