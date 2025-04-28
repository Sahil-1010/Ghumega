const Review=require("../models/review.js");
const Listing=require("../models/listing");

module.exports.createReview=async(req,res)=>{
      console.log(req.params.id);
   let listing=await Listing.findById(req.params.id);
    let newReview=new Review(req.body.review);
      newReview.author=req.user._id;
      
    listing.reviews.push(newReview);
    
    await newReview.save();
    await listing.save();
    req.flash("success","New Review created successfully !");
    res.redirect(`/listings/${listing._id}`);
    
}

module.exports.deleteReview=async (req,res,next)=>{
      console.log(req.params.id);
      console.log(req.params.idr);
    let {id}=req.params;
    let {idr}=req.params;
    let deletedReview=await Review.findByIdAndDelete(idr);
    console.log(deletedReview);
    req.flash("success","Review Deleted successfully !");
    res.redirect(`/listings/${id}`);
}

module.exports.likeReview=async (req, res) => {
    const { id, idr } = req.params;

    let likedReview = await Review.findById(idr);

    if (!likedReview.like) {
        likedReview.like = 0; // fallback if like is undefined
    }

    likedReview.like += 1;
    await likedReview.save();

    res.redirect(`/listings/${id}`);
}