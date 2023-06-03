const path = require('path');

const express = require('express');

const { check, body } = require('express-validator');

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', adminController.getAddProduct);

// // /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// // /admin/add-product => POST
router.post('/add-product', [
    body('title')
    .isString()
    .isLength({min:5})
    .trim()
    .withMessage('Please enter valid title'),
    body('imageUrl','Please choose valid image'),
    body('price')
    .isFloat()
    .trim()
    .withMessage('Please enter valid price'),
    body('description')
    .isLength({min:5, max:400})
    .trim()
    .withMessage('Please enter valid description')
],
isAuth,  adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth,  adminController.getEditProduct);

router.post('/edit-product', [
    body('title')
    .isString()
    .isLength({min:5})
    .trim()
    .withMessage('Please enter valid title'),
    body('imageUrl','Please choose valid image'),
    body('price')
    .isFloat()
    .trim()
    .withMessage('Please enter valid price'),
    body('description')
    .isLength({min:5, max:400})
    .trim()
    .withMessage('Please enter valid description')
],
isAuth,  adminController.postEditProduct);

//router.post('/delete-product', isAuth,  adminController.postDeleteProduct);
router.delete('/product/:productId', isAuth,  adminController.deleteProduct);

module.exports = router;
