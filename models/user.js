
const { extractValidFields } = require('../lib/validation');
const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');

// connect to mongo
const { getDBReference } = require('../lib/mongo');

const UserSchema = {
  name: { required: true },
  email: { required: true },
  password: { required: true },
  address: { required: true},
  phonenumber: {required: true},
  admin: { required: false }
};
exports.UserSchema = UserSchema;

async function insertNewUser(user) {
  user = extractValidFields(user, UserSchema);
  user.password = await bcrypt.hash(user.password, 8);
  const db = await getDBReference();
  const collection = db.collection('users');
  const result = await collection.insertOne(user);

  return {
    _id: result.insertedId
  };
}
exports.insertNewUser = insertNewUser;

async function getUserByEmail(email){
  const db = await getDBReference();
  const collection = db.collection('users');
  const user = await collection.find({email: email}).toArray();
  return( user[0] );
}
exports.getUserByEmail = getUserByEmail;


async function validateUser(email, password){
  const db = await getDBReference();
  const collection = db.collection('users');
  const user = await collection.find({email: email}).toArray();
  console.log(password, user[0].password);
  return( user.length && await bcrypt.compare(password, user[0].password) );
}
exports.validateUser = validateUser;


async function deleteUser(userid) {
  const db = await getDBReference();
  const collection = db.collection('users');
  const result = await collection.deleteOne({ _id: new ObjectId((userid))});


  const collection_pets = db.collection('pets');
  results = await collection_pets.deleteMany({userId: userid});

  const collection_images = db.collection("images.files");
  results = await collection_images.deleteMany({ "metadata.userid": userid});

  return results;
}
exports.deleteUser = deleteUser;

async function getUserById(token){
  const db = await getDBReference();
  const collection = db.collection('users');

  if (!ObjectId.isValid(token)) {
    return null;
  } else {
    const results = await collection
      .find({ _id: new ObjectId(token) })
      .toArray();
    
    console.log("= ", results[0]);
    return results[0];
  }
}
exports.getUserById = getUserById;

async function updateUser(id, body){
  const db = await getDBReference();
  const collection = db.collection('users');

  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    //const changed = await collection.find({ _id: new ObjectId(id) }).toArray();
    const changed = await collection.replaceOne({_id: new ObjectId(id)}, body);
    return changed;
  }
}
exports.updateUser = updateUser;

async function FindallPetById(userid){
  const db = await getDBReference();
  const collection = db.collection('pets');

  if (!ObjectId.isValid(userid)) {
    return null;
  } else {
    const temp_userid_string = userid.toString()
    const results = await collection
      .find({ userId: temp_userid_string })
      .toArray();
    console.log("=result ", results);
    return results;
  }
}
exports.FindallPetById = FindallPetById;