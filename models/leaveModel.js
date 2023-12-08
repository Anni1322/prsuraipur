const mongoose = require('mongoose');

const leaveSchema = mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    eid:{
        type:String,
        required:true

    },
    d_name:{
        type:String,
        required:true

    },
    leave_type:{
        type:String,
        required:true
    },
    start_date:{
        type:String,
        required:true
    },
    end_date:{
        type:String,
        required:true
    },
    days:{
        type:String,
        required:true
    },
    status:{
        type:String,
        required:true
    },
    reason:{
        type:String,
    },
    applied_date:{
        type:Date,
        required:true
    },
  user_id:{
    type:String,
    required:false
  }
 

    
});

module.exports =  mongoose.model('Leave',leaveSchema);