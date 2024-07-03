const mongoose = require('mongoose')
const categorySchema = {
    name:{
        type:String,
        required:[true,"please provide category name"]
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
}

module.exports = mongoose.model('Category',categorySchema)