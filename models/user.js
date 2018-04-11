var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

// User Schema
var UserSchema = mongoose.Schema({
	//password as key value
	password: {
		type: String
	},
	//email as key value
	email: {
		type: String
	},
	//name as key value
	name: {
		type: String
	}
});

var User = module.exports = mongoose.model('User', UserSchema);
//creating new user
module.exports.createUser = function(newUser, callback){
	//hashing password
	bcrypt.genSalt(10, function(err, salt) {
		console.log("user created");
	    bcrypt.hash(newUser.password, salt, function(err, hash) {
	    	console.log("password hashed");
	    	//hash password
	        newUser.password = hash;
	        //save user details in db
	        newUser.save(callback);
	    });
	});
}
//function to retrieve user details from db
module.exports.getUserByEmail = function(email, callback){
	//using email to retrieve user data from db
	var query = {email: email};
	User.findOne(query, callback);
}
//function to feed serialize/deserialize passport modeules
module.exports.getUserById = function(id, callback){
	//using id for serialize/deserialize
	User.findById(id, callback);
}

module.exports.comparePassword = function(candidatePassword, hash, callback){
	//comparing password after hashing again
	bcrypt.compare(candidatePassword, hash, function(err, isMatch) {
    	if(err) throw err;
    	callback(null, isMatch);
	});
}
