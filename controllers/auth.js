const User = require('../models/user');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');
const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));

exports.getLogin = (req, res, next) => {
    let isLoggedIn = '';
    if(req.get('Cookie')){
        isLoggedIn = req
        .get('Cookie')
        .split(';')[0]
        .trim()
        .split('=')[1];
    }
    // console.log('****');
    // console.log(isLoggedIn);
    // console.log('$$$$');
    // console.log(res.get('Cookie'));
    // console.log(req.get('Set-Cookie'));
    // console.log(res.get('Cookie'));
    // console.log(res.get('Set-Cookie'));
    let message = req.flash('error');
    //console.log(message.length);
    if(message.length <= 0){
        message = null;
    } 
        res.render('auth/login', {
          path: '/login',
          pageTitle: 'Login',
          isAuthenticated: req.session.isLoggedIn,
          errorMessage: message,
          oldInput: {
            email:'',
            password: ''
          },
          validationErrors: []
        });
};

exports.getSignup = (req, res, next) => {
    let message = req.flash('error');
    //console.log(message.length);
    if(message.length <= 0){
        message = null;
    } 
    res.render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      isAuthenticated: false,
      errorMessage: message,
      oldInput: {
        email:'',
        password: '',
        confirmPassword: ''
      },
      validationErrors: []
    });
};

exports.postLogin = (req, res, next) => {
    //req.isLoggedIn = true;
    //res.setHeader('Set-Cookie','loggedIn=true; Max-Age=10; HttpOnly');
    const email = req.body.email;
    const password = req.body.password;
    const errors= validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).render('auth/login', {
            path: '/loginp',
            pageTitle: 'Login',
            isAuthenticated: false,
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email:email,
                password: password
            },
            validationErrors: errors.array()
          });
    }
    //User.findById("6452b3e22583789edd989143")
    User.findOne({
        email:email
    })
    .then((user) => {
        if(!user){
            //req.flash('error', 'The email or password is incorrect');
            return res.status(422).render('auth/login', {
                path: '/loginp',
                pageTitle: 'Login',
                isAuthenticated: false,
                errorMessage: 'The email or password is incorrect',
                oldInput: {
                    email:email,
                    password: password
                },
                validationErrors: errors.array()
            });
        }
        bcrypt
        .compare(password,user.password)
        .then((doMatch) => {
            if(doMatch){
                req.session.user = user;
                req.session.isLoggedIn = true;
                return req.session.save((err) => {
                console.log(err);
                //res.redirect('/');
                res.redirect('/');
                });
            }
            // req.flash('error', 'The email or password is incorrect');
            // res.redirect('/login');
            return res.status(422).render('auth/login', {
                path: '/loginp',
                pageTitle: 'Login',
                isAuthenticated: false,
                errorMessage: 'The email or password is incorrect',
                oldInput: {
                    email:email,
                    password: password
                },
                validationErrors: errors.array()
            });
        })
        .catch(err => {
            conssole.log(err);
            return res.redirect('/login');
        });
    })
    .catch(err => console.log(err));
  //next();
    
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        console.log(errors.array());
        return res.status(422).render(
            'auth/signup', {
                path: '/signup',
                pageTitle: 'Signup',
                isAuthenticated: false,
                errorMessage: errors.array()[0].msg,
                oldInput: {
                    email:email,
                    password: password,
                    confirmPassword: req.body.confirmPassword
                },
                validationErrors: errors.array()
            }
        );
    }
    
        bcrypt.hash(password, 12)
        .then((hashedPassword) => {
            const user = new User({
                email:email,
                password:hashedPassword,
                cart:{items:[]}
            });
            return user.save();
        })
        .then((result) => {
            res.redirect('/login');
            return transporter.sendMail({
                to: email,
                from: 'arnabpolley84@gmail.com',
                subject: 'Signup succeded',
                DEFAULT_FROM_EMAIL : 'arnabpolley84@gmail.com',
                EMAIL_FROM : 'arnabpolley84@gmail.com',
                html: '<h1>You successfully signed up</h1>'
            });
        })
        .catch(err => {
            console.log(err);
        });
    
};

exports.postLogOut = (req, res, next) => {
    console.log('destroyed');
    req.session.destroy((err) => {
        console.log(err);
        console.log('destroyed');
        //req.session.isLoggedIn = false;
        return res.redirect('/');
    });
};
exports.getReset = (req,res,next) => {
    let message = req.flash('error');
    //console.log(message.length);
    if(message.length <= 0){
        message = null;
    } 
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    });
}
exports.postReset = (req,res,next) => {
    crypto.randomBytes(32,(err,buffer) => {
        if(err){
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email:req.body.email})
        .then(user => {
            if(!user){
                req.flash('error','No such email found');
                return res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save();
        })
        .then(result => {
            res.redirect('/');
            return transporter.sendMail({
                to: req.body.email,
                from: 'arnabpolley84@gmail.com',
                subject: 'Reset succeded',
                DEFAULT_FROM_EMAIL : 'arnabpolley84@gmail.com',
                EMAIL_FROM : 'arnabpolley84@gmail.com',
                html: `
                    <p> You requested a password reset</p>
                    <p> Click this Link <a href="http://localhost:3000/reset/${token}">Click</>to set the new password</p>
                `
            });
        })
        .catch(err => {
            console.log(err);
        });
    });
}

exports.getNewPassword = (req,res,next) => {
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
    .then((user) => {
        let userId = '';
        if(!user){
            req.flash('error','Password reset link has expired!');
        }else{
            userId = user._id.toString();
        }
        
        let message = req.flash('error');
        if(message.length <= 0){
            message = null;
        } 
        res.render('auth/new-password', {
            path: '/new-password',
            pageTitle: 'New Password',
            errorMessage: message,
            userId: userId,
            passwordToken: token
        });
    })
    .catch(err => {
        console.log(err);
    });
    
}

exports.postNewPassword = (req,res,next) => {
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    User.findOne(
            {
                _id: userId,
                resetToken: passwordToken, 
                resetTokenExpiration: {$gt: Date.now()}
            }
        )
    //User.findById(userId)
    .then(user => {
        if(!user){
            console.log('no' + passwordToken);
            req.flash('error','Something went wrong');
            res.redirect('/reset/' + passwordToken);
        }else{
            console.log('yes');
            const password = req.body.password;
            return bcrypt.hash(password, 12)
            .then((hashedPassword) => {
                user.password = hashedPassword;
                user.resetToken = undefined;
                user.resetTokenExpiration = undefined;
                return user.save();
            })
            .then(result => {
                console.log('Password changed successfully');
                res.redirect('/login');
                return transporter.sendMail({
                    to: user.email,
                    from: 'arnabpolley84@gmail.com',
                    subject: 'Password change succeded',
                    DEFAULT_FROM_EMAIL : 'arnabpolley84@gmail.com',
                    EMAIL_FROM : 'arnabpolley84@gmail.com',
                    html: `
                        <p> You have successfully reset the password.</p>
                        <p> Please Login to continue.</p>
                    `
                });
            })
            .catch(err => {
                console.log(err);
            })
        }
    })    
    .catch(err => {
            console.log(err);
    });
}