const User = require('../models/user');
const Listing = require('../models/listing');
const Review = require('../models/review');

module.exports = {
    isAdmin: async (req, res, next) => {
        try {
            if (!req.user || !req.user._id) {
                req.flash('error', 'You must be logged in.');
                return res.redirect('/login');
            }

            const user = await User.findById(req.user._id).lean();
            if (!user) {
                req.flash('error', 'User not found.');
                return res.redirect('/login');
            }

            const isAdmin = (
                user._id.toString() === process.env.ADMIN_ID &&
                user.username === process.env.ADMIN_USERNAME &&
                user.email === process.env.ADMIN_EMAIL
            );

            if (!isAdmin) {
                req.flash('error', 'Access denied. Admins only.');
                return res.redirect('/listings');
            }

            next();
        } catch (err) {
            console.error('[isAdmin Middleware Error]:', err);
            req.flash('error', 'Something went wrong verifying admin.');
            res.redirect('/listings');
        }
    },

    adminPanel: async (req, res) => {
        try {
            const users = await User.find({}).lean();
            for (let user of users) {
                user.listings = await Listing.find({ owner: user._id }).lean();
            }
            res.render('users/admin', { users, currUser: req.user });
        } catch (err) {
            console.error('⚠️ Error loading admin panel:', err);
            req.flash('error', 'Failed to load admin panel');
            res.redirect('/listings');
        }
    },

    deleteUser: async (req, res) => {
        try {
            const { id } = req.params;
            
            // Delete all listings owned by the user
            await Listing.deleteMany({ owner: id });
            
            // Delete all reviews made by the user
            await Review.deleteMany({ author: id });
            
            // Delete all reviews on the user's listings (if you store them separately)
            // await Review.deleteMany({ listing: { $in: user.listings } });
            
            // Delete the user
            await User.findByIdAndDelete(id);
    
            req.flash('success', 'User and all associated data (listings, reviews) deleted!');
            res.redirect('/admin');
        } catch (err) {
            console.error('⚠️ Error deleting user:', err);
            req.flash('error', 'Failed to delete user and associated data.');
            res.redirect('/admin');
        }
    },

    deleteListing: async (req, res) => {
        try {
            const { id } = req.params;
            await Listing.findByIdAndDelete(id);

            req.flash('success', 'Listing deleted successfully!');
            res.redirect('/admin');
        } catch (err) {
            console.error('⚠️ Error deleting listing:', err);
            req.flash('error', 'Failed to delete listing.');
            res.redirect('/admin');
        }
    }
};
