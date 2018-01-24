// app/models/location.js
// load the things we need
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

// define the schema for our user model
var locationSchema = mongoose.Schema({
	placeId: String,
    latitute: Number,
    longitude: Number,
	address: String,
	name: String
});

// methods ======================

// create the model for users and expose it to our app
module.exports = mongoose.model('Location', locationSchema);