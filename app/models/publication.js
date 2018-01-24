// app/models/publication.js
// load the things we need
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

// define the schema for our user model
var publicationSchema = mongoose.Schema({
	
	_linkedTo: { type: Schema.Types.ObjectId, ref: 'Profile' },
	text: String,
    date: Date,
    locationId: {type: Schema.Types.ObjectId, ref: 'Location'}
});

// methods ======================

// create the model for users and expose it to our app
module.exports = mongoose.model('Publication', publicationSchema);