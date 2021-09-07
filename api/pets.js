const router = require('express').Router();

// added
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');
// const bcrypt = require('bcryptjs');
const {
  getPhotosById_new,
  getPhotosByPetId_new
} = require('../models/photo');
// authentication
const {
  generateAuthToken,
  requireAuthentication,
  checkAdmin
} = require('../lib/authenticate');

const {
  PetSchema,
  getPet,
  putPet,
  deletePet,
  adoptPet,
  insertPet
} = require('../models/pet');

router.get('/:id', async(req,res) => {
  console.log("--ID",req.params.id);
  try{
    const pet = await getPet(req.params.id);
    res.status(200).send(pet)
  } catch (err) {
    console.log("==ERROR:", err);
    res.status(500).send({
      error: "Error fetching user's photos page."
    });
  }

});


router.post("/", requireAuthentication, async(req,res) => {
  console.log(req.userId)
  console.log(req.body.userId)
  if( !((req.userId.toString() == req.body.userId.toString())  || req.admin) ){
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  } else {
    if (validateAgainstSchema(req.body, PetSchema)) {
      let id = await insertPet(req.body);
      res.status(200).send({
        _id : id
      });
    }
    else {
      res.status(400).json({
        error: "Request body does not contain a valid pet information."
      });
    }
  }
});

router.put('/:id', requireAuthentication, async function (req, res) {
  console.log("= ", req.userId);
  console.log("= ", req.body.userId);
  if ((req.userId.toString() !== req.body.userId.toString()) || req.admin)  {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
  else {
    const petID = req.params.id.toString();
    /*
     * Make sure the updated pet has the same ownerId as
     * the existing pet.
     */
    if (validateAgainstSchema(req.body, PetSchema)) {
        let updatedPet = extractValidFields(req.body, PetSchema);
        let existingPet = await getPet(petID);
        if (updatedPet.userId === existingPet.userId) {
          try {
            let update_pet = await putPet(petID, updatedPet);
            res.status(200).json(update_pet);
          }
          catch (err) {
            console.error(" -- error: ", err);
            res.status(500).send({
              err: "Error updating from DB. Try again later"
            });
          }
        } else {
          res.status(403).json({
            error: "Updated pet cannot modify owner id"
          });
        }
      } else {
        res.status(400).json({
          error: "Request body is not a valid pet object"
        });
      }
  }
});

/*
 * Route to delete a pet
 */
router.delete('/:petID', requireAuthentication, async function (req, res, next) {
  const petData = await getPet(req.params.petID)
  console.log("pet from database:", petData);

  if (petData == null) {
    res.status(403).send({
      error: "No pet with matching ID to delete."
    });
  }

  if (!((req.userId.toString() == petData.userId.toString()) || req.admin))  {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  }
  else {
    try {
      delete_message = await deletePet(req.params.petID);
      res.status(204).end();
    }
    catch (err){
      console.error(" -- error: ", err);
      res.status(500).send({
        err: "Error deleting data for a pet from DB. Try again later"
      });
      next();
    }
  }

});

router.post('/:petID/adopt', async function (req, res, next) {
  temp_pet = await getPet(req.params.petID);
  if (!temp_pet.isAdopted)
  {
    try {
      const id = await adoptPet(req.params.petID);
      res.status(201).json({
        id: id,
        links: {
          pet: `/pets/${id}`
        }
      });
    }
    catch (err) {
      console.error(" -- error: ", err);
      res.status(500).send({
        err: "Error adaopting pet. Try again later"
      });
    }
}
else {
  res.status(400).json({
    error: "This pet is already adopted."
  });
}});

router.get('/:petid/photos', async (req, res, next) => {
  const petid = req.params.petid;
  try{
    const photo = await getPhotosByPetId_new(petid);
    if (photo) {
      res.status(200).send(photo)
    }

    else {
      next();
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({
      error: "Error fetching photos page by pet ID."
    });
  }
});


module.exports = router;
