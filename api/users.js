const router = require('express').Router();

const { validateAgainstSchema } = require('../lib/validation');

// get photos
const {getPhotosByUser} = require("../models/photo");

// authentication 
const {
  generateAuthToken,
  requireAuthentication,
  checkAdmin
} = require('../lib/authenticate');
const {
  UserSchema,
  validateUser,
  deleteUser,
  getUserByEmail,
  insertNewUser,
  getUserById,
  updateUser,
  FindallPetById
} = require('../models/user');

router.post('/', async (req, res) => {
  if (validateAgainstSchema(req.body, UserSchema)) {
    if(parseInt(req.body.admin) != 1) {
      try {
        const id = await insertNewUser(req.body);
        res.status(201).send({
          id: id,
        });
      } catch (err) {
        console.error(err);
        res.status(500).send({
          error: "Error inserting user into DB.  Please try again later."
        });
      }
    } else {
      if(check_token(req, res)) {
        const user_email = await getUserByEmail(req.user);
        if(!user_email) {
          res.status(403).send({
            error: "Unauthorized to access the specified resource"
          });
        } else {
          if(parseInt(user_email.admin) == 1) {
            try {
              const id = await insertNewUser(req.body);
              res.status(201).send({
                id: id
              });
            } catch (err) {
              console.error(err);
              res.status(500).send({
                error: "Error inserting user into DB.  Please try again later."
              });
            }
          }
        }
      }
    }
  } else {
    res.status(400).send({
      error: "Request body is not a valid user object."
    });
  }
});

router.post('/login', async(req, res, next) => {
  if (req.body && req.body.email && req.body.password){
    try{
      const authenticated = await validateUser(req.body.email, req.body.password);
      
      if(authenticated){
        const user = await getUserByEmail(req.body.email);
        console.log("  --", user)
        res.status(200).send({
          token: generateAuthToken(user._id, user.isAdmin)
        })
      } else{
        res.status(401).send({
            error: "Invalid authentication credentials."
          });
      } 
    } catch(err){
      res.status(500).send({
        error: "Error logging in.  Try again later."
      });
    }
  } else {
    res.status(400).send({
      error: "Request body needs `email` and `password`."
    })
  }
});

router.get('/:id/pets', requireAuthentication,  async (req, res) => {
  console.log("= ", req.userId);
  if( !(String(req.userId) == String(req.params.id)  || req.admin) )  {
    res.status(400).send({
      error: "Not having the correct account id."
    });
  } else {
    const pet_info = await FindallPetById(req.userId);
    res.status(201).send({
      pet_info
      /*
      userId: pet_info.userId,
      breed: pet_info.breed,
      isAdopted: pet_info.isAdopted,
      color: pet_info.color,
      age: pet_info.age,
      gender: pet_info.gender*/
      });
  }
});

router.get('/:id', requireAuthentication, async (req, res, next) => {
  const user = await getUserById(req.params.id);
  if( !(String(req.userId) == String(req.params.id)  || req.admin) ) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  } else {
    try {
      res.status(200).send({
        name: user.name,
        email: user.email,
        address: user.address,
        phonenumber: user.phonenumber
      });
    } catch(err) {
      console.log(" --Error:", err);
      res.status(500).send({
        error: "Error fetching user. Try again later."
      });
    }
  }
});

router.put('/:id', requireAuthentication, async (req, res) => {
  const user = await getUserById(req.params.id);
  console.log("= ", req.userId);
  console.log("= ", req.params.id);
  if( !(String(req.userId) == String(req.body.userId)  || req.admin) ) {
    if (validateAgainstSchema(req.body, UserSchema)) {
      if(parseInt(req.body.admin) != 1) {
        try {
          const id = await updateUser(req.params.id, req.body);
          res.status(201).send({
          id: id
          });
        } catch (err) {
          console.error(err);
          res.status(500).send({
            error: "Error Updating user into DB.  Please try again later."
          });
        }
      } else {
        if(check_token(req, res)) {
          const user_email = await getUserByEmail(req.user);
          if(!user_email) {
            res.status(403).send({
              error: "Unauthorized to access the specified resource"
            });
          } else {
            if(parseInt(user_email.admin) == 1) {
              try {
                const id = await insertNewUser(req.body);
                res.status(201).send({
                  id: id,
                });
              } catch (err) {
                console.error(err);
                res.status(500).send({
                  error: "Error inserting user into DB.  Please try again later."
                });
              }
            }
          }
        }
      }
    } else {
      res.status(400).send({
        error: "Request body is not a valid user object."
      });
    }
  } else {
    res.status(400).send({
      error: "Not having the correct account id."
    });
  }
});

router.get('/:id/photos', requireAuthentication,  async (req, res) => {
  if( !(String(req.userId) == String(req.params.id)  || req.admin) ) {
    res.status(403).send({
      error: "Unauthorized to access the specified resource"
    });
  } else{
    try {
      const userid = String(req.params.id);
      const photos = await getPhotosByUser(userid);
      res.status(200).send({"photos": photos});
    } catch (err) {
      res.status(500).send({
        error: "Error fetching user's photos page."
      });
    }
  }
});

router.delete('/:id' , requireAuthentication , async (req,res) => {
  if( !(String(req.userId) === String(req.params.id)  || req.admin) ) {
    res.status(403).send({
      error: "Unauthorized to delete user"
    });
  } else{
    console.log("in else")
    try {
      const result = await deleteUser(req.params.id);
      res.status(200).send("User Deleted");
    } catch (err) {
      res.status(500).send({
        error: "Error fetching user's  page."
      });
    } 
  }
    
})
module.exports = router;
