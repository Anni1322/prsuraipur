const express = require('express');
const user_route = express();
const session = require('express-session');

// for session 
const config = require('../config/config');
user_route.use(session({
    secret:config.sessionSecret,
    resave: false,  
    saveUninitialized: false,
}));

// for auth
const auth = require('../middleware/auth');

// for view
user_route.set('view engine','ejs');
user_route.set('views','./views/users');

// for get data  from body
const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}))

// for image upload
const multer = require("multer");
const path = require('path');

user_route.use(express.static('public'));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null,path.join(__dirname, '../public/userimages'))
    },
    filename:function (req, file, cb) {
        const name = Date.now()+'-'+file.originalname;
        cb(null,name);
    }
})
const upload = multer({storage:storage});





// controller for all function
const userController = require('../controllers/userController');

// add new user
user_route.get('/register',auth.isLogout,userController.loadRegister);
user_route.post('/register',upload.single('image'),userController.insertUser);



// add leave

// user_route.get('/applyleave',auth.isLogout,userController.loadapplyleave);
user_route.post('/applyleave',upload.single('image'),userController.addLeave);
user_route.get('/applyleave',auth.isLogin,userController.applyleave);
user_route.get('/editapplyleave',auth.isLogin,userController.editapplyleaveLoad);
// user_route.post('/editapplyleave',upload.single('image'),userController.updateapplyleave);



user_route.get('/verify',userController.verifymail);
// user_route.get('/loginverify',userController.verifyLogin);
user_route.get('/',auth.isLogout, userController.loginload);
user_route.get('/login',auth.isLogout, userController.loginload);
user_route.post('/login',userController.verifyLogin);



user_route.get('/logout',auth.isLogin,userController.userlogout);

user_route.get('/forget',auth.isLogout,userController.forgetLoad);

user_route.post('/forget',userController.fogetVerify);

user_route.get('/forget-password',auth.isLogout,userController.fogetPasswordLoad);
user_route.post('/forget-password',userController.resetPassword);

user_route.get('/verification',userController.verificationLoad);
user_route.post('/verification',userController.sentverificationLink);


user_route.get('/edit',auth.isLogin,userController.editLoad);
user_route.post('/edit',upload.single('image'),userController.updateProfile);

user_route.get('/home',auth.isLogin,userController.loadDashboard);
user_route.get('/Profile',auth.isLogin, userController.Profile);






user_route.get('/status',auth.isLogin, userController.loadstatus);
user_route.get('/history',auth.isLogin, userController.loadhistory);








module.exports = user_route;