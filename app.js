if(process.env.NODE_ENV!=="production"){
    require("dotenv").config();
}

const express=require("express");
const app=express();
const mongoose=require("mongoose");
const Listing=require("./models/listing.js");
const path=require("path");
const methodOverride= require("method-override")
// const mongo_url="mongodb://127.0.0.1:27017/wanda";

const dbUrl = process.env.ATLASDB_URL;

const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");
const session=require("express-session");
const MongoStore=require("connect-mongo");
const flash=require("connect-flash");

const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");

const listingRouter=require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");



app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"/public")));

app.engine('ejs',ejsMate);
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto:{ secret: process.env.SECRET },
    touchAfter: 24 * 60 * 60,
});

store.on("error", (e) => {
    console.log("Session store error:", e);
});

const sessionOption = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
};

// Passport config must come BEFORE passport middleware
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(session(sessionOption));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());


app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser=req.user;
    res.locals.ADMIN_ID = process.env.ADMIN_ID;
    console.log(`[AUTH] ${req.method} ${req.path} → user: ${req.user ? req.user.username : "guest"}`);
    next();
});

main()
    .then(()=>{
    console.log("connected to db");
})
    .catch((err)=>{
    console.log(err);
});
async function main() {
    await mongoose.connect(dbUrl);
}

//for listings==========================================================
app.use("/listings",listingRouter);
//for reviews==========================================================
app.use("/listings/:id/reviews",reviewRouter);


//for users==========================================================   
app.use("/",userRouter);

//for home page==========================================================
app.get("/", (req, res) => res.redirect("/listings"));

//middlewares================================================================================
app.all("*",    (req,res,next)=>{
    next(new ExpressError(404,"Page not found !"));
});

app.use((err,req,res,next)=>{
    let {statusCode=500,message="ku6 ho geya"}=err;
    res.status(statusCode).render("listings/error.ejs",{err});
    // res.status(statusCode).send(message);
});



const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`server is listening on port ${PORT}`);
});