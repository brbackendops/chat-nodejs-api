const express = require('express');
const logger = require('morgan');
const cors = require('cors');
const http = require('http');
// const Memcached = require('memcached')
const moment = require('moment-timezone')
// const SSE = require('sse');


require('dotenv').config()

const app = express()
// const memcached = new Memcached()

app.use(cors({
    origin: "*",
}));

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const swaggerUi = require('swagger-ui-express');
swaggerDocument = require('./swagger_output.json');
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

const router = require('./routes/index')
app.use(router)

const server = http.createServer(app)
const socketServer = require('./socket')
socketServer(server);

// console.log(process.env.NODE_ENV)
// const sse = new SSE(server)

// app.get('/stream',(req,res) => {
//   res.setHeader('Content-Type','text/event-stream')
//   res.setHeader("Access-Control-Allow-Origin", "*")
//   const intervalId = setInterval(()=>{
//     const date = new Date().toLocaleString()
//     res.write(`data: ${date}\n\n`)
//   },5000)

//   res.on('close',()=>{
//     console.log('Client closed connection')
//     clearInterval(intervalId)
//   })
// })

// const now = new Date()

// function setHeartbeat(){
  
//   const currentTime = moment().toISOString();
//   // let currentTime = now.calendar()
//   memcached.set('user',currentTime,10,(err) => {
//     if(err) {
//       throw new Error(err)
//     } else {
//       console.log('HeartBeat set successfully')
//       memcached.get('user',(err,data) => {
//         const getTime = moment(data,moment.ISO_8601);
//         console.log("data is :",getTime.calendar())
//       });
//     }
//   });
// }


// setInterval(setHeartbeat,10*10)


// function updatemyHeart(key,time){
//   memcached.touch('user',10,(err) => {
//     if(err) {
//       console.error("Error updating heartbeat:",err);
//     } else {
//       memcached.set('user',currentTime,10,(err) => {
//         if(err) throw new Error(err)
//       });
//       memcached.get('user',(err,data) => {
//         console.log("data is :",data)
//       });
//       console.log('Heartbeat updated successfully')
//     }
//   })
// }



// memcached.connect('localhost:11211',(err,conn) => {
//   if (err){
//     console.log(conn.server , 'error while connecting memcache')
//   }
//   console.log('memcache successfully configured and running')
// })

server.listen(process.env.APP_PORT,()=>{
  console.log(`app is listening on ${process.env.APP_URL}:${process.env.APP_PORT}`) // ssss
})

process.on('beforeExit',() => {
  clearInterval(updatemyHeart);
  memcached.end();
  process.exit();
})

