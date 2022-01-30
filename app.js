const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const jwt = require('koa-jwt')

const index = require('./routes/index')
const user = require('./routes/user')
const log = require('./utils/log4')
const util = require('./utils/util')

require('./config/db')  // 数据库连接
// error handler
onerror(app)

// middlewares
app.use(bodyparser({
    enableTypes: ['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))
// Token 拦截处理
app.use(function (ctx, next) {
    return next().catch((err) => {
        if (401 === err.status) {
            ctx.status = 200;
            ctx.body = util.fail('Token认证失败', util.CODE.AUTH_ERROR);
        } else {
            throw err;
        }
    });
});
app.use(jwt({secret: 'lance', key: 'userInfo'}).unless({path: [/^\/api\/users\/login/]}))    // jwt 检验

// logger
app.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})


// routes
app.use(index.routes(), index.allowedMethods())
app.use(user.routes(), user.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
    console.error('server error', err, ctx)
    log.error(err.stack)
});

module.exports = app
