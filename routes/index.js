const express = require('express')
const router = express.Router();


const userRoute = require('./user.route')
const chatRoute = require('./chat.route')
const inventoryRoute = require('./inventory.route')
// const testController = require('./test.route')

router.get('/', async(req,res)=>{
    res.status(200).json({
        "status_code": 200,
        "status": "success",
        "message":"welcome to communication api"
    })
});

router.use('/api/user/', userRoute)
router.use('/api/chat/', chatRoute)
router.use('/api/inventory',inventoryRoute)
// router.use('/api/test/',testController)


module.exports = router