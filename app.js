const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Listing=require("./models/listing.js");
const path=require("path");
const methodOverride= require("method-override")
const mongo_url="mongodb://127.0.0.1:27017/wanda";
const ejsMate=require("ejs-mate");
const wrapAsync=require("./utils/wrapAsync.js");
const ExpressError=require("./utils/ExpressError.js");
const { STATUS_CODES } = require("http");
const {listingSchema}=require("./schema.js");

app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"/public")));

app.engine('ejs',ejsMate);

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));

//validate function======================================================================
const validateListing=(req,res,next)=>{
    let {error} =  listingSchema.validate(req.body);
      console.log(error);
      if(error){
        let errMsg=error.details.map((el)=>el.message).join(",");
        throw new ExpressError(400,errMsg);
      }else{
        next();
      }
}

main()
    .then(()=>{
    console.log("connected to db");
})
    .catch((err)=>{
    console.log(err);
});
async function main() {
    await mongoose.connect(mongo_url);
}

app.get("/", validateListing,
    wrapAsync(async(req,res)=>{
    const allListings= await Listing.find({});
    res.render("listings/index.ejs",{allListings});
}));


//index route--------------------------------------------------------------------------------
app.get("/listings",  validateListing,
     wrapAsync(async (req,res,next)=>{
    const allListings= await Listing.find({});
        // console.log(res);
        res.render("listings/index.ejs",{allListings});
}));

//new route-----------------------------------------------------------------
app.get("/listings/new",   validateListing,
    wrapAsync(async (req,res,next)=>{
    res.render("listings/new.ejs");
}));


//show route-------------------------------------------------------------------------------
app.get("/listings/:id",   validateListing,
    wrapAsync(async (req,res,next)=>{
    let {id}=req.params;
   const listing= await Listing.findById(id);
    res.render("listings/show.ejs",{listing});
}));


//create route-------------------------------------------------------------------------------
app.post("/listings", validateListing,
    wrapAsync(async (req,res,next)=>{
    const newLisiting=new Listing(req.body.listing);
    await newLisiting.save();
    res.redirect("/listings");
    })
);

//edit-------------------------------------------------------------------------------------------
app.get("/listings/:id/edit",  validateListing,
    wrapAsync(async (req,res,next)=>{
    let {id}=req.params;
    const listing= await Listing.findById(id);
    res.render("listings/edit.ejs",{listing});
}));

//update-----------------------------------------------------------------------------------------\
app.put("/listings/:id",  validateListing,
    wrapAsync(async (req,res,next)=>{
        if(!req.body.listing){
            throw new ExpressError(400,"user gandu hai");
        }
    let {id}=req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing});
    res.redirect(`/listings/${id}`);
}));


//delete-------------------------------------------------------------------------------------
app.delete("/listings/:id",   validateListing,
    wrapAsync(async (req,res,next)=>{
    let {id}=req.params;
    let deletedListing=await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
}));

//middlewares================================================================================
app.all("*",    (req,res,next)=>{
    next(new ExpressError(404,"Page not found !"));
})


app.use((err,req,res,next)=>{
    let {statusCode=500,message="ku6 chud geya"}=err;
    res.status(statusCode).render("listings/error.ejs",{err});
    // res.status(statusCode).send(message);
});

app.listen(8080,()=>{
    console.log("server is listening on port 8080");
});