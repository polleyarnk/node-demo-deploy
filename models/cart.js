const mongodb = require('mongodb');
const ObjectId = mongodb.ObjectId;
const getDb = require('../util/database').getDb;

class Cart {
  constructor(username,email,password=''){
      this.username = username;
      this.email = email;
  }

  save(){
      const db = getDb();
      return db.collection('users').insertOne(this);
  }

  static findById(userId){
    const db = getDb();
    return db.collection('users').findOne({_id:new ObjectId(userId)});
  }
}



// const Sequelize = require('sequelize');

// const sequelize = require('../util/database');

// const Cart = sequelize.define('cart', {
//   id: {
//     type: Sequelize.INTEGER,
//     autoIncrement: true,
//     allowNull: false,
//     primaryKey: true
//   }
// });

// module.exports = Cart;
