const mongoose = require('mongoose')
const leaveSchema = mongoose.Schema({
    orderNo: String,    // 申请单号
    applyType: Number,  // 1事假    2调休    3年假
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date, default: Date.now },
    applyUser: {
        userId: String,
        userName: String,
        userEmail: String
    },
    leaveTime: String,  // 休假时长
    reasons: String,
    auditUsers: String, // 完整审批人
    curAuditUserName: String,   // 当前审批人
    auditFlows: [
        {
            userId: String,
            userName: String,
            userEmail: String
        }
    ],  // 审批流
    auditLogs: [
        {
            userId: String,
            userName: String,
            createTime: Date,
            remark: String,
            action: String
        }
    ],
    applyState: { type: Number, default: 1 },   // 1待审批  2审批中  3审批拒绝  4审批通过  5作废
    createTime: { type: Date, default: Date.now }
})

module.exports = mongoose.model("leaves", leaveSchema, "leaves")
