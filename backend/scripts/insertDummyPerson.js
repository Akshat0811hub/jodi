const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Person = require("../models/Person"); // adjust if your model path is different

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ MongoDB connected");

    const dummyPerson = new Person({
      name: "Test User",
      gender: "Male",
      maritalStatus: "Never Married",
      dob: "1990-09-19",
      nativePlace: "Panipat, Haryana",
      height: "5.7",
      complexion: "Fair Skin",
      eatingHabits: "Vegetarian",
      nri: false,
      education: "Graduation - BA",
      occupation: "Self Owned Business",
      income: "36 LPA",
      residence: "Own Flat in Pitampura, Delhi",
      family: {
        father: "Late. Shree Rajiv Bansal",
        mother: "Smt. Sudesh Bansal",
      },
      familyIncome: "48 LPA+",
      otherProperty: "Yes, Discuss in meeting",
      siblings: [
        { name: "Aman Bansal", relation: "Younger Brother", age: "xx", profession: "Same business", maritalStatus: "Never Married" },
        { name: "Ms. Sonali Gupta", relation: "Elder Sister", age: "xx", profession: "Homemaker", maritalStatus: "Married" }
      ],
      photos: [
        `${process.env.BASE_URL || "http://localhost:5000"}/uploads/sample1.jpg`,
        `${process.env.BASE_URL || "http://localhost:5000"}/uploads/sample2.jpg`,
        `${process.env.BASE_URL || "http://localhost:5000"}/uploads/sample3.jpg`
      ]
    });

    await dummyPerson.save();
    console.log("✅ Dummy person inserted with ID:", dummyPerson._id);

    mongoose.connection.close();
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    mongoose.connection.close();
  });
