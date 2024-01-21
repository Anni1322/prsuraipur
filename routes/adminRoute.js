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
admin_route.set('views','./views/admin');

 

const adminAuth = require('../middleware/adminAuth');


// controller for all function
const adminController = require('../controllers/adminController');



admin_route.get('/',adminAuth.islogout,adminController.loadLogin);



admin_route.post('/',adminController.verifyLogin);

admin_route.get('/home',adminAuth.islogin,adminController.loadDashboard);
admin_route.get('/logout',adminAuth.islogin,adminController.loadlogout);

admin_route.get('/forget',adminAuth.islogout,adminController.forgetLoad);

admin_route.post('/forget',adminAuth.islogout,adminController.forgetVerify);
admin_route.get('/forget-password',adminController.forgetPasswordLoad);
admin_route.post('/forget-password',adminController.resetPassword);


admin_route.get('/edit',adminAuth.islogin,adminController.editLoad);
admin_route.post('/edit',upload.single('image'),adminController.updateProfile);

admin_route.get('/delete/:id',adminAuth.islogin,adminController.loaddelete);
admin_route.get('/deleteleave/:id',adminAuth.islogin,adminController.loaddeleteLeave);



// database
admin_route.get('/database',adminAuth.islogin,adminController.loadDatabase);
admin_route.get('/table',adminAuth.islogin,adminController.loadtable);
admin_route.get('/profile',adminAuth.islogin,adminController.loadProfile);

// add new
admin_route.get('/register',adminAuth.islogin,adminController.loadRegister);
admin_route.post('/register',upload.single('image'),adminController.insertUser);

admin_route.get('/pending',adminAuth.islogin,adminController.loadpending);
admin_route.get('/administratorPending',adminAuth.islogin,adminController.loadadministratorpending);

admin_route.get('/approved',adminAuth.islogin,adminController.loadapproved);
admin_route.get('/administratorApproved',adminAuth.islogin,adminController.loadadministratorapproved);

admin_route.get('/rejected',adminAuth.islogin,adminController.loadrejected);
admin_route.get('/administratorRejected',adminAuth.islogin,adminController.loadadministratorrejected);

// action
admin_route.get('/action',adminAuth.islogin,adminController.actionLoad);
admin_route.post('/action',adminController.updateAction);


// admintable 
admin_route.get('/admintable',adminAuth.islogin,adminController.loadadmintable);
admin_route.get('/dom',adminAuth.islogin,adminController.loaddomhome);
admin_route.get('/homeadministrator',adminAuth.islogin,adminController.loadadministrator);

admin_route.get('/department',adminAuth.islogin,adminController.loaddepartment);
admin_route.get('/add_department',adminController.loadAddDepartment);
admin_route.post('/add_department',adminController.adddepartment);
 

// for exprort
admin_route.get('/userexport',adminController.userexport);
admin_route.get('/userexportPdf',adminController.userexportPdf);
 

admin_route.get('*',function(req, res){

    res.redirect('/admin');
});

module.exports = admin_route;