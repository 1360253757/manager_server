const router = require('koa-router')()
const User = require('../models/userSchema')
const Counter = require('../models/counterSchema')
const utils = require('../utils/util')
const jwt = require('jsonwebtoken')
const md5 = require('md5')

router.prefix('/api/users')

router.post('/login', async (ctx, next) => {
    const {userName, userPwd} = ctx.request.body
    const res = await User.findOne({userName})
    console.log(res)
    if (!res) {
        ctx.body = utils.fail('用户名或密码错误', utils.CODE.USER_LOGIN_ERROR)
        return
    }
    let data = res._doc
    if (md5(userPwd) === data.userPwd) {    // 密码正确
        delete data.userPwd
        const token = jwt.sign({data}, 'lance', {expiresIn: '1h'});
        if (res) {
            data.token = token
            ctx.body = utils.success(data)
        } else {
            ctx.body = utils.fail('帐号或密码不正确')
        }
    }
})

router.get('/list', async (ctx, next) => {
    const {userId, userName, state} = ctx.request.query
    const {page, skipIndex} = utils.pager(ctx.request.query)
    let params = {}
    if (userId) params.userId = userId;
    if (userName) params.userName = userName;
    if (state && state != '0') params.state = state;
    const list = await User.find(params, {_id: 0, userPwd: 0}).skip(skipIndex).limit(page.pageSize)
    const total = await User.countDocuments(params);
    ctx.body = utils.success({
        page: {
            ...page,
            total
        },
        list
    })
})
// 新增/编辑用户
router.post('/operate', async (ctx, next) => {
    const {userId, userName, userEmail, mobile, job, state, roleList, deptId, action} = ctx.request.body;
    if (action === 'add') {
        if (!userName || !userEmail || !deptId) {
            ctx.body = util.fail('参数错误', util.CODE.PARAM_ERROR)
            return;
        }
        const res = await User.findOne({ $or: [{ userName }, { userEmail }] }, '_id userName userEmail')
        if (res) {
            ctx.body = utils.fail(`系统监测到有重复的用户，信息如下：${res.userName} - ${res.userEmail}`)
            return
        } else {
            const doc = await Counter.findOneAndUpdate({ _id: 'userId' }, { $inc: { sequence_value: 1 } }, { new: true })
            const user = new User({
                userId: doc.sequence_value,
                userName,
                userPwd: md5('123456'),
                userEmail,
                role: 1, //默认普通用户
                roleList,
                job,
                state,
                deptId,
                mobile
            })
            user.save();
            ctx.body = utils.success('', '用户创建成功');
        }

    } else {
        if (!deptId) {
            ctx.body = utils.fail('部门不能为空', utils.CODE.PARAM_ERROR)
            return
        }
        const res = await User.findOneAndUpdate({userId}, {mobile, job, state, roleList, deptId})
        ctx.body = utils.success({}, '更新成功')
    }
})

router.post('/delete', async (ctx, next) => {
    const {userIds} = ctx.request.body
    const res = await User.updateMany({userId: {$in: userIds}}, {state: 2})
    if (res.ok) {
        ctx.body = utils.success(res.nModified)
        return
    }
    ctx.body = utils.fail('删除失败')
})


module.exports = router
