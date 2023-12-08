const mongoose = require('mongoose');

const departmentSchema = mongoose.Schema({
     
    name:{
        type:String,
        required:false
    },
    code:{
        type:String,
        required:false
    }
    
});

module.exports =  mongoose.model('Department',departmentSchema);