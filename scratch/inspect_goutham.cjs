const mongoose = require('mongoose');
const MONGODB_URI = "mongodb+srv://suryasrinathys_db_user:854SZAL3tMeZnCN3@cluster0.jkjr7p8.mongodb.net/";

async function check() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const userId = '6a64674a5c3cad2606e80db7';
  const profile = await db.collection('farmerprofiles').findOne({ userId: userId });
  console.log("Goutham Profile:", profile);

  const land = await db.collection('landdetails').findOne({ userId: userId });
  console.log("Goutham LandDetails:", land);

  await mongoose.disconnect();
}

check();
