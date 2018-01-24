var visits = {
	determineLatLong: function (location) {
		var latitude = location.coords.latitude;
		var longitude = location.coords.longitude;
		$('.location-sharing-blocked').addClass('hide');
		visits.drawMap(latitude, longitude);
		visits.prefillStoreForm(latitude, longitude);
	},
	drawMap: function (latitude, longitude) {
		var _self = this;
		var myOptions = {
			zoom: 10,
			mapTypeId: google.maps.MapTypeId['ROAD_MAP']
		};

		var myLatLng = {lat: latitude, lng: longitude};

		var map = new google.maps.Map(document.getElementById('map_canvas'), myOptions);
		$('#map_canvas').css('visibility', 'visible');
		
		map.setCenter(new google.maps.LatLng(latitude, longitude));

		window.map = map;

		var currentPositionImageURL = $('#currentpositionpinimage').val();

		var marker = new google.maps.Marker({
			position: myLatLng,
			map: map,
			title: 'Current position',
			icon: currentPositionImageURL
		});

		// set click event listener on the map
		google.maps.event.addListener(map, 'click', function(event) {
		    mapZoom = map.getZoom();
		    var placeId = event.placeId;
		    _self.prefillPublicationInfo(placeId);
		});

		// set click event listener on the marker
		google.maps.event.addListener(marker, 'click', function() {
           _self.reverseGeolocationSearch($('input[name="userAddress"]').val());
        });

		window.currentPosition = {};
		window.currentPosition = marker.position;
		window.centralMarker = marker;

		//directionsDisplay = new google.maps.DirectionsRenderer();
		//directionsDisplay.setMap(window.map);
		//directionsDisplay.setOptions({suppressMarkers: true});
		//window.directionsService = {};
		//window.directionsService = new google.maps.DirectionsService();
	},
	prefillStoreForm: function (latitude, longitude) {
		var url = 'https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyCip8Cpx_evSkbz4cVfY4igR2ZJkX5eyso&latlng={0}&sensor=false';
		url = url.replace('{0}', latitude.toString() + ',' + longitude.toString());
		$.ajax({
			url: url,
			type: 'POST',
			dataType: 'json',
			success: function (response) {
				if (response.status === 'OK') {
					if (response.results[0]) {
						var formattedAddress = response.results[0].formatted_address;
						$('input[name="userAddress"]').val(formattedAddress);
					}
				}
			}
		});
	},
	updateFormElementsWithInfo: function (data) {
		if (Object.keys(data).length > 0) {
			var $placeNameElement = $('a[name="publicationPlaceName"]');
	        $placeNameElement.text(data.placeName);
	        $placeNameElement.attr('title','See the location from the map.');

	        //Set the values to the hidden input fields
	        $('input[name="locationId"]').val(data.placeId);
	        $('input[name="locationName"]').val(data.placeName);
	        $('input[name="locationAddress"]').val(data.placeAddress);
	        $('input[name="locationLat"]').val(data.coords.lat);
	        $('input[name="locationLng"]').val(data.coords.lng);
		}
	},
	prefillPublicationInfo: function (placeId) {
		if (!placeId) {
			return;
		}

		var _self = this;
		var service = new google.maps.places.PlacesService(window.map);

        service.getDetails({
          placeId: placeId
        }, function(place, status) {
          if (status === google.maps.places.PlacesServiceStatus.OK) {

          	var data = {
          		placeId: placeId,
          		placeName: place.name || '',
          		placeAddress: place.formatted_address || '',
				coords: {
	            	lat: place.geometry.location.lat(),
	            	lng: place.geometry.location.lng()
	            }
          	}

          	var marker = new google.maps.Marker({
              map: window.map,
              position: place.geometry.location,
              title: data.placeName,
            });

            google.maps.event.addListener(marker, 'click', function() {
               _self.updateFormElementsWithInfo(data);
            });

            window.currentPosition = {};
			window.currentPosition = marker.position;
			window.centralMarker = marker;

            _self.updateFormElementsWithInfo(data);
          }
        });
	},
	getUserGeoLocation: function (preloadMap) {
		var _self = this;
		if (preloadMap) {
			var latitude = parseFloat($('#geolocation_latitude').val());
			var longitude = parseFloat($('#geolocation_longitude').val());
			this.prefillStoreForm(latitude, longitude);
			this.drawMap(latitude, longitude);
		}
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(_self.determineLatLong, function (error) {
				if (error.code === 1/*permission dennied*/) {
					$('.location-sharing-blocked').removeClass('hide');
				}
			});
		}
	},
	reverseGeolocationSearch: function (searchValue) {
		var _self = this;
		var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + searchValue + '&key=AIzaSyCip8Cpx_evSkbz4cVfY4igR2ZJkX5eyso';
		$.ajax({
			url: url,
			type: 'POST',
			dataType: 'json',
			success: function (response) {
				if (response.status === 'OK') {
					if (response.results[0]) {
						var placeSearchResult = response.results[0];
						var geometryParams = placeSearchResult.geometry;
						var latitude = geometryParams['location']['lat'];
						var longitude = geometryParams['location']['lng'];
						var placeId = placeSearchResult.place_id;

						_self.determineLatLong({
							coords: {
								latitude: latitude,
								longitude: longitude
							}
						});

						_self.prefillPublicationInfo(placeId);
					}
				}
			}
		});
	},
	toggleMapContainer: function () {
		$('.map-show').toggleClass('hide');
		$('.map-hide').toggleClass('hide');

		var $mapContainer = $('.map-container');
		if ($mapContainer.hasClass('hide')) {
			$mapContainer.removeClass('hide');
		} else {
			$mapContainer.slideToggle();
		}
	},
	initializeVisitPageEvents: function () {
		var _self = this;
		$(document).ready(function () {
			_self.getUserGeoLocation(true);
		});

		$('.map-hide, .map-show').on('click', function () {
			_self.toggleMapContainer();
		});

		$('body').on('keydown', function (e) {
			var keyCode = (event.keyCode ? event.keyCode : event.which);   
		    if (keyCode == 13) {
		        $('.place-search-button .btn-primary').trigger('click');
		    }
		});

		$('body').on('click', '.place-search-button .btn-primary', function (e) {
			e.preventDefault();
			var searchValue = $('input[name="userAddress"]').val();
			if (searchValue === '') {
				return;
			}

			_self.reverseGeolocationSearch(searchValue);
		});

		$('body').on('click','.geolocate-button .btn-primary', function (e) {
			e.preventDefault();
			_self.getUserGeoLocation(true);
		});

		$('body').on('click', '#find-in-map', function () {
			var $this = $(this);
			if (!$('.map-container').is(':visible')) {
				_self.toggleMapContainer();
				_self.reverseGeolocationSearch($this.text());
			}
		});
	},
	init: function () {
		this.initializeVisitPageEvents();
	}
};