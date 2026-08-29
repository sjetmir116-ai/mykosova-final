// ===== FIREBASE ADMIN (initializim lazy) =====
// Lazy që testet lokale të mund të importojnë module pa credentials
const admin = require('firebase-admin');

let inited = false;
function getAdmin() {
  if (!inited) {
    admin.initializeApp(); // në prodhim: credentials automatikisht nga ambienti i Functions
    inited = true;
  }
  return admin;
}

module.exports = getAdmin;
