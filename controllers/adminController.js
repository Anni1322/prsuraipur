const User = require("../models/userModel");
const Leave = require("../models/leaveModel");
const Department = require("../models/department");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const ExcelJS = require('exceljs');
const Docxtemplater = require('docxtemplater');


const config = require("../config/config");

const randomstring = require("randomstring");

const multer = require("multer");
const fs = require("fs");
 
const ejs = require('ejs');
const pdf = require('html-pdf');
const path = require('path')

// s password
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

//
const sendResetPasswordMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });
    const mailOption = {
      from: config.emailUser,
      to: email,
      subject: "For Reset Password",
      html:
        "<p> hi " +
        name +
        ', Please click here to <a href="https://prsuleaveease.onrender.com/admin/forget-password?token=' +
        token +
        '">Reset</a> Your Password.</p>',
    };
    transporter.sendMail(mailOption, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("email has been sent:-", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};



const loadLogin = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (passwordMatch) {
        // check admin or not
        if (userData.is_admin === 0) {
          res.render("login", { message: "Email and Password is incorrect." });
        } else {
          req.session.user_id = userData._id;
          
          // send admin home
          res.redirect("/admin/home");
        }
      } else {
        res.render("login", { message: "Email and Password is incorrect." });
      }
    } else {
      res.render("login", { message: "Email and Password is incorrect." });
    }
  } catch (error) {
    console.log(error.message);
  }
};


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
          html:'<p> hi '+name+', Please click here to <a href="https://prsuleaveease.onrender.com/verify?id='+user_id+'">Verify</a> Your mail.</p>',
      };
          transporter.sendMail(mailOption, function(error, info){
              if(error){
                  console.log(error);
              }else{
                  console.log("Email has been sent:-",info.response);
              }
          })
   
   }catch(error){
       console.log(error.message)
   }
}



const loadRegister = async (req, res) => {
  try{
    const departmentData = await Department.find();
    res.render('registration',{department:departmentData})
 }catch(error){
     console.log(error.message)
 }
};

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

const loadlogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};
const forgetLoad = async (req, res) => {
  try {
    res.render("forget");
  } catch (error) {
    console.log(error.message);
  }
};

const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const userdata = await User.findOne({ email: email });
    if (userdata) {
      if (userdata.is_admin === 0) {
        res.render("forget", { message: "Email is incorrect." });
      } else {
        const randomString = randomstring.generate();
        const updatedData = await User.updateOne(
          { email: email },
          { $set: { token: randomString } }
        );
        // sent mail
        sendResetPasswordMail(userdata.name, userdata.email, randomString);
        res.render("forget", {
          message: "Please check your email to reset your password.",
        });
      }
    } else {
      res.render("forget", { message: "Email incorrect." });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const forgetPasswordLoad = async (req, res) => {
  try {
    // get token from sendforgetpasswordemain
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });
    if (tokenData) {
      res.render("forget-password", { user_id: tokenData._id });
    } else {
      res.render("404", { message: "Token in invalid." });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// resetPassword
const resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;
    const secure_password = await securePassword(password);

    const updateData = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: secure_password, token: "" } }
    );

    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

// for verification sent link
const verificationLoad = async (req, res) => {
  try {
    res.render("verification");
  } catch (error) {
    console.log(error.message);
  }
};

// user profile edit

const editLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      res.render("edit", { user: userData });
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    if (req.file) {
      const userData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            designation: req.body.designation,
            department: req.body.department,
            pwd: req.body.pwd,
            address: req.body.address,
            image: req.file.filename,
          },
        }
      );
    } else {
      const userData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            designation: req.body.designation,
            department: req.body.department,
            pwd: req.body.pwd,
            address: req.body.address,
          },
        }
      );
    }

    res.redirect("home");
  } catch (error) {
    console.log(error.message);
  }
};

const loaddelete = async (req, res) => {
  try {
    const id = req.params.id;
    // Find the user by ID and remove it
    const removedUser = await User.findByIdAndRemove(id);
    if (!removedUser) {
      return res.json({ message: "User not found", type: "danger" });
    }
    // Remove the associated image from the uploads directory
    try {
      fs.unlinkSync("./uploads/" + removedUser.image);
    } catch (err) {
      console.error(err);
    }

    req.session.message = {
      type: "success",
      message: "User deleted successfully",
    };

    res.redirect("/admin/table");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

const loaddeleteLeave = async (req, res) => {
  try {
    const id = req.params.id;
    // Find the user by ID and remove it
    const removedUser = await Leave.findByIdAndRemove(id);
    if (!removedUser) {
      return res.json({ message: "User not found", type: "danger" });
    }
    // Remove the associated image from the uploads directory
    try {
      fs.unlinkSync("./uploads/" + removedUser.image);
    } catch (err) {
      console.error(err);
    }

    req.session.message = {
      type: "success",
      message: "User deleted successfully",
    };

    res.redirect("/admin/home");
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};




//
// dashbord
const loadDashboard = async (req, res) => {
  try {

    const findUserDepartment = await User.findOne({ _id: req.session.user_id });

    if (findUserDepartment) {
      const userDepartment = findUserDepartment.department;
      
      // match department
      const userData = await User.findOne({
        $and: [
          { _id: req.session.user_id },
          { department: userDepartment }
        ]
        });


        const PendingCount = await Leave.findOne({
          $and:[
            {status:"Pending"},
            {d_name: userDepartment}
          ]
        }).count();
    
        const approvedCount = await Leave.findOne({
          $and:[
            {status:"Approved"},
            {d_name: userDepartment}
          ]
        }).count();

    
        const Forwardadministrator = await Leave.findOne({
          $and:[
            {status:"Forward Administrator"},
            {d_name: userDepartment}
          ]
        }).count();
        const Pendingadministrator = await Leave.findOne({
          $and:[
            {status:"Administrator Rejected"},
            {d_name: userDepartment}
          ]
        }).count();
        const Approvedadministrator = await Leave.findOne({
          $and:[
            {status:"Administrator Approved"},
            {d_name: userDepartment}
          ]
        }).count();
    
        const RejectedCount = await Leave.findOne({
          $and:[
            {status:"Rejected"},
            {d_name: userDepartment}
          ]
        }).count();

        
      // user for home page
      res.render("dashboard", {
        user: userData,
        PendingCount: PendingCount,
        approvedCount:approvedCount,
        RejectedCount:RejectedCount,
        Forwardadministrator:Forwardadministrator,
        Pendingadministrator:Pendingadministrator,
        Approvedadministrator:Approvedadministrator
        // 
      
      });

    }


  } catch (error) {
    console.log(error.message);
  }
};


// loaddomhome
const loaddomhome = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    const PendingCount = await Leave.find({ status: "Pending" }).countDocuments();
    const approvedCount = await Leave.find({ status: "Approved" }).countDocuments();
    const RejectedCount = await Leave.find({ status: "Rejected" }).countDocuments();

    res.render("domhome", {
      user: userData,
      PendingCount: PendingCount,
      approvedCount: approvedCount,
      RejectedCount: RejectedCount,
    });
  } catch (error) {
    console.error("Error in loaddomhome:", error);
    res.status(500).send("Internal Server Error");
  }
};


// loadhome administrator 
const loadadministrator = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    const PendingCount = await Leave.find({ status: "Administrator Pending" }).countDocuments();
    const approvedCount = await Leave.find({ status: "Administrator Approved" }).countDocuments();
    const ForwardadministratorCount = await Leave.find({ status: "Forward Administrator" }).countDocuments();
    const RejectedCount = await Leave.find({ status: "Administrator Rejected" }).countDocuments();

    res.render("administratoDashboard", {
      user: userData,
      PendingCount: PendingCount,
      approvedCount: approvedCount,
      RejectedCount: RejectedCount,
      ForwardadministratorCount:ForwardadministratorCount
    });
  } catch (error) {
    console.error("Error in administrator:", error);
    res.status(500).send("Internal Server Error");
  }
};


const loadProfile = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    // user for home page
    res.render("profile", { user: userData });
  } catch (error) {
    console.log(error.message);
  }
};

// database
const loadDatabase = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    const usersCount = await User.countDocuments();
    const adminsCount = await User.find({is_admin:1}).count();
    const departmentCount = await Department.find().count();
    

    // const LeaveCount = await Leave.countDocuments();
    res.render("database", {
      title: "Home Page",
      usersCount: usersCount,
      adminsCount: adminsCount,
      departmentCount:departmentCount,
      user: userData,
    });
  } catch (err) {
    res.json({ message: err.message });
  }
};

// loadtable
const loadtable = async (req, res) => {
  try {
    const users = await User.find().exec();
    res.render("table", {
      title: "table",
      users: users,
    });
  } catch (err) {
    res.json({ message: err.message });
  }
};

//loadstatus show data
const loadstatus = async (req, res) => {
  try {
    const userData = await Leave.find();
    res.render("status", { leave: userData });
  } catch (error) {
    console.log(error.message);
  }
};



// loadpending
const loadpending = async (req, res) => {
  try {
    const findUserDepartment = await User.findOne({ _id: req.session.user_id });
    if (findUserDepartment) {
      const userDepartment = findUserDepartment.department; 
      // match department
      const userData = await User.findOne({
        $and: [
          { _id: req.session.user_id },
          { department: userDepartment }
        ]
        });

        const PendingCount = await Leave.find({
          $and:[
            {status:"Pending"},
            {d_name: userDepartment}
          ]
        });
     
        const leave = await Leave.find().exec();
      // user for home page
      res.render("pending", {
        title: "pending",
        leaves: leave,
        PendingCount:PendingCount
      });
    }

  } catch (err) {
    res.json({ message: err.message });
  }
};




// loadapproved
const loadapproved = async (req, res) => {
  try {

    const findUserDepartment = await User.findOne({ _id: req.session.user_id });
    if (findUserDepartment) {
      const userDepartment = findUserDepartment.department; 
      // match department
      const userData = await User.findOne({
        $and: [
          { _id: req.session.user_id },
          { department: userDepartment }
        ]
        });

        const approvedCount = await Leave.find({
          $and:[
            {status:"Approved"},
            {d_name: userDepartment}
          ]
        });
     
        const leave = await Leave.find().exec();
      // user for home page
      res.render("approved", {
        title: "approved",
        leaves: leave,
        approvedCount:approvedCount
      });
    }

 
  } catch (err) {
    res.json({ message: err.message });
  }
};



// loadrejected
const loadrejected = async (req, res) => {
  try {


    const findUserDepartment = await User.findOne({ _id: req.session.user_id });
    if (findUserDepartment) {
      const userDepartment = findUserDepartment.department; 
      // match department
      const userData = await User.findOne({
        $and: [
          { _id: req.session.user_id },
          { department: userDepartment }
        ]
        });

        const RejectedCount = await Leave.find({
          $and:[
            {status:"Rejected"},
            {d_name: userDepartment}
          ]
        });
     
        const leave = await Leave.find().exec();
      // user for home page
      res.render("rejected", {
        title: "rejected",
        leaves: leave,
        RejectedCount:RejectedCount
      });
    }







  } catch (err) {
    res.json({ message: err.message });
  }
};


// administrator loadpending
const loadadministratorpending = async (req, res) => {
  try {
    const findUserDepartment = await User.findOne({ _id: req.session.user_id });
    if (findUserDepartment) {
      const userDepartment = findUserDepartment.department; 
      // match department
      const userData = await User.findOne({
        $and: [
          { _id: req.session.user_id },
          { department: userDepartment }
        ]
        });

        const PendingCount = await Leave.find({
          $and:[
            {status:"Forward Administrator"},
            {d_name: userDepartment}
          ]
        });
     
        const leave = await Leave.find().exec();
      // user for home page
      res.render("administratorPending", {
        title: "pending",
        leaves: leave,
        administratorForwardCount:PendingCount
      });
    }


  } catch (err) {
    res.json({ message: err.message });
  }
};

// administrator loadApproved
const loadadministratorapproved = async (req, res) => {
  try {
    const findUserDepartment = await User.findOne({ _id: req.session.user_id });
    if (findUserDepartment) {
      const userDepartment = findUserDepartment.department; 
      // match department
      const userData = await User.findOne({
        $and: [
          { _id: req.session.user_id },
          { department: userDepartment }
        ]
        });

      
        const Approvedadministrator = await Leave.find({
          $and:[
            {status:"Administrator Approved"},
            {d_name: userDepartment}
          ]
        });
        
     
        const leave = await Leave.find().exec();
      // user for home page
      res.render("administratorApproved", {
        title: "Approved",
        leaves: leave,
        Approvedadministrator:Approvedadministrator
      });
    }


  } catch (err) {
    res.json({ message: err.message });
  }
};


// administrator loadRejected
const loadadministratorrejected = async (req, res) => {
  try {
    const findUserDepartment = await User.findOne({ _id: req.session.user_id });
    if (findUserDepartment) {
      const userDepartment = findUserDepartment.department; 
      // match department
      const userData = await User.findOne({
        $and: [
          { _id: req.session.user_id },
          { department: userDepartment }
        ]
        });

        const RejectedCount = await Leave.find({
          $and:[
            {status:"Administrator Rejected"},
            {d_name: userDepartment}
          ]
        });
     
        const leave = await Leave.find().exec();
      // user for home page
      res.render("administratorRejected", {
        title: "Rejected",
        leaves: leave,
        Pendingadministrator:RejectedCount, 
      });
    }


  } catch (err) {
    res.json({ message: err.message });
  }
};







const actionLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const leaveData = await Leave.findById({ _id: id });
    if (leaveData) {
      res.render("action", { leave: leaveData });
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};


const updateAction = async (req, res) => {
  try {
     const id = req.query.id;
      const userData = await Leave.findByIdAndUpdate(
        {_id:id},
        {
          $set: {
            name:req.body.name,
            eid:req.body.eid,
            leave_type:req.body.leave_type,
            start_date:req.body.start_date,
            end_date:req.body.end_date,
            days:req.body.days,
            status: req.body.status,
            reason: req.body.reason,
            

            // applied_date:Date(),
          },
        }
      );
    

    res.redirect("home");
  } catch (error) {
    console.log(error.message);
  }
};



const loadadmintable = async(req, res)=>{
  try {
    const users = await User.find({is_admin:1}).exec();
    res.render("admintable", {
      title: "admin",
      users: users,
    });
  } catch (err) {
    res.json({ message: err.message });
  }
};

const loaddepartment = async(req, res)=>{
  try {
    const departmentCount = await Department.find().count();
    const users = await Department.find().exec();
    res.render("department", {
      title: "department",
      users: users,
      departmentCount:departmentCount
    });
  } catch (err) {
    res.json({ message: err.message });
  }
};


const loadAddDepartment = async(req, res)=>{
  try {
    const users = await Department.find().exec();
    res.render("add_department", {
      title: "department",
      users: users,
    });
  } catch (err) {
    res.json({ message: err.message });
  }
};



const adddepartment = async (req, res) => {
  try {
    
    const dep = new Department({
      name: req.body.name,
      code: req.body.code
    });

    const depData = await dep.save();
      res.render("add_department",{message:"saved"});
      
  } catch (error) {
    console.log(error.message);
  }
};

// const userexport = async (req, res) => {
//   try {
//       const workbook = new ExcelJS.Workbook();
//       const worksheet = workbook.addWorksheet("My User");

//       worksheet.columns = [
//           { header: "S no", key: "s_no" },
//           { header: "Name", key: "name" },
//           { header: "Email", key: "email" },
//           { header: "Mobile", key: "mobile" },
//           { header: "Image", key: "image" },
//           { header: "address", key: "address" },
//           { header: "Designation", key: "designation" },
//           { header: "Is_admin", key: "is_admin" },
//           { header: "eid", key: "eid" },
//           { header: "department", key: "eidepartmentd" },
//       ];

//       let counter = 1;
//       const userData = await User.find({ is_admin: 0 });

//       userData.forEach((user) => {
//           user.s_no = counter;
//           worksheet.addRow(user);
//           counter++;
//       });

//       worksheet.getRow(1).eachCell((cell) => {
//           cell.font = { bold: true };
//       });

//       res.setHeader(
//           "Content-Type",
//           "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//       );
//       res.setHeader(
//           "Content-Disposition",
//           "attachment; filename=users.xlsx"
//       );

//       return workbook.xlsx.write(res).then(() => {
//           res.status(200).end();
//       });

//   } catch (error) {
//       console.log(error.message);
//   }
// };

// pdf


const userexport = async (req, res) => {
  try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("My User");

      worksheet.columns = [
          { header: "S no", key: "s_no" },
          { header: "Name", key: "name" },
          { header: "Email", key: "email" },
          { header: "Mobile", key: "mobile" },
          { header: "Image", key: "image" },
          { header: "address", key: "address" },
          { header: "Designation", key: "designation" },
          { header: "Is_admin", key: "is_admin" },
          { header: "eid", key: "eid" },
          { header: "department", key: "eidepartmentd" },
      ];

      let counter = 1;
      const userData = await User.find({ is_admin: 0 });

      userData.forEach((user) => {
          user.s_no = counter;
          worksheet.addRow(user);
          counter++;
      });

      worksheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true };
      });

      res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
          "Content-Disposition",
          "attachment; filename=users.xlsx"
      );

      return workbook.xlsx.write(res).then(() => {
          res.status(200).end();
      });

  } catch (error) {
      console.log(error.message);
  }
};


const userexportPdf = async (req, res) => {
  try {
    
      const html = fs.readFileSync('../views/admin/htmltopdf.html','utf-8');
    const options = {
      format:'letter'
    }

      pdf.create(html,options).toBuffer('../views/admin/invoice.pdf',(err,res)=>{
        if(err){
          return console.log(err);
        }else{
          console.log(res);
        }


        
      });
  } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
  }
};



module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  loadlogout,
  forgetLoad,
  forgetVerify,
  forgetPasswordLoad,
  resetPassword,
  verificationLoad,
  editLoad,
  updateProfile,
  loadDatabase,
  loadtable,
  loaddelete,
  loaddeleteLeave,
  loadProfile,
  loadRegister,
  insertUser,
  loadstatus,
  loadpending,
  loadrejected,
  loadapproved,
  actionLoad,
  updateAction,
  loadadmintable,
  loaddepartment,
  adddepartment,
  loadAddDepartment,
  userexport,
  userexportPdf,
  loaddomhome,
  loadadministrator,
  loadadministratorpending,
  loadadministratorapproved,
  loadadministratorrejected

};
