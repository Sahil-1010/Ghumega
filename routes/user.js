const express = require("express");
const router = express.Router();
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedIn, saveRedirectUrl } = require("../middleware");
const { findUserListings } = require("../controllers/users");  // Only findUserListings from users
const { isAdmin } = require('../controllers/adminController'); // isAdmin properly from adminController
const userController = require("../controllers/users");
const adminController = require('../controllers/adminController');
const User = require("../models/user");
const Listing = require("../models/listing");

// Login routes
router.route("/login")
    .get(userController.renderLogin)
    .post(
        saveRedirectUrl,
        passport.authenticate("local", {
            failureFlash: true,
            failureRedirect: "/login"
        }),
        userController.loginHandler
    );

// Signup routes
router.route("/signup")
    .get(userController.renderSignup)
    .post(wrapAsync(userController.signup));

// Logout route
router.get("/logout", userController.logout);

// Profile route
router.get("/profile", 
    isLoggedIn, 
    findUserListings, 
    (req, res) => {
        res.render("listings/profile", {
            currUser: req.user,
            listings: req.userListings
        });
    }
);

router.get("/admin",
    isLoggedIn,
    isAdmin,
    adminController.adminPanel // ONLY this
);


// Delete a user and all their listings
router.delete('/admin/users/:id', 
    adminController.deleteUser);

// Delete a single listing
// Delete listing
router.delete('/admin/listings/:id',
     adminController.deleteListing);

module.exports = router;