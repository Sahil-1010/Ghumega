const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Listing=require("./models/listing.js");
const path=require("path");
const methodOverride= require("method-override")
const mongo_url="mongodb://127.0.0.1:27017/wanda";
const ejsMate=require("ejs-mate");

app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"/public")));
app.engine('ejs',ejsMate);

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));


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

app.get("/",async(req,res)=>{
    const allListings= await Listing.find({});
    res.render("listings/index.ejs",{allListings});
});

// app.get("/testListing",async (req,res)=>{
//     let sampleListing=new Listing({
//         title:"my new villa",
//         description:"by the beach",
//         price:1200,
//         location:"kolkata",
//         country:"india",
//     });
//     await sampleListing.save();
//     console.log("sample saved");
//     res.send("success test");
// });

//index route--------------------------------------------------------------------------------
app.get("/listings", async (req,res)=>{
    const allListings= await Listing.find({});
        // console.log(res);
        res.render("listings/index.ejs",{allListings});
});

//new route-----------------------------------------------------------------
app.get("/listings/new", async (req,res)=>{
    res.render("listings/new.ejs");
});


//show route-------------------------------------------------------------------------------
app.get("/listings/:id", async (req,res)=>{
    let {id}=req.params;
   const listing= await Listing.findById(id);
    res.render("listings/show.ejs",{listing});
});


//create route-------------------------------------------------------------------------------
app.post("/listings", async (req,res)=>{
    const newLisiting=new Listing(req.body.listing);
    await newLisiting.save();
    res.redirect("/listings");
});

//edit-------------------------------------------------------------------------------------------
app.get("/listings/:id/edit", async (req,res)=>{
    let {id}=req.params;
    const listing= await Listing.findById(id);
    res.render("listings/edit.ejs",{listing});
});

//update-----------------------------------------------------------------------------------------\
app.put("/listings/:id", async (req,res)=>{
    let {id}=req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing});
    res.redirect(`/listings/${id}`);
});


//delete-------------------------------------------------------------------------------------
app.delete("/listings/:id", async (req,res)=>{
    let {id}=req.params;
    let deletedListing=await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
});

app.listen(8080,()=>{
    console.log("server is listening on port 8080");
});