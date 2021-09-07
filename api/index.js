const router = require('express').Router();

router.use('/pets', require('./pets'));
router.use('/users', require('./users'));
router.use('/photos', require('./photos'));
router.use('/chatrooms', require('./chatrooms'));

module.exports = router;
