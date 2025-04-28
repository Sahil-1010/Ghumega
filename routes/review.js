const express=require("express");
const router=express.Router({mergeParams:true});
const wrapAsync=require("../utils/wrapAsync.js");

const Listing=require("../models/listing.js");
const {validateReview,isLoggedIn,isReviewAuthor}=require("../middleware.js");

const reviewController = require("../controllers/reviews.js");

//===========reviews======================

//post----------------------------------
router.post("/",
  validateReview,
  isLoggedIn,
  wrapAsync(reviewController.createReview));

//delete--------------------------------------------
router.delete("/:idr",
  isLoggedIn,
  isReviewAuthor,
  wrapAsync(reviewController.deleteReview));

//likes----------------------------------------------
router.put("/:idr/like",
  isLoggedIn,
  wrapAsync(reviewController.likeReview));

module.exports=router;

