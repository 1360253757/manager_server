/**
 * 数据库连接
 */
const mongoose = require('mongoose')
const config = require('./index')
const log4js = require('./../utils/log4')

mongoose.connect(config.URL,{
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection;

db.on('error',()=>{
    log4js.error('***数据库连接失败***')
})

db.on('open',()=>{
    log4js.info('***数据库连接成功***')
})
// const User = require('../models/userSchema')
// let users = [];
// for (let i = 1001; i < 1003; i++) {
//     let user = new User({
//         userId: i,
//         userName: 'lance' + i,
//         userPwd: i.toString() * 6,
//         userEmail: 'lance@163.com',
//         mobile: 15536365289 + i,
//         sex: 0,
//         deptId: [],
//         job: '',
//         roleList: []
//     })
//     users.push(user)
// }
// User.insertMany(users,(res) => {
//     console.log(res)
// })
