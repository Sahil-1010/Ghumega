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

        req.login(registeredUser, { keepSessionInfo: true }, (err) => {
            if (err) return next(err);
            req.flash("success", "Welcome to Ghumega, " + req.user.username + "!");
            req.session.save((saveErr) => {
                if (saveErr) console.error("[Session Save Error]:", saveErr);
                res.redirect("/listings");
            });
        });
    } catch (err) {
        req.flash("error", err.message);
        req.session.save((saveErr) => {
            if (saveErr) console.error("[Session Save Error]:", saveErr);
            res.redirect("/signup");
        });
    }
};

// Render Login Form
module.exports.renderLogin = (req, res) => {
    res.render("users/login.ejs");
};

// Full login flow — custom passport callback so we control every redirect and
// can call req.session.save() before each one. Without this, Atlas latency
// causes the session write to race with the browser following the redirect,
// meaning req.user is undefined on the next request (blank navbar, lost flash).
module.exports.loginHandler = (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);

        if (!user) {
            const msg = (info && info.message) || "Invalid username or password.";
            req.flash("error", msg);
            return req.session.save((saveErr) => {
                if (saveErr) console.error("[Session Save Error]:", saveErr);
                res.redirect("/login");
            });
        }

        req.logIn(user, { keepSessionInfo: true }, (loginErr) => {
            if (loginErr) return next(loginErr);
            req.flash("success", "Welcome back, " + user.username + "!");
            const redirectUrl = res.locals.redirectUrl || "/listings";
            req.session.save((saveErr) => {
                if (saveErr) console.error("[Session Save Error]:", saveErr);
                res.redirect(redirectUrl);
            });
        });
    })(req, res, next);
};

// Logout
module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "You logged out successfully!");
        req.session.save((saveErr) => {
            if (saveErr) console.error("[Session Save Error]:", saveErr);
            res.redirect("/listings");
        });
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


