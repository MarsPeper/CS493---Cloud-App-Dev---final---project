/*
 * Business schema and data accessor methods;
 */
const { extractValidFields } = require('../lib/validation');
const bcrypt = require('bcryptjs');
const ObjectID = require('mongodb').ObjectID;
const fs = require('fs');
const { ObjectId, GridFSBucket } = require('mongodb');
/*
 * Schema describing required/optional fields of a business object.
 */

//connect to Mongo
 const { getDBReference } = require('../lib/mongo');

const PhotoSchema = {
  petid: { required: true },
  userid: { required: true },
  caption: { required: false },
};
exports.PhotoSchema = PhotoSchema;

async function getPhotosByUser(userId) {
  console.log("userId", userId)
  const db = await getDBReference();
  const collection = db.collection("images.files");
  const results = await collection.find({ "metadata.userid": String(userId)}).toArray();

  for(var i=0; i < results.length; i++){
    results[i].url = "/media/images/" + results[i].filename
  }
  return results;
}
exports.getPhotosByUser = getPhotosByUser;

async function insertPhoto(photo) {
  photo = extractValidFields(photo, PhotoSchema);
  const db = getDBReference();
  const collection = db.collection('photos');
  console.log("insertPhoto 1")
  const result = await collection.insertOne(photo);
  console.log(" -- result:", result);

  return result.insertedId;
}
exports.insertPhoto = insertPhoto;

async function deletePhotoByID(id) {
  const db = getDBReference();
  const collection = db.collection('images.files');
  const result = await collection.deleteOne(
    { _id: new ObjectID(id) });

  return result.deletedCount > 0;
}
exports.deletePhotoByID = deletePhotoByID;

async function modifyPhotoByID(id, photo) {

  const db = getDBReference();
  const collection = db.collection('images.files');

  const image = await collection.find({ _id: new ObjectId(id) }).toArray();
  console.log(image[0].metadata.userid);
  console.log("=", image[0].metadata.userid);
  

  let update = {
    $set: {
      metadata: {}
    }
  };
  
  update.$set.metadata.caption = photo.caption;
  update.$set.metadata.contentType = image[0].metadata.contentType;
  update.$set.metadata.userid = image[0].metadata.userid;
  update.$set.metadata.petid = image[0].metadata.petid;

  const result = await collection.updateOne(
    { _id: new ObjectID(id) },
    update
  );

  return {
    links: {
      photo: `photos/${id}`
    }
  };
}
exports.modifyPhotoByID = modifyPhotoByID;

async function getPhotosByID(id) {
  const db = await getDBReference();
  const collection = db.collection("images.files");
  const results = await collection.find({ "_id": new ObjectId(id)}).toArray();
  return results[0];
}
exports.getPhotosByID = getPhotosByID;



async function getPhotosByPetID(id) {
  const db = await getDBReference();
  const collection = db.collection('photos');
  const results = await collection.find({"metadata.petid": id}).toArray();

  // handling if there are no photos with that pet id!
  if (results.length < 1) {
    return null;
  }

  return results;
}
exports.getPhotosByPetID = getPhotosByPetID;

// get photos page from database
async function getPhotosPage(page) {
  const db = getDBReference();
  const collection = db.collection('photos');
  const count = await collection.countDocuments();
  const pageSize = 10;
  const lastPage = Math.ceil(count / pageSize);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;
  const offset = (page - 1) * pageSize;

  const results = await collection.find({})
    .sort({ _id: 1 })
    .skip(offset)
    .limit(pageSize)
    .toArray();

  /*
   * Generate HATEOAS links for surrounding pages.
  */
  const links = {};
  if (page < lastPage) {
    links.nextPage = `/photos?page=${page + 1}`;
    links.lastPage = `/photos?page=${lastPage}`;
  }
  if (page > 1) {
    links.prevPage = `/photos?page=${page - 1}`;
    links.firstPage = '/photos?page=1';
  }
  return {
    photos: results,
    page: page,
    totalPages: lastPage,
    pageSize: pageSize,
    count: count,
    links: links
  };
}
exports.getPhotosPage = getPhotosPage;

async function insertNewPhoto(image) {
    console.log("insertNewPhoto", image)

  return new Promise((resolve, reject) => {
    const db = getDBReference();
    const bucket = new GridFSBucket(db, { bucketName: 'images' });

    const metadata = {
      contentType: image.contentType,
      userid: image.userid,
      petid: image.petid,
      caption: image.caption
    };
    console.log("meta", metadata)
    const uploadStream = bucket.openUploadStream(
      image.filename,
      { metadata: metadata }
    );

    fs.createReadStream(image.path)
      .pipe(uploadStream)
      .on('error', (err) => {
        reject(err);
      })
      .on('finish', (result) => {
        resolve(result._id);
      });
  });
}
exports.insertNewPhoto = insertNewPhoto;

async function getPhotosByPetId_new(id) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, { bucketName: 'images' });
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await bucket.find({ "metadata.petid": id })
      .toArray();
    let data_arr = [];
    for (i = 0; i <results.length; i++) {
      let temp_object = {};
      temp_object._id = results[i]._id;
      temp_object.url = '/media/images/' + results[i].filename;
      temp_object.contentType = results[i].metadata.contentType;
      temp_object.userid = results[i].metadata.userid;
      temp_object.petid = results[i].metadata.petid;
      temp_object.caption = results[i].metadata.caption;
      data_arr.push(temp_object);
    }
    return data_arr;
  }
}
exports.getPhotosByPetId_new = getPhotosByPetId_new;


exports.getDownloadStreamByFilename = function (filename) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, { bucketName: 'images' });
  return bucket.openDownloadStreamByName(filename);
};

exports.getDownloadStreamById = function (id) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, { bucketName: 'images' });
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    return bucket.openDownloadStream(new ObjectId(id));
  }
};

async function getPhotoById_new(id) {
  const db = getDBReference();
  const bucket = new GridFSBucket(db, { bucketName: 'images' });
  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await bucket.find({ _id: new ObjectId(id) })
      .toArray();
    return results[0];
  }
}
exports.getPhotoById_new = getPhotoById_new;
