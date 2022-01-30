const router = require('koa-router')()
const User = require('../models/userSchema')
const utils = require('../utils/util')
const jwt = require('jsonwebtoken')

router.prefix('/api/user')

router.post('/login', async (ctx, next) => {
    const {userName, userPwd} = ctx.request.body
    const res = await User.findOne({userName, userPwd})
    let data = res._doc
    delete data.userPwd
    const token = jwt.sign({data}, 'lance', {expiresIn: '1h'});
    if (res) {
        data.token = token
        ctx.body = utils.success(data)
    } else {
        ctx.body = utils.fail('帐号或密码不正确')
    }
})


module.exports = router
