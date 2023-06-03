const Product = require('../models/product');
const fileHelper = require('../util/file');
const mongodb = require('mongodb');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const ObjectId = mongodb.ObjectId;
exports.getAddProduct = (req, res, next) => {
  // if(!req.session.isLoggedIn){
  //   return res.redirect('/login');
  // }
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  //req.body.image
  const price = req.body.price;
  const description = req.body.description;
  if(!image){
    return res.status(422).render('admin/edit-product', {
        path: '/admin/add-product',
        pageTitle: 'Add Product',
        editing: false,
        errorMessage: 'Attached file is not an image.',
        hasError: true,
        product: {
            title: title,
            price: price,
            description: description
        },
        validationErrors: []
      });
  }
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(422).render('admin/edit-product', {
        path: '/admin/add-product',
        pageTitle: 'Add Product',
        editing: false,
        errorMessage: errors.array()[0].msg,
        hasError: true,
        product: {
            title: title,
            imageUrl: imageUrl,
            price: price,
            description: description,
            _id: ''
        },
        validationErrors: errors.array()
      });
  }
  const imageUrl = image.path;
  const product = new Product({
    //_id: new mongoose.Types.ObjectId('64469a0a779216c198fb8619'),
    title: title,
    imageUrl: imageUrl,
    price: price,
    description: description,
    userId: req.user,
  });
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      //console.log(err);
      // return res.status(500).render('admin/edit-product', {
      //   path: '/admin/add-product',
      //   pageTitle: 'Add Product',
      //   editing: false,
      //   errorMessage: 'Something went wrong.',
      //   hasError: true,
      //   product: {
      //       title: title,
      //       imageUrl: imageUrl,
      //       price: price,
      //       description: description,
      //       _id: ''
      //   },
      //   validationErrors: []
      // });
      req.flash('500_error', 'The product cannot be created. Some database issue. We will fix soon. Sorry for the inconvenience.');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: []
      });
    })
    .catch(err => console.log(err));
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const image = req.file;
  const updatedDesc = req.body.description;
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(422).render('admin/edit-product', {
        path: '/admin/edit-product',
        pageTitle: 'Edit Product',
        editing: true,
        errorMessage: errors.array()[0].msg,
        hasError: true,
        product: {
            title: updatedTitle,
            price: updatedPrice,
            description: updatedDesc,
            _id: prodId
        },
        validationErrors: errors.array()
      });
  }
  Product.findById(prodId).then((product) => {
    if(product.userId.toString() !== req.user._id.toString()){
        return res.redirect('/');
    }
    product.title = updatedTitle;
    if(image){
      fileHelper.deleteFile(product.imageUrl);
      product.imageUrl = image.path;
    }
    //product.imageUrl = image;
    product.price = updatedPrice;
    product.description = updatedDesc;
    console.log(req.user);
    return product.save()
    .then(result => {
      console.log('UPDATED PRODUCT!');
      res.redirect('/admin/products');
    });  
  })
  // const product = new Product(updatedTitle,updatedPrice,updatedDesc,
  ////updatedImageUrl, new ObjectId(prodId));
  // product
  //   .save()
    
    .catch(err => console.log(err));
};

exports.getProducts = (req, res, next) => {
  Product.find({userId: req.user._id})
    .then(products => {
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => console.log(err));
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
  .then((product) => {
    if(!product){
      return next(new Error('Product not found'));
    }
    fileHelper.deleteFile(product.imageUrl);
    return Product.deleteOne({_id: prodId, userId: req.user._id});
  })
  .then(() => {
    console.log('DESTROYED PRODUCT');
    //res.redirect('/admin/products');
    res.status(200).json({message:'success'});
  })
  .catch(err => res.status(500).json({message: 'Deleting product failed!'}));
  
  //Product.deleteById(prodId)
  // Product.DeleteOne({_id:prodId,userId:req.user._id})
  // Product.findByIdAndRemove(prodId)
    
};
