// server.js

    // set up ========================
    var express  = require('express');
    var app      = express();                               // create our app w/ express
    var mongoose = require('mongoose');                     // mongoose for mongodb
    var morgan = require('morgan');             // log requests to the console (express4)
    var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
    var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
    var swig = require('swig');

        // configuration =================
    app.engine('html', swig.renderFile);
    app.set('view engine', 'html');
    app.set('views', './');

    //mongoose.connect('mongodb://node:nodeuser@mongo.onmodulus.net:27017/uwO3mypu');     // connect to mongoDB database on modulus.io
    mongodb_connection_string = 'mongodb://localhost/todo';
    if(process.env.OPENSHIFT_MONGODB_DB_URL){
        mongodb_connection_string = process.env.OPENSHIFT_MONGODB_DB_URL + db_name;
    }

    mongoose.connect(mongodb_connection_string);

    // define model =================
   var Todo = mongoose.model('Todo', {
       text : String,
       tags: {type: [], index: true },
       priority: Number
   });

    // social sharing - serve og optimized page

    var bot_router = express.Router();
    bot_router.get('/todo/:id',function(req,res){
      var page_url = req.protocol + '://' + req.get('host') + req.url;
      var _id = req.params.id;

      var page_title = 'Test Title'; // this page title
      var img_url = '/img.jpg'; // page image
      var page_priority = '6';
      var page_tags = 'tags,tags,many tags';

      if(!_id){id=0}

      Todo.find(function(err,todos){
        if (err)
            res.send(err);
        console.log(todos);
        res.render('bots',{
          img: img_url,
          title: todos[_id].priority,
          description: todos[_id].text,
          url: page_url,
          tags: todos[_id].tags
        });

      });
    });


    app.use(function(req,res,next){
       var ua = req.headers['user-agent'];
        if(/^(facebookexternalhit)|(Twitterbot)|(Pinterest)/gi.test(ua)){
         console.log(ua, ' gets sent elsewhere.');
         bot_router(req,res,next);
        }else{
          next();
        }
    });
    app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
    app.use(morgan('dev'));                                         // log every request to the console
    app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
    app.use(bodyParser.json());                                     // parse application/json
    app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
    app.use(methodOverride());




   // routes ======================================================================

    // api ---------------------------------------------------------------------
    // get all todos
    app.get('/api/todos', function(req, res) {

        // use mongoose to get all todos in the database
        Todo.find(function(err, todos) {

            // if there is an error retrieving, send the error. nothing after res.send(err) will execute
            if (err)
                res.send(err)

            res.json(todos); // return all todos in JSON format
        });
    });

    // create todo and send back all todos after creation
    app.post('/api/todos', function(req, res) {

        // create a todo, information comes from AJAX request from Angular
        Todo.create({
            text : req.body.text,
            tags : req.body.tags.split(),
            priority: req.body.priority,
            done : false
        }, function(err, todo) {
            if (err)
                res.send(err);

            // get and return all the todos after you create another
            Todo.find(function(err, todos) {
                if (err)
                    res.send(err)
                res.json(todos);
            });
        });

    });

    // delete a todo
    app.delete('/api/todos/:todo_id', function(req, res) {
        Todo.remove({
            _id : req.params.todo_id
        }, function(err, todo) {
            if (err)
                res.send(err);

            // get and return all the todos after you create another
            Todo.find(function(err, todos) {
                if (err)
                    res.send(err)
                res.json(todos);
            });
        });
    });

    // application -------------------------------------------------------------
  app.get('*', function(req, res) {
      res.sendFile(__dirname + '/public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
  });



  // listen (start app with node server.js) ======================================

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

app.listen(server_port, server_ip_address, function () {
  console.log( "Listening on " + server_ip_address + ", port " + server_port )
});
