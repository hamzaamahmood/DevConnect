const express = require('express');
const session = require('express-session');
const ejs = require('ejs');
const MongoStore = require('connect-mongo')(session)
const router = require('./router');
const flash = require('connect-flash');
const app = express();

let sessionOptions = session({
  secret:"spike is my dog",
  store: new MongoStore({client: require('./db')}),
  resave: false,
  saveUninitialized: false,
  cookie: {maxAge: 1000*60*60*24, httpOnly: true}
});

app.use(sessionOptions);
app.use(flash());
app.use(function(req, res, next){
  if(req.session.user){req.visitorid = req.session.user._id} else{req.visitorid = 0}
  // make user session data available within view templates
  res.locals.user = req.session.user
  res.locals.errors = req.flash('errors')
  res.locals.success = req.flash('success')
  next()
})

app.set('views', 'views');
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));

app.use('/', router);

module.exports = app
