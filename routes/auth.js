const express = require('express');
const router = express.Router();
const path = require('path');
const authController = require('../controllers/auth');
const User = require('../models/user');
const { check, body } = require('express-validator');
// /admin/add-product => GET
router.get('/login', authController.getLogin);
router.post('/login', [
    body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
    body('password','Password needs to be valid')
    .isLength({min:5})
    .isAlphanumeric()
    .trim()
],authController.postLogin);
router.post('/logout', authController.postLogOut);
router.get('/signup', authController.getSignup);
router.post(
    '/signup',
    [
     check('email')
     .isEmail()
     .withMessage('Please enter a valid Email')
     .custom((value,{req}) => {
        // if(value === 'test@test.com'){
        //     throw new Error('This email is forbidden.');
        // }
        // return true;
        return User.findOne({email: value}).then((userDoc) => {
            if(userDoc){
                return Promise.reject('This email is already taken');
            }
        });
     })
     .normalizeEmail(),
     body('password','Please enter password alphanumeric with min 5 characters in length')
     .isAlphanumeric()
     .isLength({min:5})
     .trim(),
     body('confirmPassword')
     .custom((value,{req}) => {
        if(value !== req.body.password){
            throw new Error('The confirm password needs to be matched with password field');
        }
        return true;
     })
     .trim()
    ],
    authController.postSignup);
router.get('/reset', authController.getReset);
router.post('/reset', authController.postReset);
router.get('/reset/:token', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);
module.exports = router;