const router = require('express').Router()
// const User = require('./models').User;

const { index , create , deleteChat , messages , search , send , groupchat , userList , imageUpload , userDetails , groupUpdate , groupLeave , groupDetails , pinnedChats , getPinnedChats , deletePinnedChats } = require('../controllers/chat.controller')
const { authenticate_user , token_authenticate_user , FileUploadMulter , photoResize } = require('../middlewares/protection')
// const { rateLimiter } = require('../limiter')


router.route('/').get([token_authenticate_user],index)
router.route('/').post([token_authenticate_user],create)
router.route('/:id').delete([token_authenticate_user],deleteChat)
router.route('/search/:term').get([token_authenticate_user],search)
router.route('/messages/:chatid').get(messages)
router.route('/send').post([token_authenticate_user],send)
router.route('/create/group').post([token_authenticate_user],groupchat)
router.route('/users/list').get([token_authenticate_user],userList)
router.route('/image/upload').post([FileUploadMulter.single('file')],imageUpload)
router.route('/user/profile/:chatid').get([token_authenticate_user],userDetails)
router.route('/update/group').post(groupUpdate)
router.route('/leave/group').post([token_authenticate_user],groupLeave)
router.route('/details/group/:chatid').get(groupDetails)
router.route('/pin').post([token_authenticate_user],pinnedChats)
router.route('/pin').get([token_authenticate_user],getPinnedChats)
router.route('/pin/delete').delete(deletePinnedChats)


// rohitbr

// router.route('/register').post(registerHandler)


module.exports = router