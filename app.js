//jshint esversion:6
//require('dotenv').configure();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//const encrypt = require("mongoose-encryption");
/*const md5 = require("md5");*/
//const bcrypt = require("bcrypt");
//const saltRounds = 10;
const session = require('express-session');
var passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
   secret: "This is a secret",
   resave: false,
   saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});
// mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


//userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

//passport.serializeUser(User.serializeUser());
//passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: "965215957260-te3302i6jcc31t8k4sa3eiu7uh9kt6lq.apps.googleusercontent.com",
    clientSecret: "_yaJYQ8CkGZTudDa_CXZ-MkF",
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res){
    res.render("home");
});

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get('/auth/google',
  passport.authenticate('google', { scope:
      ["profile"] }
));

app.get("/login", function(req, res){
    res.render("login");
});

app.get("/register", function(req, res){


    res.render("register");
});

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
    res.render("secrets");
    } else {
        res.redirect("/login");
    }
}) 

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
});

app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
      if(err){
          console.log(err);
          res.redirect("/register");
      }  else{
          passport.authenticate("local")(req,res, function(){
            res.redirect("/secrets");
          });
      }
    })
/*
    bcrypt.hash(req.body.password, saltRounds, function(err, hash){
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        newUser.save(function(err){
            if(err){
                console.log(err);
            } else{
                res.render("secrets");
            }
        }); 
    });
     */
});

app.post("/login", function(req, res){
     const user = new User({
         username: req.body.username,
         password: req.body.password
     });
     req.login(user, function(err){
         if (err){
             console.log(err);
         } else {
             passport.authenticate("local")(req, res, function(){
                 res.redirect("/secrets");
             });
         }
     })
    /*
        const username =  req.body.username;
        const password =  req.body.password;
        
        User.findOne({email:username}, function(err, foundUser){
            if (err){
                console.log(err);
            } else{
                if(foundUser){
                    bcrypt.compare(password, foundUser.password, function(err, result){
                        if(result === true)
                        res.render("secrets");
                    }); 
                    
                }
            }
        })
        */
});

app.listen(3000, function(){
    console.log("server started");
});