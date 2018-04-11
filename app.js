var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/Dropbox');
var db = mongoose.connection;
var MongoStore = require('connect-mongo')(session);
var kafka = require('kafka-node');
var fs = require("fs");
var upload = require('express-fileupload');
var nodemailer = require('nodemailer');

var routes = require('./routes/index');
var users = require('./routes/users');
var router = express.Router();

//Init App
var app = express();

//view engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout: 'layout'}) );
app.set('view engine', 'handlebars');

//bodyparses middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
//set public folder
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
	secret: 'cmpe273zee',
	saveUninitialized: true,
	resave : true,
	store : new MongoStore({mongooseConnection : mongoose.connection})
}));
//upload
app.use(upload());
//passport init
app.use(passport.initialize());
app.use(passport.session());

//express validator
app.use(expressValidator({
	errorFormatter : function(param, msg, value){
		var namespace = param.split('.'),
			root = namespace.shift(),
			formParam = root;

		while(namespace.length){
			formParam += '[' + namespace.shift() + ']';
		}
		return{
			param : formParam,
			msg : msg,
			value : value
		};
	}

}));

//connect flash
app.use(flash());

//Global variables
app.use(function(req, res, next){
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	//for passport error
	res.locals.error = req.flash('error');
	//to access user from anywhere
	res.locals.user = req.user || null;
	next();
});

app.use('/', routes);
app.use('/users', users);

//set port
app.set('port', (process.env.PORT || 3000));

app.listen(app.get('port'), function(){
		console.log('Server started on port ' + app.get('port'));
});
app.post('/uploads', function(req,res){
	console.log("upload");
	console.log(req.files);
	//if file exists
	if(req.files.filenames){
		//extracting file details
		var file = req.files.filenames,
			filename = file.name;
			//location of upload
			let des = path.join(__dirname,"./Uploads",filename);
			console.log("Uploaded at : " + des);
			file.mv(des, function(err){
				//if error
				if(err){
					console.log(err);
					res.send("error occured");
				}
				else{
					//re-render homepage with all details
					var directoryName = "Uploads";
					var dirBuffer = Buffer.from(directoryName);
					var allFiles = fs.readdirSync(directoryName);
					console.log("Files are:");
					console.log(allFiles);
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
				}
			});

		}
}); 
//create directory 
app.post('/createDirectory', function(req,res){
	//extracting information from html
	var dirName = req.body.directory;
	console.log(dirName);
	//path for creation
	fs.mkdirSync('./Uploads/' + dirName);
	console.log("New directory created!")
				//re-rendering homepage with all details
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

app.post('/share', function(req,res){
				console.log(req.body);
				var recipient = req.body.sharemail;
				//setting up transport service
				var mailSetup = nodemailer.createTransport({
				 service: 'gmail',
				 auth: {
				        user: 'zeeshancmpe273@gmail.com',
				        pass: 'zeeshandropbox'
    					}
				});
				//setting up auth object
				const mailInfo = {
				  from: 'zeeshancmpe273@gmail.com', // Sender 
				  to: recipient, // Receiver(s)
				  subject: 'Claim Dropbox file!', // Subject line
				  html: '<p>Hi. Zeeshan shared a Dropbox file with you. Please login or signup with Dropbox at http://localhost:3000/ </p>'// text body
				};
					//sending email
				mailSetup.sendMail(mailInfo, function (err, info) {
				   if(err)
				     console.log(err)
				   else
				   {
				   	console.log("Email sent:");
				     console.log(info);
				   }
});
				//re-rendering homepage with all details
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

app.get('/aboutMe', function(req,res){
	res.render('aboutMe',  function(err, result) {
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
var directoryName = "Uploads";
	var dirBuffer = Buffer.from(directoryName);
	var allFiles = fs.readdirSync(directoryName);

var Producer = kafka.Producer, 
    //KeyedMessage = kafka.KeyedMessage,
    client = new kafka.Client(),
    producer = new Producer(client),
    //km = new KeyedMessage('key', 'message'),
    payloads = [
        { topic: 'topic1', messages: allFiles, partition: 0 }
    ];
producer.on('ready', function () {
	console.log("producer ready!")
	
    producer.send(payloads, function (err, data) {
    	console.log("payload sent")
    	console.log("payload data")
        console.log(data);
    });
});

var Consumer = kafka.Consumer,
    client = new kafka.Client(),
    consumer = new Consumer(
        client,
        [
            { topic: 'topic1', partition: 0 }
        ],
        {
            autoCommit: false
        }
    );

consumer.on('message', function (message) {
	console.log("consumer ready!")
	console.log("message received")
	console.log("received payload data")
    console.log(message.value);
     });