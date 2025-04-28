const Listing = require("../models/listing");
require('dotenv').config();
const axios = require('axios');
const mapToken = process.env.MAP_TOKEN;

module.exports.index = async (req, res, next) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};


module.exports.showListing = async (req, res, next) => {
  const { id } = req.params;
  console.log(`🔄 Processing showListing for ID: ${id}`); // Debug log

  try {
    let listing = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: { path: "author" },
      })
      .populate("owner");

    if (!listing) {
      console.log(`❌ Listing not found for ID: ${id}`);
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    // Debug current coordinates
    console.log('📍 Current coordinates:', listing.geometry?.coordinates || 'None');

    // Check if coordinates need updating
    const needsGeocoding = (
      !listing.geometry?.coordinates ||
      (listing.geometry.coordinates[0] === 0 && 
       listing.geometry.coordinates[1] === 0)
    );

    if (needsGeocoding) {
      console.log('🌍 Attempting geocoding for:', listing.location, listing.country);
      
      try {
        const geoRes = await axios.get('https://api.radar.io/v1/geocode/forward', {
          headers: {
            Authorization: process.env.RADAR_API_KEY
          },
          params: {
            query: `${listing.location}, ${listing.country}`
          }
        });

        if (geoRes.data?.addresses?.[0]?.geometry?.coordinates) {
          listing.geometry = {
            type: 'Point',
            coordinates: geoRes.data.addresses[0].geometry.coordinates
          };
          await listing.save();
          console.log('✅ Successfully updated coordinates to:', listing.geometry.coordinates);
        } else {
          console.log('⚠️ Geocoding response missing coordinates');
        }
      } catch (geoError) {
        console.error('⚠️ Geocoding API error:', geoError.message);
        // Continue with existing coordinates
      }
    }

    res.render("listings/show.ejs", { listing });
    console.log('✨ Successfully rendered listing'); // Confirm completion

  } catch (err) {
    console.error("❌ Error in showListing:", err.message);
    console.error(err.stack); // Full error stack
    next(err);
  }
};


module.exports.createListing = async (req, res, next) => {
  try {
    const { listing } = req.body;
    const address = listing.location;
    let coordinates = [0, 0]; // fallback

    // Handle geocoding for location
    const geoRes = await axios.get('https://api.radar.io/v1/geocode/forward', {
      headers: {
        Authorization: process.env.RADAR_API_KEY
      },
      params: {
        query: address
      }
    });

    if (
      geoRes.data?.addresses?.length > 0 &&
      geoRes.data.addresses[0].geometry?.coordinates
    ) {
      coordinates = geoRes.data.addresses[0].geometry.coordinates;
    } else {
      req.flash('error', 'Invalid address. Please enter a valid location.');
      return res.redirect('back');
    }

    // Create new listing with category
    const newListing = new Listing({
      ...listing,
      owner: req.user._id,
      image: {
        url: req.file.path,
        filename: req.file.filename
      },
      geometry: {
        type: 'Point',
        coordinates
      },
      category: listing.category // Store category
    });

    await newListing.save();
    res.redirect(`/listings/${newListing._id}`);
  } catch (err) {
    console.error('❌ Error creating listing:', err);
    next(err);
  }
};

module.exports.renderEditForm = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }

  let originalImage = listing.image.url.replace("/upload", "/upload/h_250,w_300");
  res.render("listings/edit.ejs", { listing, originalImage });
};


module.exports.updateListing = async (req, res, next) => {
  const { id } = req.params;

  try {
    const existingListing = await Listing.findById(id);
    if (!existingListing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }

    const newData = { ...req.body.listing };

    // 🔍 Check if location or category field has changed
    const locationChanged = newData.location && newData.location !== existingListing.location;
    const categoryChanged = newData.category && newData.category !== existingListing.category;

    // 🗺️ If location or category changed, geocode the new location (if necessary)
    if (locationChanged) {
      console.log("📍 Location changed. Geocoding new address...");

      const geoRes = await axios.get('https://api.radar.io/v1/geocode/forward', {
        headers: {
          Authorization: process.env.RADAR_API_KEY
        },
        params: {
          query: newData.location
        }
      });

      if (
        geoRes.data &&
        geoRes.data.addresses &&
        geoRes.data.addresses.length > 0 &&
        geoRes.data.addresses[0].geometry &&
        geoRes.data.addresses[0].geometry.coordinates
      ) {
        newData.geometry = {
          type: 'Point',
          coordinates: geoRes.data.addresses[0].geometry.coordinates
        };
      } else {
        console.warn("⚠️ Radar couldn't geocode the new location.");
        req.flash("error", "Invalid location. Couldn't update coordinates.");
        return res.redirect("back");
      }
    }

    // 💾 Update listing with new data
    let listing = await Listing.findByIdAndUpdate(id, newData, { new: true });

    // 📸 Handle image upload (if any)
    if (req.file) {
      const { path, filename } = req.file;
      listing.image = { url: path, filename };
      await listing.save();
    }

    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    console.error("❌ Error in updateListing:", err);
    next(err);
  }
};


module.exports.deleteListing = async (req, res, next) => {
  const { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);
  console.log("🗑️ Deleted listing:", deletedListing);
  req.flash("success", "Listing deleted successfully!");
  res.redirect("/listings");
};


module.exports.index = async (req, res, next) => {
  try {
    const { category, search } = req.query;
    
    let filter = {};

    // Filter by category if provided
    if (category) {
      filter.category = category;
    }

    // Filter by search term if provided
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    const allListings = await Listing.find(filter);

    // Render empty.ejs if no listings found
    if (allListings.length === 0) {
      return res.render("listings/empty.ejs", { 
        message: category 
          ? `No listings found in the ${category} category`
          : search
            ? `No listings found for "${search}"`
            : "No listings found",
        category,
        search
      });
    }

    res.render("listings/index.ejs", { allListings, category, search });
  } catch (err) {
    console.error("❌ Error in index route:", err);
    next(err);
  }
};


