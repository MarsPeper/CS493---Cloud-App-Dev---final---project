// const mongoHost = process.env.MONGO_HOST || "localhost";
// const mongoPort = process.env.MONGO_PORT || 27017;
// const mongoUser = process.env.MONGO_USER;
// const mongoPassword = process.env.MONGO_PASSWORD;
// const mongoDBName = process.env.MONGO_DB_NAME;
const { MongoClient } = require('mongodb');
const mongoHost = process.env.MONGO_HOST|| 'localhost';
const mongoPort = process.env.MONGO_PORT || 27017;
const mongoUser = process.env.MONGO_USER || 'lekev';
const mongoPassword = process.env.MONGO_PASSWORD || 'cs493pw';
const mongoDBName = process.env.MONGO_DB_NAME || 'petadoption';

//MONGO_HOST="192.168.99.100";
const mongoUrl = `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoDBName}`;  //

let db = null;

exports.connectToDB = function (callback) {  
  MongoClient.connect(mongoUrl, { useUnifiedTopology: true }, function (err, client) {
    if (err) {
      throw err;
    }
    db = client.db(mongoDBName)
    callback();
  });
};

exports.getDBReference = function () {
  return db;
};