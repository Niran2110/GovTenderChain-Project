const bcrypt = require('bcryptjs');

// Change the password to the contractor's password
const plainPassword = 'contractorpassword';
const salt = bcrypt.genSaltSync(10);
const hashedPassword = bcrypt.hashSync(plainPassword, salt);

console.log("--- New Hashed Password for Contractor ---");
console.log(hashedPassword);
console.log("--- Copy this new hash ---");