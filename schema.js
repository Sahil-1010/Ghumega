const joi=require('joi');

module.exports.listingSchema = joi.object({
    listing: joi.object({
        title: joi.string().required(),
        description: joi.string().required(),
        location: joi.string().required(),
        country: joi.string().required(),
        price: joi.number().required().min(100),
        image: joi.string().allow("", null),
        category: joi.string()
            .valid(
                "Trending",
                "Rooms",
                "Cities",
                "Mountains",
                "Castel",
                "Pools",
                "Camping",
                "Farms",
                "Sea beach",
                "Arctic"
            ).required()
    })
});


module.exports.reviewSchema=joi.object({
    review:joi.object({
        rating:joi.number().required().min(1).max(5),
        comment:joi.string().required(),
        like:joi.number().allow().min(0),
    }).required()
});