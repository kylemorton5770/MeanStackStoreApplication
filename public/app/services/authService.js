angular.module('authService', [])

// ===================================================
// auth factory to login and get information
// inject $http for communicating with the API
// inject $q to return promise objects
// inject AuthToken to manage tokens
// ===================================================
.factory('Auth', function($http, $q, AuthToken) {

	// create auth factory object
	var authFactory = {};

	// log a user in
	authFactory.login = function(username, password) {

		console.log("login called with: " + username + " " + password);

		// return the promise object and its data
		return $http.post('https://nodestoreapp.herokuapp.com/authenticate', {
			username: username,
			password: password
		})
			.success(function(data) {
				console.log("successful login!");
				AuthToken.setToken(data.token);
       			return data;
			})
			.error(function(data) {
				console.log("Error: " + data);
				return "Error";
			});
	};

	// log a user out by clearing the token
	authFactory.logout = function() {
		// clear the token
		AuthToken.setToken();
	};

	// check if a user is logged in
	// checks if there is a local token
	authFactory.isLoggedIn = function() {
		console.log("Checking if logged in...");
		if (AuthToken.getToken()) {
			console.log("logged in...");
			return true;
		}
		else {
			console.log("Not Logged in...");
			return false;
		}

	};

	// get the logged in user
	authFactory.getUser = function() {
		if (AuthToken.getToken()) {
			// grab the token
			// var token = AuthToken.getToken();
			// config.headers['x-access-token'] = token;
			return $http.get('https://nodestoreapp.herokuapp.com/api/me', { cache: true });
		}

		else
			return $q.reject({ message: 'User has no token.' });
	};

	authFactory.createSampleUser = function() {
		$http.post('https://nodestoreapp.herokuapp.com/api/sample');
	};

	// return auth factory object
	return authFactory;

})

// ===================================================
// factory for handling tokens
// inject $window to store token client-side
// ===================================================
.factory('AuthToken', function($window) {

	var authTokenFactory = {};

	// get the token out of local storage
	authTokenFactory.getToken = function() {
		return $window.localStorage.getItem('token');
	};

	// function to set token or clear token
	// if a token is passed, set the token
	// if there is no token, clear it from local storage
	authTokenFactory.setToken = function(token) {
		if (token)
			$window.localStorage.setItem('token', token);
	 	else
			$window.localStorage.removeItem('token');
	};

	return authTokenFactory;

})

// ===================================================
// application configuration to integrate token into requests
// ===================================================
.factory('AuthInterceptor', function($q, $location, AuthToken) {

	console.log("Interceptor...");

	var interceptorFactory = {};

	// this will happen on all HTTP requests
	interceptorFactory.request = function(config) {

		// grab the token
		var token = AuthToken.getToken();

		console.log("Token Found: " + token);

		// if the token exists, add it to the header params as token
		if (token) {
			config.params = {'token' : token};
		}


		return config;
	};

	// happens on response errors
	interceptorFactory.responseError = function(response) {

		// if our server returns a 403 forbidden response
		if (response.status == 403) {
			AuthToken.setToken();
			$location.path('/login');
		}

		// return the errors from the server as a promise
		return $q.reject(response);
	};

	return interceptorFactory;

});
