var Jimp 	= require("jimp");
var sizeOf	= require('image-size');
var fs 		= require("fs");
/*
*	Static helper functions
*/
var util = {
	checkSubmittedPasswords: function (req, res, next) {
		var password = req.body.password;
		var passwordConfirm = req.body.passwordConfirm;

		if (password === passwordConfirm) return next();

		req.session.formData = req.body;
		res.redirect('back');
	},
	calculateImageDimensions: function (width,height,maxWidth,maxHeight) {
	    // calculate the width and height, constraining the proportions
	    if (width > height) {
	        if (width > maxWidth) {
	            height = Math.round(height *= maxWidth / width);
	            width = maxWidth;
	        }
	    }
	    else {
	        if (height > maxHeight) {
	            width = Math.round(width *= maxHeight / height);
	            height = maxHeight;
	        }
	    }

	    return {
	    	width: width,
	    	height: height
	    };
	},

	readImageFileFromRequest: function (req, newPath, convertedPath, imageName) {
		var _self = this;

		return new Promise(function(resolve,reject) {
			if (!imageName || imageName === '' || imageName === null) {
				resolve();
			} else {
				try {
					fs.readFile(req.files.file.path, function (err, data) {
				    	if (err) {
				    		console.log(err);
				    		resolve();
				    		return true;
				    	}

				    	var imageByteLength = data.byteLength;
				    	var maxImageBytes = 2000000;

				    	if (imageByteLength < maxImageBytes) { // Check if image is more that 2 MB
				    		if(newPath !== null && newPath !== '' && convertedPath !== null && convertedPath !== '') {
						      fs.writeFile(newPath, data, function (err) {
						      	if (err) {
						      		console.log(err);
						      		return true;
						      	}

						      	var originalDimensions = sizeOf(newPath);
						      	var convertedDimensions = _self.calculateImageDimensions(originalDimensions.width, originalDimensions.height, 1280, 1280);//Get proportionate dimensions
								Jimp.read(newPath, function (err, image) {
								    if (err) throw err;
								    image.resize(convertedDimensions.width, convertedDimensions.height)      			// resize 
								         .quality(15)
								         .write(convertedPath, function () {
								         	resolve();
								         }); // save 
								});
						      });
						    }
				    	} else {
				    		resolve();
				    	}
					});
				} catch (e) {
					resolve();
				}
			}
	    });
	}
};

module.exports = util;