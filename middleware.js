const Listing = require("./models/listing");
const ExpressError=require("./utils/ExpressError.js");
const {listingSchema}=require("./schema.js");
const {reviewSchema}=require("./schema.js");
const Review = require("./models/review.js");

module.exports.isLoggedIn=(req,res,next)=>{
    // console.log(req);
    if(!req.isAuthenticated()){
        //redirectUrl
        req.session.redirectUrl = req.originalUrl; // 🔧 fix this!
        req.flash("error","You must be logged in to do that !");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
        delete req.session.redirectUrl; // clean it up ✨
    }
    next();
};

module.exports.isOwner=async(req,res,next)=>{
    let {id}=req.params;
    let listing=await Listing.findById(id);
       if(!listing.owner._id.equals(res.locals.currUser._id)){
          req.flash("error","You do not have permission to edit this listing !");
          return res.redirect(`/listings/${id}`);
       }
       next();
};

module.exports.validateListing=(req,res,next)=>{
        let {error} =  listingSchema.validate(req.body);
          console.log(error);
          if(error){
            let errMsg=error.details.map((el)=>el.message).join(",");
            throw new ExpressError(400,errMsg);
          }else{
            next();
          }
};

module.exports.validateReview=(req,res,next)=>{
        let {error} = reviewSchema.validate(req.body);
          console.log(error);
          if(error){
            let errMsg=error.details.map((el)=>el.message).join(",");
            throw new ExpressError(400,errMsg);
          }else{
            next();
          }
};

module.exports.isReviewAuthor=async(req,res,next)=>{
  let{id}=req.params;
  let {idr}=req.params;
  let review=await Review.findById(idr);
     if(!review.author._id.equals(res.locals.currUser._id)){
        req.flash("error","You do not have permission to delete this listing !");
        return res.redirect(`/listings/${id}`);
     }
     next();
};