
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const orderSchema = new Schema({
  products: [{
    product: {type:Object,required:true},
    quantity: {type:Number,required:true},
  }],
  user: {
    email: {type:String,required:true},
    userId: {type:Schema.Types.ObjectId,required:true,ref:'users_v2'},
  }
});

module.exports = mongoose.model('orders_v2',orderSchema);
