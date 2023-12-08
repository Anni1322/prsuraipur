const User = require('../models/userModel');
const Leave = require('../models/leaveModel');
const Department = require("../models/department");
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');


const config = require('../config/config');

const randomstring = require('randomstring');
const { render } = require('ejs');

// s password 
const securePassword = async(password)=>{
    try{
         const passwordHash = await bcrypt.hash(password, 10);
         return passwordHash;
     }catch(error){
         console.log(error.message)
     }
}

// for send mail funcion
const sendvarifyMail = async(name, email, user_id)=>{

    try{
        const transporter =  nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            auth:{
                user:config.emailUser,
                pass:config.emailPassword
            }
         });
        const mailOption = {
            from:config.emailUser,
            to:email,
            subject:'for verification mail',
            html:'<p> hi '+name+', Please click here to <a href="https://practice-xexa.onrender.com/verify?id='+user_id+'">Verify</a> Your mail.</p>',
        };
            transporter.sendMail(mailOption, function(error, info){
                if(error){
                    console.log(error);
                }else{
                    console.log("email has been sent:-",info.response);
                }
            })
     
     }catch(error){
         console.log(error.message)
     }
}

// 
const sendResetPasswordMail = async(name, email, token)=>{

    try{
        const transporter =  nodemailer.createTransport({
            host:'smtp.gmail.com',
            port:587,
            secure:false,
            auth:{
                user:config.emailUser,
                pass:config.emailPassword
            }
         });
        const mailOption = {
            from:config.emailUser,
            to:email,
            subject:'For Reset Password',
            html:'<p> hi '+name+', Please click here to <a href="https://practice-xexa.onrender.com/forget-password?token='+token+'">Reset</a> Your Password.</p>',
        };
            transporter.sendMail(mailOption, function(error, info){
                if(error){
                    console.log(error);
                }else{
                    console.log("email has been sent:-",info.response);
                }
            })
     
     }catch(error){
         console.log(error.message)
     }
}


const loadRegister = async(req, res)=>{
    try{
       const departmentData = await Department.find();
       res.render('registration',{department:departmentData})
    }catch(error){
        console.log(error.message)
    }
}


const loadapplyleave = async(req, res)=>{
    try{
       res.render('applyleave')
    }catch(error){
        console.log(error.message)
    }
}

const insertUser = async(req, res)=>{
    try{  

        const email = req.body.email;
        const existmail = await User.findOne({email: email });
        if (existmail) {
            // alert('This Email Allready exist');
            res.render('login',{message:'This Email Allready exist '});
            

        } else {
            
        const spassword = await securePassword(req.body.password);
        const user = new User({
            name:req.body.name,
            email:req.body.email,
            dob:req.body.dob,
            gender:req.body.gender,
            mobile:req.body.mobile,
            address:req.body.address,
            designation:req.body.designation,
            department:req.body.department,
            image:req.file.filename,
            password:spassword,
            eid:"prsu101",
            is_admin:0
            
        });

        const userData = await user.save();
        if(userData){
            sendvarifyMail(req.body.name, req.body.email, userData._id);
            res.render('login',{message:'Your registration has been successflly, Please varify your email'})
        }else{
            res.render('registration',{message:'Your registration has been failed'})
        }
    }




     }catch(error){
         console.log(error.message)
     }
}

const addLeave = async(req, res)=>{
    try{   
        const users = await User.findById({_id:req.session.user_id});
        // get data 
        
        const currentDate = new Date();
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const date = currentDate.toLocaleDateString('en-US', options);

        const leave = new Leave({
            name:req.body.name,
            eid:req.body.eid,
            d_name:req.body.d_name,
            leave_type:req.body.leave_type,
            start_date:req.body.start_date,
            end_date:req.body.end_date,
            status:"Pending",
            applied_date:date,
            user_id:req.body.user_id,
            days:req.body.days,
          
           
        });

      
        const userData = await leave.save();
        if(userData){
            res.render('applyleave',{message:'Apply has been successflly.',user:users})
        }else{
            res.render('applyleave',{message:'Your request failed'})
        }
       

     }catch(error){
         console.log(error.message)
     }
}





const applyleave = async(req, res)=>{

    try {
        const departmentData = await Department.find();
        const userData = await User.findById({_id:req.session.user_id});
        if(userData){
            
            res.render('applyleave',{user:userData,department:departmentData});
        }else{
            res.redirect('/home');
        }

    } catch (error) {
        console.log(error.message);
    }


 

}




// verify user 
const verifymail = async(req, res)=>{
    try{
    const updateInfo = await User.updateOne({_id:req.query.id},{$set:{is_verified:1}})
     console.log(updateInfo);
     res.render("email-verified");
    
    }catch(error){
         console.log(error.message)
     }
}

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const userData = await User.findOne({ email: email });
        
        if (userData) {
            // decrypt password
            const PasswordMatch = await bcrypt.compare(password, userData.password);
            
            if (PasswordMatch) {
              if(userData.is_verified === 0){
                res.render('login',{message:"Please verify your email."});
              }else{
                req.session.user_id = userData._id;
                res.redirect('/home');
              }
            }
            else {
                res.render('login',{message:"Email and password  is incorrect. "});
            }
        }
        else {
            res.render('login',{message:"Incorrect Email"});
            // res.render('About',{message:"User Not Found"});
        }
    } catch (error) {
        console.log("verification Error please verify your email. " , error.message);
    }
};

//  login user method started
const loginload = async(req, res)=>{
    try {
        res.render('login');
    } catch (error) {
        console.log(error.message);
    }
}

// home page

const Profile = async(req, res)=>{
    
    try {
        const userData = await User.findById({_id:req.session.user_id});
        // user for home page 
        res.render('profile',{user:userData});
    } catch (error) {
        console.log(error.message);
    }
}

// user logout 
const userlogout = async(req, res)=>{
    try {
        req.session.destroy();
        res.redirect('/');
    } catch (error) {
        console.log(error.message);
    }
}

// for forget 
const forgetLoad =  async(req, res)=>{
    try {
        res.render('forget');
    } catch (error) {
        console.log(error.message);
    }
}

const fogetVerify = async(req, res)=>{
    try {
        
        const email = req.body.email;
       const userdata =  await User.findOne({email: email});
       if(userdata){
        if (userdata.is_verified === 0) {
            res.render('forget',{message:"Please verify your email."});
        }else{
        const randomString = randomstring.generate();
         const updatedData = await User.updateOne({email:email},{$set:{token:randomString}});
        // sent mail
        sendResetPasswordMail(userdata.name,userdata.email,randomString);
        res.render('forget',{message:"Please check your email to reset your password."});
    }
            
       }
       else{
        res.render('forget',{message:"user email incorrect."});
       }
    } catch (error) {
        console.log(error.message);
    }
}

const fogetPasswordLoad = async(req, res)=>{
    try {
        // get token from sendforgetpasswordemain
        const token = req.query.token;
        const tokenData = await User.findOne({token:token});
        if(tokenData){
            res.render('forget-password',{user_id:tokenData._id});
        }else{
            res.render('404',{message:"Token in invalid."});
        }

    } catch (error) {
        console.log(error.message);
    }
}

// resetPassword
const resetPassword = async(req, res)=>{
    try {
        const password = req.body.password;
        const user_id = req.body.user_id;
        const secure_password = await securePassword(password);

     const updateData = await  User.findByIdAndUpdate({_id:user_id},{$set:{password:secure_password,token:''}})
        res.redirect('/');
    } catch (error) {
        console.log(error.message);
    }
}

// for verification sent link
const verificationLoad = async(req, res)=>{
try {
    res.render('verification');

} catch (error) {
    console.log(error.message);
}
}


const sentverificationLink = async(req, res)=>{
try {
    const email = req.body.email;
    const userData = await User.findOne({email: email });
    if(userData){
        sendvarifyMail(userData.name, userData.email, userData._id);
        res.render('verification',{message:"Reset Verification Mail sent Please Check Your Email. "});
    }else{
        res.render('verification',{message:"This email is not exist "});
    }


    

} catch (error) {
    console.log(error.message);
}
}


// user profile edit 

const editLoad = async(req, res)=>{

    try {
        const id = req.query.id;
        const userData = await User.findById({_id:id});
        if(userData){
            res.render('edit',{user:userData});
        }else{
            res.redirect('/home');
        }

    } catch (error) {
        console.log(error.message);
    }
}

const updateProfile = async(req, res)=>{

    try {
  
        if(req.file){
            const userData=  await  User.findByIdAndUpdate({_id:req.body.user_id},{$set:{name:req.body.name, email:req.body.email, mobile:req.body.mobile, image:req.file.filename}});
        }else{
         const userData=  await  User.findByIdAndUpdate({_id:req.body.user_id},{$set:{name:req.body.name, email:req.body.email, mobile:req.body.mobile}});
        }
        
        res.redirect('home');
    } catch (error) {
        console.log(error.message);
    }
}

const editapplyleaveLoad = async(req, res)=>{
    try {
        const id = req.query.id;
        const leaveData = await Leave.findById({ _id: id });
        if (leaveData) {
          res.render("edit-applyleave", { leave: leaveData });
        } else {
          res.redirect("/home");
        }
      } catch (error) {
        console.log(error.message);
      }
}




// dashbord
const  loadDashboard = async(req, res)=>{
    try {
        const userData = await User.findById({_id:req.session.user_id});
        // user for home page 
        res.render('dashboard',{user:userData});
    } catch (error) {
        console.log(error.message);
    }
}
 



// loadtable
const  loadstatus = async(req, res)=>{
    try {
        const id =req.query.id;
        const leaves = await Leave.find({user_id:id});
        res.render('status', {
            title: 'status',
            leaves: leaves,
        });
    } catch (err) { 
        res.json({ message: err.message });
    }
}

// loadhistory
const  loadhistory = async(req, res)=>{
    try {
        const leaves = await Leave.find().exec();
        res.render('history', {
            title: 'history',
            leaves: leaves,
        });
    } catch (err) { 
        res.json({ message: err.message });
    }
}

module.exports ={
    loadRegister,
    insertUser,
    verifymail,
    verifyLogin,
    loginload,
    Profile,
    userlogout,
    forgetLoad,
    fogetVerify,
    fogetPasswordLoad,
    resetPassword,
    verificationLoad,
    sentverificationLink,
    editLoad,
    updateProfile,
    editapplyleaveLoad,
    loadDashboard,
    applyleave,
    addLeave,
    loadapplyleave,
    loadstatus,
    loadhistory
}