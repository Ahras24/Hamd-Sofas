require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path')
const connectDB = require('./config/db');
const passport = require('./config/passport')
const PORT = process.env.PORT ;
const adminRoutes = require('./routes/adminRoutes')
const userRoutes = require('./routes/userRoutes')
const session = require('express-session');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const methodOverride = require('method-override')
const MongoStore = require('connect-mongo');

// connect to mongoDB
connectDB();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL,
      collectionName: 'sessions'
    }), 
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
  }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use((req,res,next)=>{
  res.locals.user = req.session.user || null;
  next();
})

//  Flash messages 
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
  });

// template engine setup
app.set('view engine','ejs')
app.set('views', path.join(__dirname, 'views'));

// serve static file
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
app.use('/admin',adminRoutes);
app.use('/user',userRoutes);



// Global error handler (for 404,500,etc.)
app.use((err, req, res, next) => {
    console.error(`Global error: ${err.message}`);
    const status = err.statusCode || 500;
    const message = err.message || "Something went wrong.";

    res.status(status).render('user/error',{
      statusCode: status,
      errorMessage: message,
      path: req.originalUrl
    });
  });


app.listen(PORT,()=> console.log(`Server running on PORT : ${PORT} `))