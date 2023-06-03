var fs = require('fs');
var path = require('path');
var mongoose = require('mongoose'); 
const PDFDocument = require('pdfkit');
const stripe = require('stripe')('sk_test_51NA83iSAFAuDJGZshelblS5H14RO5t4Sp2jF1Hq93qULCAEs90lf95GLfroe0cB4IDeVnSJH75NGjV3Mv3NBYgeM00Xmi8aX7J');
//const stripe = require('stripe')(process.env.STRIPE_KEY);
// var Schema = mongoose.Schema; 
// var ObjectId = Schema.ObjectId; 

const ITEMS_PER_PAGE = 2;

const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
  // Product.find()
  //   .then(products => {
  //     res.render('shop/product-list', {
  //       prods: products,
  //       pageTitle: 'All Products',
  //       path: '/products'
  //     });
  //   })
  //   .catch(err => {
  //     console.log(err);
  //   });

    const page = +req.query.page || 1;
    let totalItems;
    Product.find().countDocuments().then(numProducts => {
      totalItems = numProducts;
      return Product.find()
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);
    })
    .then(products => {
      //totalProducts: totalItems,
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
      });
    })
    .catch(err => {
      //console.log(err);
      const error = new Error(err);
      error.httpsStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  //var pid = new ObjectId(prodId);
  //console.log(JSON.stringify(req.params));
  
  // Product.findAll({ where: { id: prodId } })
  //   .then(products => {
  //     res.render('shop/product-detail', {
  //       product: products[0],
  //       pageTitle: products[0].title,
  //       path: '/products'
  //     });
  //   })
  //   .catch(err => console.log(err));
  //if (!ObjectId.isValid(userId)) return Error({ status: 422 })
  // if(mongoose.Types.ObjectId.isValid(prodId)) {
  //   console.log('error');
  // }
  
  if(mongoose.Types.ObjectId.isValid(prodId)) {
    //console.log("-97"+prodId);
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
      //console.log("-99>>="+prodId);
      return false;
    })
    .catch(err => console.log(err));
  }
};

exports.getIndex = (req, res, next) => {

  const page = +req.query.page || 1;
  let totalItems;
  Product.find().countDocuments().then(numProducts => {
    totalItems = numProducts;
    return Product.find()
    .skip((page - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);
  })
  .then(products => {
    //totalProducts: totalItems,
    res.render('shop/index', {
      prods: products,
      pageTitle: 'Shop',
      path: '/',
      currentPage: page,
      hasNextPage: ITEMS_PER_PAGE * page < totalItems,
      hasPreviousPage: page > 1,
      nextPage: page + 1,
      previousPage: page - 1,
      lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
    });
  })
  .catch(err => {
    //console.log(err);
    const error = new Error(err);
    error.httpsStatusCode = 500;
    return next(error);
  });


  // console.log(req.session.isLoggedIn);
  // Product.find()
  // .skip((page - 1) * ITEMS_PER_PAGE)
  // .limit(ITEMS_PER_PAGE)
  //   .then(products => {
  //     res.render('shop/index', {
  //       prods: products,
  //       pageTitle: 'Shop',
  //       path: '/'
  //     });
  //   })
  //   .catch(err => {
  //     console.log(err);
  //   });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    //.execPopulate()
    .then(user => {
      const products = user.cart.items;
      //console.log('returned..');
          res.render('shop/cart', {
            path: '/cart',
            pageTitle: 'Your Cart',
            products: products
          });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId).then(product => {
    return req.user.addToCart(product);
  })
  .then(result => {
    //console.log(result);
    return res.redirect('/cart');
  });

  
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .deleteItemFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  
  req.user
    .populate('cart.items.productId')
    //.execPopulate()
    .then(user => {
      products = user.cart.items;
      total = 0;
      products.forEach(p => {
        total += p.quantity * p.productId.price;
      });
      const paymentObj = {
        payment_method_types: ['card'],
        mode: 'payment',
        line_items : products.map(p => {
          return {
            quantity: p.quantity,
            price_data: {
              currency: 'inr',
              unit_amount: p.productId.price * 100,
              product_data: {
                name: p.productId.title,
                description: p.productId.description,
              },
            }
          }
        }),
        success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
        cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
      };
      //console.log(paymentObj);
      return stripe.checkout.sessions.create(paymentObj);
      //return stripe.checkout.sessions.create({
      // return stripe.checkout.sessions.create({
      //   line_items: [{
          
      //     quantity: 1,
      //     price_data: {
      //       currency: 'usd',
      //       unit_amount: 2000,
      //       product_data: {
      //         name: 'T-shirt',
      //         images: ['https://example.com/t-shirt.png'],
      //         description: 'Comfortable cotton t-shirt'
      //       },
      //     }
      //   }],
      //   payment_method_types: ["card"],
      //   mode: 'payment',
      //   success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',
      //   cancel_url: 'https://example.com/cancel',
      // });
    //   const sessione = stripe.paymentIntents.create({
    //     amount: 2000,
    //     currency: 'usd'
    //  });
     //console.log('uuuiiiiii'+sessione.id);
     //return false;
     //console.log('eeeee'+JSON.stringify(sessione));
      //return sessione;
    })
    .then((session) => {
      
      let sessionId = session.id.toString();
      console.log('herrekk');
      console.log(session.id);
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        totalSum: total,
        sessionId: sessionId
      });
    })
    .catch(err => console.log(err));
};

//exports.postOrder = (req, res, next) => {
exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    //.execPopulate()
    .then(user => {
      //console.log('iiiiii');
      //console.log(user);
      const products = user.cart.items.map(i => {
        return {quantity:i.quantity,product:{...i.productId._doc}}
      });
      const order = new Order({
        user:{email:req.user.email,userId:req.user},
        products: products
      });
      //console.log(JSON.stringify(products));
      return order.save();
  })
    .then(result => {
      //console.log(JSON.stringify(result));
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({
    'user.userId' : req.session.user._id 
  })
  // req.session.user
  //   .getOrders()
  .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => console.log(err));
};

exports.getInvoice = (req, res, next) => {
  //console.log('---');
  const orderId = req.params.orderId;
  Order.findById(orderId).then(order => {
    if(!order){
      return next(new Error('No order found.'));
    }
    if(order.user.userId.toString() !== req.user._id.toString()){
      return next(new Error('Unauthorised'));
    }
    const invoiceName = 'invoice-' + orderId + '.pdf';
    //console.log('---' + invoiceName);
    const invoicePath = path.join('data','invoices',invoiceName);
    //console.log('----'+invoicePath);
    // fs.readFile(invoicePath,(err,data) =>{
    //     if(err){
    //       return next(err);
    //     }
    //     res.setHeader('Content-Type','application/pdf');
    //     res.setHeader('Content-Disposition','attachment; filename="' + invoiceName +'"');
    //     res.send(data);
    // });
    const pdfDoc = new PDFDocument();
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','attachment; filename="' + invoiceName +'"');
    pdfDoc.pipe(fs.createWriteStream(invoicePath));
    pdfDoc.pipe(res);
    //pdfDoc.text('Hello World');
    pdfDoc.fontSize(26).text('Invoice',{
      underline: true
    });
    pdfDoc.text('------------------------------');
    let totalPrice = 0;
    order.products.forEach(prod => {
      totalPrice += prod.quantity * prod.product.price;
      pdfDoc.fontSize(14).text(prod.product.title + 'x' + prod.quantity + 'Price per item:' + prod.product.price);
    });
    pdfDoc.text('------------------------------');
    pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);
    pdfDoc.end();
    // const file = fs.createReadStream(invoicePath);
    // res.setHeader('Content-Type','application/pdf');
    // res.setHeader('Content-Disposition','attachment; filename="' + invoiceName +'"');
    // file.pipe(res);
  })
  .catch(err => next(err));
};
