const router = require('express').Router()
// const User = require('./models').User;

const { userInventoryRegister , inventoryConnect , inventoryGroup} = require('../controllers/inventory.controller')
const { authenticate_user , token_authenticate_user , FileUploadMulter } = require('../middlewares/protection')
// const { rateLimiter } = require('../limiter')


router.route('/inventory-login').post(userInventoryRegister)
router.route('/inventory-connect-personal').post([token_authenticate_user],inventoryConnect)
router.route('/inventory-connect-group').post([token_authenticate_user],inventoryGroup)

module.exports = router


