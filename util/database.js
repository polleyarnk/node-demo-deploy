const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;
let _db;
const mongoConnect = (callback) => {
    MongoClient.connect('mongodb+srv://polleyarnab:46GXxaYqXCsFDqWE@cluster0.ni5awol.mongodb.net/shop?retryWrites=true&w=majority')
    .then((client) => {
      console.log('Connected...' + client);
      _db = client.db();
      callback({
        key: 'reached',
        db: _db});
    })
    .catch(err => {
      console.log(err)
      throw err;  
    });
};
const getDb = () => {
  if(_db){
    return _db;
  }
  throw 'No databases found';
}
//module.exports = mongoConnect;
exports.mongoConnect = mongoConnect;
exports.getDb = getDb;

// const Sequelize = require('sequelize');

// const sequelize = new Sequelize('node-complete', 'root', '', {
//   dialect: 'mysql',
//   host: 'localhost'
// });

// module.exports = sequelize;
