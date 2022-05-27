const router = require('koa-router')()
const User = require('../models/userSchema')
const Role = require('../models/roleSchema')
const Menu = require('../models/menuSchema')
const Counter = require('../models/counterSchema')
const util = require('../utils/util')
const jwt = require('jsonwebtoken')
const md5 = require('md5')

router.prefix('/api/users')

router.post('/login', async (ctx, next) => {
    const {userName, userPwd} = ctx.request.body
    const res = await User.findOne({userName})
    console.log(res)
    if (!res) {
        ctx.body = util.fail('用户名或密码错误', util.CODE.USER_LOGIN_ERROR)
        return
    }
    let data = res._doc
    if (md5(userPwd) === data.userPwd) {    // 密码正确
        delete data.userPwd
        const token = jwt.sign({data}, 'lance', {expiresIn: '24h'});
        if (res) {
            data.token = token
            ctx.body = util.success(data)
        } else {
            ctx.body = util.fail('帐号或密码不正确')
        }
    } else {    // 密码错误
        ctx.body = util.fail("密码错误", util.CODE.USER_ACCOUNT_ERROR);
    }
})

router.get('/list', async (ctx, next) => {
    const {userId, userName, state} = ctx.request.query
    const {page, skipIndex} = util.pager(ctx.request.query)
    let params = {}
    if (userId) params.userId = userId;
    if (userName) params.userName = userName;
    if (state && state != '0') params.state = state;
    const list = await User.find(params, {_id: 0, userPwd: 0}).skip(skipIndex).limit(page.pageSize)
    const total = await User.countDocuments(params);
    ctx.body = util.success({
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
        const res = await User.findOne({$or: [{userName}, {userEmail}]}, '_id userName userEmail')
        if (res) {
            ctx.body = util.fail(`系统监测到有重复的用户，信息如下：${res.userName} - ${res.userEmail}`)
            return
        } else {
            const doc = await Counter.findOneAndUpdate({_id: 'userId'}, {$inc: {sequence_value: 1}}, {new: true})
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
            ctx.body = util.success('', '用户创建成功');
        }

    } else {
        if (!deptId) {
            ctx.body = util.fail('部门不能为空', util.CODE.PARAM_ERROR)
            return
        }
        const res = await User.findOneAndUpdate({userId}, {mobile, job, state, roleList, deptId})
        ctx.body = util.success({}, '更新成功')
    }
})

router.post('/delete', async (ctx, next) => {
    const {userIds} = ctx.request.body
    const res = await User.updateMany({userId: {$in: userIds}}, {state: 2})
    if (res.ok) {
        ctx.body = util.success(res.nModified)
        return
    }
    ctx.body = util.fail('删除失败')
})

// 获取全部用户列表
router.get('/all/list', async (ctx) => {
    try {
        const list = await User.find({}, "userId userName userEmail")
        ctx.body = util.success(list)
    } catch (error) {
        ctx.body = util.fail(error.stack)
    }
})

// 获取用户对应的权限菜单
router.get("/getPermissionList", async (ctx) => {
    let authorization = ctx.request.headers.authorization
    let {data} = util.decoded(authorization)
    let menuList = await getMenuList(data.role, data.roleList);
    let actionList = getAction(JSON.parse(JSON.stringify(menuList)))
    ctx.body = util.success({menuList, actionList});
})

async function getMenuList(userRole, roleKeys) {
    let rootList = []
    console.log(userRole)
    if (userRole == 0) {    // 管理员
        rootList = await Menu.find({}) || []
    } else {
        // 根据用户拥有的角色，获取权限列表
        // 现查找用户对应的角色有哪些
        let roleList = await Role.find({_id: {$in: roleKeys}})
        let permissionList = []
        roleList.map(role => {
            let {checkedKeys, halfCheckedKeys} = role.permissionList;
            permissionList = permissionList.concat([...checkedKeys, ...halfCheckedKeys])
        })
        permissionList = [...new Set(permissionList)]
        rootList = await Menu.find({_id: {$in: permissionList}})
    }
    return util.getTreeMenu(rootList, null, [])
}

function getAction(list) {
    let actionList = []
    const deep = (arr) => {
        while (arr.length) {
            let item = arr.pop();
            if (item.action) {
                item.action.map(action => {
                    actionList.push(action.menuCode)
                })
            }
            if (item.children && !item.action) {
                deep(item.children)
            }
        }
    }
    deep(list)
    return actionList;
}

module.exports = router
