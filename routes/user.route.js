const router = require('express').Router()
// const User = require('./models').User;

const { loginController , registerHandler } = require('../controllers/user.controller')
const { authenticate_user , token_authenticate_user } = require('../middlewares/protection')
// const { rateLimiter } = require('../limiter')


router.route('/login').post(loginController)
router.route('/register').post(registerHandler)


module.exports = router