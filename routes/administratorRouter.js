const express = require('express');
const  admin_route = express();

const session = require('express-session');
const config = require('../config/config');
admin_route.use(session({
    secret:config.sessionSecret,
    resave: false,  
    saveUninitialized: false,
}));

const bodyParser = require('body-parser');
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({extended:true}));

// for image upload
const multer = require("multer");
const path = require('path');

admin_route.use(express.static('public'));

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

admin_route.set('view engine','ejs');
admin_route.set('views','./views/administrator');

 

const adminAuth = require('../middleware/adminAuth');


// controller for all function
const administratorController = require('../controllers/administratorController');



admin_route.get('/',adminAuth.islogout,administratorController.loadLogin);



admin_route.post('/',administratorController.verifyLogin);

// admin_route.get('/home',adminAuth.islogin,administratorController.loadDashboard);
admin_route.get('/home',administratorController.loadDashboard);

admin_route.get('/logout',adminAuth.islogin,administratorController.loadlogout);

admin_route.get('/forget',adminAuth.islogout,administratorController.forgetLoad);

admin_route.post('/forget',adminAuth.islogout,administratorController.forgetVerify);
admin_route.get('/forget-password',administratorController.forgetPasswordLoad);
admin_route.post('/forget-password',administratorController.resetPassword);


admin_route.get('/edit',adminAuth.islogin,administratorController.editLoad);
admin_route.post('/edit',upload.single('image'),administratorController.updateProfile);

admin_route.get('/delete/:id',adminAuth.islogin,administratorController.loaddelete);
admin_route.get('/deleteleave/:id',adminAuth.islogin,administratorController.loaddeleteLeave);



// database
admin_route.get('/database',adminAuth.islogin,administratorController.loadDatabase);
admin_route.get('/table',adminAuth.islogin,administratorController.loadtable);
admin_route.get('/profile',adminAuth.islogin,administratorController.loadProfile);

// add new
admin_route.get('/register',adminAuth.islogin,administratorController.loadRegister);
admin_route.post('/register',upload.single('image'),administratorController.insertUser);

admin_route.get('/pending',adminAuth.islogin,administratorController.loadpending);
admin_route.get('/approved',adminAuth.islogin,administratorController.loadapproved);
admin_route.get('/rejected',adminAuth.islogin,administratorController.loadrejected);

// action
admin_route.get('/action',adminAuth.islogin,administratorController.actionLoad);
admin_route.post('/action',administratorController.updateAction);


// admintable 
admin_route.get('/admintable',adminAuth.islogin,administratorController.loadadmintable);
admin_route.get('/dom',adminAuth.islogin,administratorController.loaddomhome);

admin_route.get('/department',adminAuth.islogin,administratorController.loaddepartment);
admin_route.get('/add_department',administratorController.loadAddDepartment);
admin_route.post('/add_department',administratorController.adddepartment);
 

// for exprort
admin_route.get('/userexport',administratorController.userexport);
admin_route.get('/userexportPdf',administratorController.userexportPdf);
 

admin_route.get('*',function(req, res){

    res.redirect('/admin');
});

module.exports = admin_route;