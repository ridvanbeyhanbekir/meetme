// app/routes.js

// Models
var Profile				= require('../app/models/profile');
var Location			= require('../app/models/location');
var Publication			= require('../app/models/publication');

// Config/credentials
var appCredentials 		= require('../config/applicationcredentials');

// Libraries
var moment 				= require('moment');
var fs 					= require("fs");
var util				= require('./util');
var where 				= require('node-where');

// Local params
var profileFields 		= ['gender', 'name', 'birthDate', 'phone', 'email', 'image', 'education', 'graduatedFrom', 'profession', 'workplace', 'from', 'livesIn'];
var profileFieldRegex	= {
	email: "^[a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,15})$",
	phone: "^[0-9\-\+]{9,15}$"
};


module.exports = function(app, passport) {

// Social account login/logout actions
	// facebook -------------------------------

		// send to facebook to do the authentication
		app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

		// handle the callback after facebook has authenticated the user
		app.get('/auth/facebook/callback',
			passport.authenticate('facebook', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}));

	// twitter --------------------------------

		// send to twitter to do the authentication
		app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

		// handle the callback after twitter has authenticated the user
		app.get('/auth/twitter/callback',
			passport.authenticate('twitter', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}));


	// google ---------------------------------

		// send to google to do the authentication
		app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

		// the callback after google has authenticated the user
		app.get('/auth/google/callback',
			passport.authenticate('google', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

	// locally --------------------------------
		app.get('/connect/local', function(req, res) {
			res.render('connect-local.ejs', { message: req.flash('loginMessage') });
		});
		app.post('/connect/local', passport.authenticate('local-signup', {
			successRedirect : '/profile', // redirect to the secure profile section
			failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

	// facebook -------------------------------

		// send to facebook to do the authentication
		app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

		// handle the callback after facebook has authorized the user
		app.get('/connect/facebook/callback',
			passport.authorize('facebook', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}));

	// twitter --------------------------------

		// send to twitter to do the authentication
		app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

		// handle the callback after twitter has authorized the user
		app.get('/connect/twitter/callback',
			passport.authorize('twitter', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}));


	// google ---------------------------------

		// send to google to do the authentication
		app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

		// the callback after google has authorized the user
		app.get('/connect/google/callback',
			passport.authorize('google', {
				successRedirect : '/profile',
				failureRedirect : '/'
			}));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

	// local -----------------------------------
	app.get('/unlink/local', function(req, res) {
		var user            = req.user;
		user.local.email    = undefined;
		user.local.password = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// facebook -------------------------------
	app.get('/unlink/facebook', function(req, res) {
		var user            = req.user;
		user.facebook.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// twitter --------------------------------
	app.get('/unlink/twitter', function(req, res) {
		var user           = req.user;
		user.twitter.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

	// google ---------------------------------
	app.get('/unlink/google', function(req, res) {
		var user          = req.user;
		user.google.token = undefined;
		user.save(function(err) {
			res.redirect('/profile');
		});
	});

//------------------------------------------------------------------------------
	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
		res.render('index.ejs', {
			req: req
		}); // load the index.ejs file
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', isNotLoggedIn , function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('login.ejs', { 
			req: req,
			message: req.flash('loginMessage') 
		});
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', isNotLoggedIn, function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('signup.ejs', { 
			req: req,
			message: req.flash('signupMessage') 
		});
	});

	// process the signup form
	app.post('/signup', util.checkSubmittedPasswords, passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res) {
		
		var currentUser = req.user;
		var currentProfile = {};
		Profile.findOne({ '_linkedTo' :  currentUser._id }, function (err, profile) {
			if (err) console.log(err);
			profile = profile || {};

			res.render('profile.ejs', {
				req: req,
				user: currentUser,	// get the user out of session and pass to template
				profile: profile
			});
		});
	});
	
	// =====================================
	// ADD PROFILE POST REQUEST =========================
	// =====================================
	// we will want this protected so you have to be logged in to create a profile
	// we will use route middleware to verify this (the isLoggedIn function)
	app.post('/profile/editprofile', isLoggedIn, function(req, res) {
		
		var currentUser = req.user,
			currentProfile = {},
			requestBody = req.body;

		var imageName = req.files.file.name;
        var newPath = __dirname + "\\uploads\\original\\" + imageName;
		var convertedPath = __dirname + "\\uploads\\converted\\" + imageName;
			
		Profile.findOne({ '_linkedTo' :  currentUser._id }, function(err, profile) {
			// if there are any errors, return the error
            if (err)
                return console.log(err);

            
            util.readImageFileFromRequest(req, newPath, convertedPath, imageName).then(function () {
            	// convert binary data to base64 encoded string
            	var uploadedImage = '';

            	if (imageName && imageName !== null && imageName !== null && fs.existsSync(convertedPath)) {
            		var buffer = fs.readFileSync(convertedPath);

			    	uploadedImage = new Buffer(buffer).toString('base64');
			    }

	            // check if there is already defined profile for that user
	            if (profile) {
					// Iterate through the profile fields and set the passed ones only				
					profileFields.forEach(function (profileField) {
						if (profileField in requestBody && requestBody[profileField].trim() !== '') {
							if (profileField === "birthDate") {
								profile[profileField] = moment(requestBody[profileField]).format("YYYY-MM-DD");
							} else {
								if (profileField in profileFieldRegex && !(new RegExp(profileFieldRegex[profileField]).test(requestBody[profileField]))) {
									profile[profileField] = '';
									return;
								}
								profile[profileField] = requestBody[profileField];
							}
						}
					});

					if (typeof(uploadedImage) !== 'undefined' && uploadedImage !== '') {
						profile['image'] = 'data:image/png;base64,' + uploadedImage;
					}
					
					profile.save(function (err) {
						if (err) {
							console.log(err);
						}
					});
	            } else {
					var newProfile = new Profile(); // Create new profile instance
					
					// Iterate through the profile fields and set the profile fields				
					profileFields.forEach(function (profileField) {
						if (profileField in requestBody && requestBody[profileField].trim() !== '') {
							if (profileField === "birthDate") {
								newProfile[profileField] = moment(requestBody[profileField]).format("YYYY-MM-DD");
							} else {
								if (profileField in profileFieldRegex && !(new RegExp(profileFieldRegex[profileField]).test(requestBody[profileField]))) {
									newProfile[profileField] = '';
									return;
								}
								newProfile[profileField] = requestBody[profileField];
							}
						}
					});

					if (typeof(uploadedImage) !== 'undefined' && uploadedImage !== '') {
						profile['image'] = 'data:image/png;base64,' + uploadedImage;
					}
					
					// Link the user to the profile
					newProfile['_linkedTo'] = currentUser._id;
					newProfile['tagID'] = ['not_available'];
			  
					newProfile.save(function (err) {
						if (err) {
							console.log(err);
						}
					});
	            }

	            if (imageName && imageName !== null && imageName !== null) {
	            	//Delete the locally saved files
		            if (fs.existsSync(req.files.file.path)) fs.unlink(req.files.file.path);
		            if (fs.existsSync(newPath)) fs.unlink(newPath);
		           	if (fs.existsSync(convertedPath)) fs.unlink(convertedPath);
	            }

				res.render('updatesuccess.ejs', {
					req : req
				});
            });
		});
	});
	
	// =====================================
	// UPDATE PROFILE REQUEST ==============
	// =====================================
	// REQUIRED PARAMS:
	// - appclientid
	// - appclienttoken
	// - tagid
	app.post('/getprofileinfo', function(req, res) {
		
		var requestAppClientID 		= req.headers['appclientid'],
			requestAppClientToken 	= req.headers['appclienttoken'],
			requestTagID 			= req.headers['tagid'];

		if (isValidRequest(requestAppClientID, requestAppClientToken, requestTagID)) {
			Profile.findOne({ tagID : {$all : [requestTagID]} }, function(err, profile) {
				// if there are any errors, return the error
	            if (err)
	                return console.log(err);

	            // check if there is already defined profile for that user
	            res.setHeader('Content-Type', 'application/json');
	            if (profile) {
	    			res.send(JSON.stringify(profile));
	            } else {
	            	res.send('{success: false, error: "Person not found!"}');
	            }
			});
		} else {
			res.status(404).end('error');
		}
	});

	// =====================================
	// ADD PROFILE GET REQUEST =========================
	// =====================================
	// in case there is a get request, render the profile page.
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile/editprofile', isLoggedIn, function(req, res) {
		res.redirect('/profile');
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	app.post('/visits/submit', isLoggedIn, function (req, res) {
		var requestBody = req.body;
		var currentUser = req.user;

		Profile.findOne({ '_linkedTo' :  currentUser._id }, function (err, profile) {
			if (err) console.log(err);

			if (profile) {
				var newPublication = new Publication(); // Create new publication instance
				newPublication['_linkedTo'] = profile._id;
				newPublication['date'] = moment().format();
				newPublication['text'] = 'publicationText' in requestBody ? requestBody['publicationText'] : '';

				//Create new or get existing location instance
				var locationId = '';
				Location.findOne({'placeId' : requestBody['locationId']}, function (err, location) {
					if (err) console.log(err);

					var currentLocation = {}
					if (location) {
						currentLocation = location;
					} else {
						var newLocation = new Location();
						Object.keys(requestBody).forEach(function (requestBodyKey) {
							switch (requestBodyKey) {
								case 'locationId': newLocation['placeId'] = requestBody[requestBodyKey]; break;
								case 'locationName': newLocation['name'] = requestBody[requestBodyKey]; break;
								case 'locationAddress': newLocation['address'] = requestBody[requestBodyKey]; break;
								case 'locationLat': newLocation['latitute'] = requestBody[requestBodyKey]; break;
								case 'locationLng': newLocation['longitude'] = requestBody[requestBodyKey]; break;
								default: break;
							}
						});

						newLocation.save(function (err) {
							if (err) {
								console.log(err);
							}
						});

						currentLocation = newLocation;
					}

					newPublication['locationId'] = '_id' in currentLocation ? currentLocation._id : '';
					newPublication.save(function (err) {
						if (err) {
							console.log(err);
						}
					});
				});
			}
		});

		res.redirect('/visits');
	});

	function getVisitedPlacesInfo(locationId, currentPublication, profileVisitsArray) {
		return new Promise(function (resolve, reject) {
			Location.findOne({'_id' : locationId}, function (err, location) {
				if (err) {
					console.log(err);
					reject(err);
				}

				if (location) {
					profileVisitsArray.push({
						date: 'date' in currentPublication ? currentPublication.date : new Date(),
						address: 'address' in location ? location.address : '',
						name: 'name' in location ? location.name : '',
						publicationText: 'text' in currentPublication ? currentPublication.text : ''
					});
				}
				resolve(profileVisitsArray);
			});
		});
	}

	app.get('/visits', isLoggedIn, function (req, res) {

		var currentUser = req.user;
		var profileVisitsArray = new Array();
		var currentProfile = {};
		var publicationsArray = new Array();

		Profile.findOne({ '_linkedTo' :  currentUser._id }, function (err, profile) {
			if (err) console.log(err);

			if (profile) currentProfile = profile;
		}).then(function () {
			return new Promise(function (resolve, reject) {
				Publication.find({ '_linkedTo' : currentProfile._id }, function (err, publications) {
					if (err) {
						console.log(err);
						reject(err);
					}
					publicationsArray = Object.keys(publications).map(function(key) { return publications[key] });
					resolve(publicationsArray);
				});
			});
		}).then(function () {
			var promises = new Array();
			var publicationsLength = publicationsArray.length;
			var index = 0;
			for (index; index < publicationsLength; index++) {
				var currentPublication = publicationsArray[index];
				var locationId = 'locationId' in currentPublication ? currentPublication.locationId : '';

				if (locationId !== '') {
					promises.push(getVisitedPlacesInfo (locationId, currentPublication, profileVisitsArray));
				}
			}

			return Promise.all(promises);

		}).then(function () {
			//Location params
			var locationObject = {
				lat: 42.698334,
				lng: 23.319941
			};

			var ip = req.connection.remoteAddress || 
	        		req.socket.remoteAddress || 
	        		req.connection.socket.remoteAddress;

			// get current user location
			where.is(ip, function (err, result) {
				if (result) {
					locationObject.lat = result.get('lat');
					locationObject.lng = result.get('lng');
				}
			});

			res.render('visits.ejs', {
				req: req,
				user: currentUser,
				profile: currentProfile,
				profileVisitsArray: profileVisitsArray,
				locationInfo: locationObject
			});
		});
	});
};

// route middleware to make sure user is authenticated
function isNotLoggedIn (req, res, next) {
	// if user is not authenticated in the session, carry on
	if (!req.isAuthenticated())
		return next();

	// if they are redirect them to the profile page
	res.redirect('/profile');
}

// route middleware to make sure user is authenticated
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the login page
	res.redirect('/login');
}

function isValidRequest (clientID, clientToken, tagID) {
	if (!clientID || !clientToken || !tagID || 
		clientID === '' || clientToken === '' || tagID === '') {
			return false;
	}

	return (clientID === appCredentials.appClientID && clientToken === appCredentials.appClientToken);
}
