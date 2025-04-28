if(process.env.NODE_ENV!=="production"){
   require("dotenv").config();
}


const express=require("express");
const router=express.Router();
const wrapAsync=require("../utils/wrapAsync.js");

const {isOwner,isLoggedIn,validateListing}=require("../middleware.js");

const listingsController=require("../controllers/listings.js");

const multer=require("multer");
const {cloudinary,storage}=require("../cloudConfig.js");
const upload=multer({storage});//temp storage location


//new route-----------------------------------------------------------------
router.get("/new",
   isLoggedIn,
   listingsController.renderNewForm);

router
   .route("/")
   .get(wrapAsync(listingsController.index))
   .post(
      isLoggedIn,
      validateListing,
      upload.single('listing[image]'),
      wrapAsync(listingsController.createListing)
   );

router
   .route("/:id")
   .get(
      validateListing,
      wrapAsync(listingsController.showListing))
   .put(
      isLoggedIn,
      isOwner,
      upload.single('listing[image]'),
      validateListing,
      wrapAsync(listingsController.updateListing))
   .delete(
      isLoggedIn,
      isOwner,
      wrapAsync(listingsController.deleteListing)
   );
//edit-------------------------------------------------------------------------------------------
router.get("/:id/edit",
   isLoggedIn,
   isOwner, 
   upload.single('listing[image]'),
   validateListing,
   wrapAsync(listingsController.renderEditForm));

module.exports=router;