const router = require('express').Router();
const { validateAgainstSchema } = require('../lib/validation');
const multer  = require('multer');
const fs = require('fs/promises');

const crypto = require('crypto')

const {
  PhotoSchema,
  insertPhoto,
  modifyPhotoByID,
  deletePhotoByID,
  getPhotosByPetID,
  getPhotosByID,
  getPhotosPage,
  getPhotosById_new,
  insertNewPhoto,
  getPhotoById_new
} = require('../models/photo');

const imageTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

const upload = multer({
  storage: multer.diskStorage({
    destination: `${__dirname}/uploads`,
    filename: (req, file, callback) => {
      const basename = crypto.pseudoRandomBytes(16).toString('hex');
      const extension = imageTypes[file.mimetype];
      callback(null, `${basename}.${extension}`);
    }
  }),
  fileFilter: (req, file, callback) => {
    callback(null, !!imageTypes[file.mimetype])
  }
});


const {
  generateAuthToken,
  requireAuthentication,
  checkAdmin
} = require('../lib/authenticate');


router.delete('/:photoid', requireAuthentication, async (req, res, next) => {
  const photoid = req.params.photoid;
  const photo = await getPhotosByID(photoid);
  console.log("Photo:", photo);

  if (photo == null) {
    res.status(403).send({
      error: "No matching photo ID to delete"
    });
  }

  if ( req.userId.toString() == photo.metadata.userid.toString() ) {
      try {
        const deleteSuccessful = await deletePhotoByID(photoid);
        if (deleteSuccessful) {
          res.status(204).end();
        }

        else {
          next();
        }
      } catch (err) {
        console.log(err);
        res.status(500).send({
          error: "Unable to delete photo by ID."
        })
      }
  } else{
    res.status(403).send({
      error: "Unauthorized to delete photo"
    });
  }
});

router.put('/:photoid',  requireAuthentication, async (req, res, next) => {
  if (validateAgainstSchema(req.body, PhotoSchema)) {
    console.log(req.userId, req.body.userid);
    if ( ((req.userId.toString() != req.body.userid.toString())) ) {
      res.status(403).send({
        error: "Unauthorized to modify photo"
      });
    }

    else {
      console.log("made it in here");
      try {
        const photoid = req.params.photoid;
        const updateSuccessful = await modifyPhotoByID(photoid, req.body);
        console.log(updateSuccessful);
          if (updateSuccessful) {
            res.status(200).send({
              updateSuccessful: updateSuccessful,
              links: {
                photo: '/photos/' + photoid
              }
            });
          }

          else {
            next();
          }
        } catch (err) {
        console.log(err);
        res.status(500).send({
          error: "Unable to update photo by ID."
        });
      }
    }
  }

    else {
      console.log("failing");
    }
  });

/*
 * Route to return a list of photos
 */
router.get('/', async function (req, res, next) {
  try {
    const photosPage = await getPhotosPage(parseInt(req.query.page) || 1);
    res.status(200).send(photosPage);
  }
  catch (err) {
    console.error(" -- error: ", err);
    res.status(500).send({
      err: "Error fetching photos page from DB. Try again later"
    });
  }

});

router.post('/', upload.single('image'), requireAuthentication, async (req, res, next) => {
  if (req.file && req.body && req.body.petid && req.body.userid) {

    if ( !(req.userId.toString() == req.body.userid.toString()  || req.admin) ) {
      res.status(403).send({
        error: "User id must match or you'll have to be an admin"
      });
    } else {

      let temp_caption = req.body.caption || "No caption";
      try {
        const image = {
          path: req.file.path,
          filename: req.file.filename,
          contentType: req.file.mimetype,
          userid: req.body.userid,
          petid: req.body.petid,
          caption: temp_caption
        }
        console.log("IN else" , image)
        const id = await insertNewPhoto(image);
        console.log("after" , id)
        await fs.unlink(req.file.path);

        res.status(201).json({
          id: id,
          links: {
            photo: '/photos/' + id
          }
        });
      } catch (err) {
        res.status(500).send({
          error: "Error inserting a new photo."
        })
      }
    }
  }

  else {
    res.status(400).json({
      error: "Request body does not contain a valid JSON photo."
    });
  }
});


router.get('/:id', async (req, res, next) => {
  try {
    const image = await getPhotoById_new(req.params.id);
    if (image) {
      const responseBody = {
        _id: image._id,
        url: `/media/images/${image.filename}`,
        contentType: image.metadata.contentType,
        userid: image.metadata.userid,
        petid: image.metadata.petid,
        caption: image.metadata.caption
      };
      res.status(200).send(responseBody);
    } else {
      next();
    }
  } catch (err) {
    next(err);
  }
});


module.exports = router;
