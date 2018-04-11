var express = require('express');
var router = express.Router();
var fs = require("fs");


    router.get('/', isitAuthenticated, function(req, res){
	var directoryName = "Uploads";
	var dirBuffer = Buffer.from(directoryName);
	var allFiles = fs.readdirSync(directoryName);
	res.render('index', {data : allFiles}, function(err, result) {
			        // render on success
			        if (!err) {
			            res.send(result);
			        }
			        // render or error
			        else {
			            res.end('An error occurred');
			            console.log(err);
			        };
	});
   
});

//Get Homepage


	

// });
function isitAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		return next();
	} else {

		res.redirect('/users/login');
	}
}

module.exports = router;