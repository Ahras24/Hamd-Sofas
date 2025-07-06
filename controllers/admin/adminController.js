const Admin = require('../../models/adminModel')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt');


const getLogin =  (req,res)=>  {
    if(req.session.admin){
        return res.redirect('/admin/dashboard')
    }else {
        const errorMessage = req.session.errorMessage;
        req.session.errorMessage = null;
        res.render('admin/login', {errorMessage});
    }
}   
 
const postLogin = async (req,res)=>{

    try {
        const {email,password} = req.body;
        if(!email || !password){
            req.session.errorMessage = "All Fields are required"
            return res.redirect('/admin/login')
        }
        const admin = await Admin.findOne({email})

        if(admin){
            const isPasswordMatch = await bcrypt.compare(password,admin.password);
          if(isPasswordMatch){
            req.session.admin = true;
            req.session.successMessage = "Login Successfull"
             return res.redirect('/admin/dashboard')
            
           }else{
            req.session.errorMessage = "Invalid email or Password"
            return res.redirect('/admin/login') 
          }
        }else {
            req.session.errorMessage = "Invalid email or Password!"
            return res.redirect('/admin/login') 
        }

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({message : "Something went wrong :",error:error.message})
        
    }
}

const logout = (req,res)=>{
    req.session.admin = null;

    return res.redirect("/admin/login")
}



module.exports = {
    getLogin,
    postLogin,
    logout
}