// app/models/profile.js
// load the things we need
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

// define the schema for our user model
var profileSchema = mongoose.Schema({
	
	_linkedTo: { type: Schema.Types.ObjectId, ref: 'User' },
	tagID: Array,
	gender: Number,
    name: String,
    birthDate: String,
	phone: String,
	email: String,
	education: String,
	graduatedFrom: String,
	profession: String,
	workplace: String,
	from: String,
	livesIn: String,
	image: String
});

// methods ======================

// create the model for users and expose it to our app
module.exports = mongoose.model('Profile', profileSchema);
