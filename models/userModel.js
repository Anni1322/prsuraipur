const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
     
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    dob:{
        type:String,
        required:true
    },
    gender:{
        type:String,
        required:true
    },

    mobile:{
        type:Number,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
   address:{
    type:String,
    required:true
   },
   designation:{
    type:String,
    required:true
   },
   
    is_admin:{
        type:Number,
        required:true
    },
    is_verified:{
        type:Number,
        default:0
    },
    eid:{
        type:String,
        required:true
    },
    department:{
        type:String,
        required:true
    },
  
    token:{
        type:String,
        default:''
    },
});

module.exports =  mongoose.model('User',userSchema);