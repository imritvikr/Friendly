const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = process.env.PORT || 8000;
const expressLayouts = require('express-ejs-layouts');
const db = require('./config/mongoose');

// used for session cookie
const session = require('express-session');
const passport = require('passport');
const passportLocal = require('./config/passport-local-strategy');
const passportJWT = require('./config/passport-jwt-strategy');
const passportGoogle = require('./config/passport-google-oauth2-strategy');
const MongoStore = require('connect-mongo')(session);
const sassMiddleware = require('node-sass-middleware');
const flash = require('connect-flash');
const customMware = require('./config/middleware');

//setup the chat server to be used with socket.io 
// new line
const chatServer=require('http').Server(app);
const chatSockets=require('./config/chat_sockets').chatSockets(chatServer);
chatServer.listen(5000);
console.log("chat server is listening on PORT 5000");

// to compile scss files into css files
app.use(sassMiddleware({
    /* Options */
    src: './assets/scss',
    dest: './assets/css',
    debug: true,
    outputStyle: 'extended',
    prefix:  '/css'  // Where prefix is at <link rel="stylesheets" href="prefix/style.css"/>
}));

// calling body-parser to handle the Request Object from POST requests
const bodyParser = require('body-parser');
// parse application/json, basically parse incoming Request Object as a JSON Object 
app.use(bodyParser.json());
// combines the 2 above, then you can parse incoming Request Object if object, with nested objects, or generally any type.
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

// app should look for assets folder for static files
app.use(express.static('./assets'));

// make the uploads path available to the browser
app.use('/uploads', express.static(__dirname + '/uploads'));

app.use(expressLayouts);
//extract styles and scripts from sub pages into layout
app.set('layout extractStyles', true);
app.set('layout extractScripts', true);

//set up the view engine
app.set('view engine', 'ejs');
app.set('views', './views');

app.use(session({
    name: 'Friendly',
    // TODO change the secret before deployment in production mode
    secret: 'anythingcouldhappen',
    saveUninitialized: false,
    resave: false,
    cookie:{
        maxAge: (1000 * 60 * 100)
    },
    // cookie will be stored in DB
    store: new MongoStore(
    {
        mongooseConnection: db,
        autoRemove: 'disabled'
    },
    function(err){
        console.log(err, 'connect-mongodb setup is ok');
    }
    )
}));

// asking app to use passport for authentication
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.setAuthenticatedUser);

// app will show the notification using custom middleware
app.use(flash());
app.use(customMware.setFlash);

//use express router
app.use('/', require('./routes/index'));

// app will be running on the given port number
app.listen(PORT, function(err){
    if(err){
        console.log(`Error in running the server ${err}`);
        return;
    }
    console.log(`Server is running on port: ${PORT}`);
});
