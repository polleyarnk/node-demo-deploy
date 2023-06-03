const path = require('path');
const fs = require('fs');
const https = require('https');

const express = require('express');
const bodyParser = require('body-parser');
//console.log(process.env.MONGO_USER);
//const mongo_user = process.env.MONGO_USER.toString();
//console.log(mongo_user);
//const MONGODB_URI = `mongodb+srv://polleyarnab:46GXxaYqXCsFDqWE@cluster0.ni5awol.mongodb.net/shop}`;
//const MONGODB_URI = "mongodb+srv://" + mongo_user + ":46GXxaYqXCsFDqWE@cluster0.ni5awol.mongodb.net/shop";
//console.log(MONGODB_URI);
const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.ni5awol.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;
const errorController = require('./controllers/error');
//const mongoConnect = require('./util/database').mongoConnect;
// const sequelize = require('./util/database');
// const Product = require('./models/product');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const User = require('./models/user');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const app = express();
const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});
const csrfProtection = csrf();
// const privateKey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');

const fileStorage = multer.diskStorage({
  destination: (req,file,cb) => {
      cb(null,'images');
  },
  filename: (req,file,cb) => {
    const timenew = Date.now();
    //new Date().toISOString().toString();
    const filenamee = timenew + '_' + file.originalname;
    console.log(filenamee);
      cb(null,filenamee);
  }
});
const fileFilter = (req,file,cb) => {
    if(file.mimetype === 'image/png' || 
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'){
      cb(null,true);
    }else{
      cb(null,false) ;
    }
}
app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
//const user = require('./models/user');

const accessLogStream = fs.createWriteStream(
  path.join(__dirname,'access.log'),
  {flags:'a'}
);

app.use(helmet());
app.use(compression());
app.use(morgan('combined',{stream:accessLogStream}));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({
  storage: fileStorage,
  fileFilter: fileFilter
}).single('image'));
// app.use(multer({
//   dest:'images'
// }).single('image'));
//console.log(new Date().toISOString().toString());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images',express.static(path.join(__dirname, 'images')));
app.use(session({
  secret:'my secret',
  resave: false,
  saveUninitialised: false,
  store:store
}));
app.use(csrfProtection);
app.use(flash());
app.use((req, res, next) => {
  //console.log('ooooo');
  //console.log(req.session.user);
  //next();
  if(req.session.user){
    User.findById(req.session.user._id)
      .then(user => {
        //throw new Error('Dummy');
        if(!user){
          next();
        }
        req.user = user;
        next();
      })
      .catch(err => {
        //console.log(err) 
        //throw new Error(err)
        next(new Error(err));
      });
    // //next();
  }else{
    next();
  }
});

app.use((req,res,next) => {
   res.locals.isAuthenticated = req.session.isLoggedIn;
   res.locals.csrfToken = req.csrfToken();
   next();
});

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);
app.use('/500', errorController.get500);
app.use(errorController.get404);
app.use((error, req, res, next) => {
  res.redirect('/500');
});

// mongoConnect((vald) => {
//   console.log(vald);  
//   app.listen(3000);
// });
mongoose.connect(MONGODB_URI).then(() => {
  // User.findOne().then((user) => {
  //     if(!user){
  //       console.log('kkk11ttt');
  //       const user = new User({
  //         name:'Ajit',
  //         email:'ajit@gmail.com',
  //         cart: {
  //           items: []
  //         }
  //       });
  //       user.save();
  //     }else{
  //       console.log('rrrr');
  //       console.log(JSON.stringify(user));
  //     }
  // });
  //app.listen(3000);
  app.listen(process.env.PORT || 3000);
  //https.createServer({key: privateKey,cert: certificate},app).listen(process.env.PORT || 3000);
  console.log('connected');
}).catch(err => {
  console.log(err);
})
