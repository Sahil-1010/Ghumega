const User = require("../models/user");
const passport = require("passport");
const Listing = require("../models/listing");
const mongoose=require("mongoose");
require('dotenv').config();

// Render Signup Form
module.exports.renderSignup = (req, res) => {
    res.render("users/signup.ejs");
};

// Signup Logic
module.exports.signup = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new User({ username, email });
        const registeredUser = await User.register(newUser, password);

        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash("success", "Logged in successfully. Welcome " + req.user.username);
            res.redirect("/listings");
        });
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/signup");
    }
};

// Render Login Form
module.exports.renderLogin = (req, res) => {
    res.render("users/login.ejs");
};

// Login Handler After Passport Auth
module.exports.loginHandler = async (req, res) => {
    const redirectUrl = res.locals.redirectUrl || "/listings";
    req.flash("success", "Logged in successfully. Welcome " + req.user.username);
    res.redirect(redirectUrl);
};

// Logout
module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "You logged out successfully!");
        res.redirect("/listings");
    });
};

// Find User Listings

module.exports.findUserListings = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      req.flash('error', 'You must be logged in.');
      return res.redirect('/login');
    }

    const userListings = await Listing.find({ owner: req.user._id })  // no manual ObjectId needed
      .populate('owner')
      .populate('reviews')
      .lean();  // Make results plain JS objects, faster rendering

    req.userListings = userListings;
    next();
  } catch (err) {
    console.error('[FindUserListings Error]:', err);
    req.flash('error', 'Error loading your listings.');
    res.redirect('/listings');
  }
};


