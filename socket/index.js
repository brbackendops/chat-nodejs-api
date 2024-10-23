const socketIo = require('socket.io');
const { socketAuthToken } = require('../middlewares/protection');
const { sequelize } = require('../models');
const { createAdapter } = require("@socket.io/postgres-adapter");
const { Emitter } = require("@socket.io/postgres-emitter");
const Pool = require('pg-pool');
const Messages = require('../models').Messages;
const User = require('../models').User;
const Chat = require('../models').Chat;
const { Op } = require('sequelize');


// const moment = require('moment');
const fs = require('fs')
const path = require('path');
const { chunk } = require('lodash');
const aws = require('../aws/aws.service');
const { async } = require('q');

const moment = require('moment-timezone');

require('dotenv').config();

// sockets

const connectionString = `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`
const pool = new Pool({
    connectionString: connectionString,
    connectionTimeoutMillis: 0,
    idleTimeoutMillis: 10000   
});

pool.connect((err,result)=>{
    if(err){
        return console.error(err.stack)
    }
    console.log("connection is successfull")
});


pool.query(`
CREATE TABLE IF NOT EXISTS socket_io_attachments (
    id          bigserial UNIQUE,
    created_at  timestamptz DEFAULT NOW(),
    payload     bytea
    );
`);

async function isUserchanged(){

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

    return user.changed()
}


const socketServer = (server) => {
    const io = socketIo(server,{
        cors:{
            origin:["*"],
            handlePreflightRequest: (req, res) => {
                res.writeHead(200, {
                  "Access-Control-Allow-Origin": "*",
                  "Access-Control-Allow-Methods": "GET,POST",
                  "Access-Control-Allow-Headers": "my-custom-header",
                  "Access-Control-Allow-Credentials": true
                });
                res.end();
            },
            credentials: true,
            methods: ['GET','POST'],
            maxHttpBufferSize: 1e8 
        },
        allowEIO3: true
    });

    // setInterval(
    //     function setHeartbeat(){
  
    //         const currentTime = moment().toISOString();
    //         // let currentTime = now.calendar()
    //         myObj.set('user',currentTime,10,(err) => {
    //           if(err) {
    //             throw new Error(err)
    //           } else {
    //             console.log('HeartBeat set successfully')
    //           }
    //         });
    //     }
    // ,1000)

    io.use(socketAuthToken)
    io.adapter(createAdapter(pool));
    const emitter = new Emitter(pool);

    io.on('connection', async (socket)=>{
        console.log(` ${socket.user.username} is joined...! `);
        socket.join(socket.user.id)

        // emitting userid with socket
        socket.emit("user.id",socket.user.id)
        
        let my_friends = await get_chatters(socket.user.id)
        
        pool.query(`
            Update Public."Users"
            SET connected='true'
            WHERE name=$1   
        `,[socket.user.username]).then((data) => {
            emitter.in(my_friends).emit("online",{
                "id": socket.user.id
            });        
        }).catch((err) => {
            emitter.in(my_friends).emit("online",err)
        });

        // socket.on('install.status',(data) => {
        //     if (data.onLine == true){
        //         pool.query(`
        //             Update Public."Users"
        //             SET connected='true'
        //             WHERE name=$1
        //         `,[socket.user.username]).then((data) => {
        //             emitter.in(my_friends).emit("online.offline",{
        //                 "id": socket.user.id
        //             })
        //             const currentTime = moment().toISOString()
        //             const now = moment.tz('Asia/Kolkata');                               
        //             memObj.set(String(socket.user.id),currentTime,72000,(err) => {
        //                 throw Error(err)
        //             })
        //         }).catch((err) => {
        //             emitter.in(my_friends).emit("online.offline",err)
        //         })
        //     } 

        //     if (data.onLine == false ) {
        //         pool.query(`
        //             Update Public."Users"
        //             SET connected='false'
        //             WHERE name=$1
        //         `,[socket.user.username]).then((data) => {

        //             emitter.in(my_friends).emit("online.offline",{
        //                 "id": socket.user.id
        //             })
                    
        //             memObj.get(String(socket.user.id),(err,data) => {
        //                 if (err === null || err === undefined) {
        //                     const getTime = moment(data,moment.ISO_8601);
        //                     emitter.in(my_friends).emit('last.seen.time',{
        //                         "seen.time": getTime.calendar()
        //                     })
        //                 }
        //             })

        //         }).catch((err) => {
        //             emitter.in(my_friends).emit("mobile.online",err)
        //         })
        //     }
        // })

        // pool.query(`
        //     SELECT * FROM Public."Users"
        //     WHERE USERNAME=$1
        // `,[socket.user.username])
        

        // socket.emit("friends.list",await get_chatters(socket.user.id))
        // io.to(socket.user.id).emit("online",socket.user.username);
        
        // online
        // socket.message
        socket.on('message', async(message) => {
            let data = {
                type: message.type,
                chatid: message.chatid,
                fromuserid: socket.user.id,
                message: message.content
            }
            await Messages.create(data)
            p2p=[socket.user.id,message.to]
            io.to(p2p).emit('newMessage', message)
        });
        
        // socket.room
        socket.on('join.chat',(room) => {
            socket.join(room)
            socket.emit("room.id",room)
        });


        
        // features
        socket.on('listen.typing',(room)=>{
            socket.to(room).emit("typing", 'typing ...');
        });

        socket.on('stopped.typing',(room) => {
            socket.to(room).emit("stopped",'')
        });

        socket.on('listen.recording',(room) => {
            socket.to(room).emit("recording",'user is recording....')
        });

        socket.on('stopped.recording',(room) => {
            socket.to(room).emit("stopped",'')
        }); 

        socket.on('get.clients', async (room)=>{
            var all_people =  await io.in(room).fetchSockets()
            io.to(room).emit("active.length",all_people.length)
            all_people.forEach(element => {
                
                if(all_people.length === 1 && element.user.id === socket.user.id){
                    console.log("the message has been delivered and seen by sender")
                }

                if(all_people.length === 2){
                    let seened_user = element.user.username !== socket.user.username ? element.user.username : ''
                    console.log("the message has been seened by", seened_user)
                }
            });
            // console.log("sockets",io.sockets.sockets)
            // socket.emit('clients',all_people)
        });

        

        // socket.on('read',(room)=>{
        //     let soc = room.sockets.clients(room)
        //     socket.emit("read.debug",soc)
        // })


        // private message
        socket.on('new.message',async(message)=>{
            if (!message.content) return;
            
            
            let data = {            
                type: message.type,
                chatid: message.chatid,
                fromuserid: socket.user.id,
                message: message.content
            }
            
            if (data.fromuserid != socket.user.id){
                io.to(message.chatid).emit("latest.notification",data)
            }

            await Messages.create(data)
            const now = moment.tz('Asia/Kolkata');                               
            data['time'] = now.calendar()
            // data['createdAt'] = moment(new Date()).from(new Date())   
            data['createdAt'] = "just now"
            socket.to(message.chatid).emit("check.console",`user joined the chat ${socket.user.username}`)                
            io.to(message.chatid).emit("latest.message",data)
            // socket.broadcast.to
        });


        // group chat

        socket.on('group.message',async(message)=>{
            if (!message.content) return;
            const now = moment.tz('Asia/Kolkata');                    

          

            let data = {            
                type: message.type,
                chatid: message.chatid,
                fromuserid: socket.user.id,
                message: message.content,
                time: now.calendar()
            }

            message.fromuserid = socket.user.id
            message.fromUser = {
                "name": socket.user.username,
                "email": socket.user.email,
                "photo": socket.user.photo
            }

            message['message'] = message.content
            message.content = undefined
            message['time'] = now.calendar()  
            // message['createdAt'] = moment(new Date()).from(new Date())   
            message['createdAt'] = "just now"
            await Messages.create(data)
            socket.to(message.chatid).emit("check.console",`user joined the chat ${socket.user.username}`)                
            io.to(message.chatid).emit("group.latest.message",message)
            // socket.broadcast.to
        });     

        // socket.emit('total.in.group',)
        socket.on('total.in.group', async (room)=>{
            let all_people_group =  await io.in(room).fetchSockets()
            io.to(room).emit("total.active.users",all_people_group.length)
        });

        socket.on('group.listen.typing',(room)=>{
            socket.to(room).emit("group.typing", {
                "name": socket.user.username,
                "email": socket.user.email,
                "photo": socket.user.photo                
            });
        });

        socket.on('group.stopped.typing',(room) => {
            socket.to(room).emit("group.stopped",{
                "name": socket.user.username,
                "email": socket.user.email,
                "photo": socket.user.photo                
            });
        }); 

        socket.on('group.listen.recording',(room) => {
            socket.to(room).emit("group.recording", {
                "name": socket.user.username,
                "email": socket.user.email,
                "photo": socket.user.photo                
            });            
        });

        socket.on('group.stopped.recording',(room) => {
            socket.to(room).emit("group.stopped", {
                "name": socket.user.username,
                "email": socket.user.email,
                "photo": socket.user.photo                
            });               
        });
        
        socket.on('group.message.seen',async (room) => {
            var all_people =  await io.in(room).fetchSockets()
            let msg_seen_by = []
            all_people.forEach(element => {
                msg_seen_by.push(element.user)
            });            

            socket.to(room).emit("msg.seen.by",msg_seen_by.filter((user) => user.id != socket.user.id ))
        })
        
        ///
        // image streaming


        // var readStream = fs.createReadStream(path.resolve(__dirname,'./mix.jpg'),{
        //     encoding: 'binary'
        // });
        // let chunks = []

        // readStream.on('readable',function(){
        //     console.log('loading')
        // });

        // readStream.on('data',function(chunk){
        //     chunks.push(chunk);
        //     socket.emit('image.stream',chunk)
        // });

        // readStream.on('end',function(){
        //     console.log('image loaded')
        // });

        ///

        socket.on('upload-image',function(message) {
            let path = 'socket-io/' + message.name;
            aws.write(path,message.data).then(async function (res) {
                return aws.readFiles(path).then(async function(response){                    

                    let base64 = response.Body.toString('base64')
                    let data = {            
                        type: message.type,
                        chatid: message.chatid,
                        fromuserid: socket.user.id,
                        message: 'data:image/jpeg;base64,' + base64
                    }
                    
                    io.to(message.room).emit('latest.message',data);
                });
            });
        });   
        
        // socket.on('sound.blob',(message) => {
        //     let path = 'socket-io/' + `${message.name}.mp3`;
        //     aws.write(path,message.data).then(function (res) {
        //         return aws.readFiles(path).then(async function(response){
                    
        //             // console.log(response)
        //             // aws.read(path).then((res) => {
        //             //     let buf = new Buffer.from(res)                    
        //             // })

        //             // let base64 = Buffer.from(response.Body).toString('base64')
        //             let data = {            
        //                 type: message.type,
        //                 chatid: message.chatid,
        //                 fromuserid: socket.user.id,
        //                 message: base64
        //             }              
        //             io.to(message.room).emit('latest.message',data);
        //         });
        //     });        
        // });    
        
        

        // Personal Media

        socket.on('sound.blob',(message) => {
            let path = 'socket-io/' + `${message.name}.mp3`;
            aws.write(path,message.data).then(async function (res) {
                // console.log(res)
                socket.emit("sound.debug",message.data)
                const url = `https://akiaupxtk6jpfugj2axq-dump.s3.amazonaws.com/${path}`
                return aws.readFiles(path).then(async function(response){
                    
                    let data = {            
                        type: message.type,
                        chatid: message.chatid,
                        fromuserid: socket.user.id,
                        message: url
                    }     

                    await Messages.create(data)
                    data['time'] = moment().format('LT')                             
                    io.to(message.room).emit('latest.message',data);                    

                });
            });        
        });


        socket.on('upload-video',(message) => {
            console.log(data)
            let path = 'socket-io/' + `${message.name}.mp4`;
            aws.write(path,message.data).then(async function(res){
                socket.emit("video.debug",message.data)

                const url = `https://akiaupxtk6jpfugj2axq-dump.s3.amazonaws.com/${path}`
                return aws.readFiles(path).then(async function (response) {
                    let data = {            
                        type: message.type,
                        chatid: message.chatid,
                        fromuserid: socket.user.id,
                        message: url
                    }         
                    await Messages.create(data)
                    data['time'] = moment().format('LT')                         
                    io.to(message.room).emit('latest.message',data);                      
                })
                    
            })
        });    
        
        



        // group Media        

        socket.on('group.upload.video',(message) => {
            console.log(data)
            let path = 'socket-io/' + `${message.name}.mp4`;
            aws.write(path,message.data).then(async function(res){
                const url = `https://akiaupxtk6jpfugj2axq-dump.s3.amazonaws.com/${path}`
                return aws.readFiles(path).then(async function (response) {
                    let data = {            
                        type: message.type,
                        chatid: message.chatid,
                        fromuserid: socket.user.id,
                        message: url
                    }       
                    
                    await Messages.create(data)
                    const now = moment.tz('Asia/Kolkata');                    
                    data['time'] = now.calendar()                    
                    io.to(message.room).emit('group.latest.message',data);                      
                })  
            });

        });     
        
        
        socket.on('group.sound.blob',(message) => {

            let path = 'socket-io/' + `${message.name}.mp3`;
            aws.write(path,message.data).then(function (res) {
                console.log(res)
                const url = `https://akiaupxtk6jpfugj2axq-dump.s3.amazonaws.com/${path}`
                return aws.readFiles(path).then(async function(response){
                    
                    let data = {            
                        type: message.type,
                        chatid: message.chatid,
                        fromuserid: socket.user.id,
                        message: url
                    }

                    await Messages.create(data)
                    data['time'] = moment().format('LT')                    
                    io.to(message.room).emit('group.latest.message',data);                    

                });
            });                    
        });        


        socket.on('leave.group',(room) => {
            try {

                pool.query(`
                    DELETE FROM Public."ChatUsers"
                    WHERE chatid=$1 and userid=$2
                `,[room,socket.user.id], async(err,res) => {
                    if(!err){
                        if(res.rows){
                            
                            socket.leave(room);
                            let new_data = {            
                                type: 'left',
                                chatid: room,
                                fromuserid: socket.user.id,
                                message: `${socket.user.username} left the chat`
                            }  
                            await Messages.create(new_data)
                            io.to(room).emit('group.latest.message',new_data);

                        }
                    }
                })


            } catch (error) {
                socket.emit('leave.debug', error)
            }
        });

        socket.on('delete.group',(room) => {
            try {

                pool.query(`
                    DELETE FROM Public."Chats"
                    WHERE id=$1
                `,[room]).then((data) => {                    
                    socket.emit('group.delete.message',`group has been deleted successfully`);
                });

            } catch (error) {
                socket.emit('delete.group.debug', error);
            }            
        });

        


        socket.on('disconnect',async ()=>{
            // const heartbeatInterval = heartbeatIntervals.get(userId);
            // clearInterval(heartbeatInterval);
            // heartbeatIntervals.delete(userId);
            const friends = await get_chatters(socket.user.id)
            pool.query(`
                Update Public."Users"
                SET connected='false'
                WHERE name=$1 
            `,[socket.user.username]).then((data) => {
                emitter.in(friends).emit("offline",{
                    "id": socket.user.id
                });        
            }).catch((err) => {
                emitter.in(friends).emit("offline",err)
            })
        });

    })
};


// user chat index list
const get_chatters = async (userId) => {
    try {
        const [results,metadata] = await sequelize.query(
            
                `
                    select "cu"."userid" from "ChatUsers" as cu
                    inner join (
                        select "c"."id" from "Chats" as c
                        where exists(
                            select "u"."id" from "Users" as u
                            inner join "ChatUsers" on "u"."id"="ChatUsers"."userid"
                            where "u"."id"='${userId}' and "c"."id"="ChatUsers"."chatid"
                        )
                    ) as cjoin on cjoin.id = "cu"."chatid"
                    where "cu"."userid"!='${userId}'
                `
            )
            return results.length > 0 ? results.map( el => el.userid): []

            // return results.length > 0 ? results : ''
    } catch (error) {
            console.log(error)
            return []
    }   
}

// const get_all_chatters = async (userId) => {
//     try {
//         const [results,metadata] = await sequelize.query(
            
//                 `
//                     select "cu"."userid" from "ChatUsers" as cu
//                     inner join (
//                         select "c"."id" from "Chats" as c
//                         where exists(
//                             select "u"."id" from "Users" as u
//                             inner join "ChatUsers" on "u"."id"="ChatUsers"."userid"
//                             where "u"."id"='${userId}' and "c"."id"="ChatUsers"."chatid"
//                         )
//                     ) as cjoin on cjoin.id = "cu"."chatid"
//                     where "cu"."userid"!='${userId}'
//                 `
//             )
//             return results.length > 0 ? results : []
            
//             // return results.length > 0 ? results : ''
//     } catch (error) {
//             console.log(error)
//             return []
//     }   
// }


module.exports = socketServer