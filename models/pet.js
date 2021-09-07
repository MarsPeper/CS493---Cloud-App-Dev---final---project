
const { extractValidFields } = require('../lib/validation');

// connect to mongo
const { getDBReference } = require('../lib/mongo');

const { ObjectId } = require("mongodb");
/*
 * Schema describing required/optional fields of a business object.
 */

const PetSchema = {
  userId: { required: true },
  breed: { required: true },
  isAdopted: { required: true },
  color: { required: true },
  age: { required: true },
  gender: { required: true },
  description: { required: false }
};
exports.PetSchema = PetSchema;

async function getPet(id) {
  const db = await getDBReference();
  const collection = db.collection('pets');
  console.log("-- Collection: ", collection);
  const results = await collection.find({_id: new ObjectId(id)}).toArray();
  return results[0];
}
exports.getPet = getPet;

async function insertPet(info){
    let pet = extractValidFields(info, PetSchema);
    const db = getDBReference();
    const collection = db.collection('pets');
    const results = await collection.insertOne(pet);
    return String(results.insertedId);
}
exports.insertPet = insertPet;

async function putPet(pid, body) {
  const db = getDBReference();
  const collection = db.collection('pets');
  let update = {
    $set: {
    }
  };
  if (body.breed) {
    update.$set.breed = body.breed;
  }
  if (body.isAdopted) {
    update.$set.isAdopted = body.isAdopted;
  }
  if (body.description) {
    update.$set.description = body.description;
  }

  if (body.color) {
    update.$set.color = body.color;
  }

  if (body.age) {
    update.$set.age = body.age;
  }

  if (body.gender) {
    update.$set.gender = body.gender;
  }

  console.log("update object: ", update);
  console.log("body: ", body);
  console.log("pid: ", pid);
  const result = await collection.updateOne({_id: new ObjectId(pid)}, update);
  return {
    links: {
      pet: `/pets/${pid}`
    }
  };
}
exports.putPet = putPet;

async function deletePet(pid) {
  const db = getDBReference();
  const collection = db.collection('pets');

  const b_photos = db.collection('photos');

  const delete_pet = await collection.deleteOne({_id: new ObjectId(pid)});

  const delete_photos = await b_photos.deleteMany({petid: pid});

  const collection_images = db.collection("images.files");
  results = await collection_images.deleteMany({ "metadata.petid": pid });
  return {
    message: "Delete data from pets, photos associated to it."
  };
}
exports.deletePet = deletePet;

// async function for inserting a new business
async function adoptPet(petid) {
  const db = getDBReference();
  const collection = db.collection('pets');
  let update = {
    $set: {
    }
  };
  update.$set.isAdopted = true;
  // need to get rid of mock data id or whatever.
  const result = await collection.updateOne({_id: new ObjectId(petid)}, update);
  console.log("  -- result:", result);
  return petid;
}
exports.adoptPet = adoptPet
