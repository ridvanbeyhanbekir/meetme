// app/routes.js
var Profile				= require('../app/models/profile');
var appCredentials 		= require('../config/applicationcredentials');
var moment 				= require('moment');
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
		res.render('login.ejs', { message: req.flash('loginMessage') });
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
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
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
			if (profile) {
				res.render('profile.ejs', {
					user : currentUser,	// get the user out of session and pass to template
					profile : profile
				});
			} else {
				res.render('profile.ejs', {
					user : currentUser,	// get the user out of session and pass to template
					profile : {}
				});
			}
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
			
		Profile.findOne({ '_linkedTo' :  currentUser._id }, function(err, profile) {
			// if there are any errors, return the error
            if (err)
                return console.log(err);

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
				
				// Link the user to the profile
				newProfile['_linkedTo'] = currentUser._id;
				newProfile['tagID'] = ['not_available'];
		  
				newProfile.save(function (err) {
					if (err) {
						console.log(err);
					}
				});
            }
			
			res.redirect('/profile');
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
};

// route middleware to make sure
function isNotLoggedIn (req, res, next) {
	// if user is not authenticated in the session, carry on
	if (!req.isAuthenticated())
		return next();

	// if they are redirect them to the profile page
	res.redirect('/profile');
}

// route middleware to make sure
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
