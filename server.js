const shortid = require("shortid");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require('dotenv');



//using the dotenv variable
dotenv.config({ path: './.env' });



const Schema = mongoose.Schema;



app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));
mongoose
    .connect(process.env.DATABASE, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(res => {
        console.log("DB connected");
    })
    .catch(err => {
        console.log(err + "Bombbbbbbbb");
    });

const users = [];
const exercises = [];

const getExercisesFromUserWithId = id =>
    exercises.filter(exe => exe._id === id);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/exercise/new-user", (req, res) => {
    const username = req.body.username;
    const newUser = {
        username,
        _id: shortid.generate()
    };
    const new_user = new User(newUser);
    new_user.save((err, data) => {
        console.log("--------------------");
        console.log("NEW User Inserted in DB");
        console.log("--------------------");
        return err ? console.log("PEW PEW" + err) : res.json(data);
    });
});

app.get("/api/exercise/users", (req, res) => {
    User.find((err, data) => {
        if (err) console.log("PEW PEW" + err);
        else {
            res.json(data);
        }
    });
});

app.post("/api/exercise/add", (req, res) => {
    const { userId, description, duration, date } = req.body;
    const dateObj = date === "" ? new Date() : new Date(date);
    let newExercise = {
        userId: userId,
        description,
        duration: parseFloat(duration),
        date: dateObj.toDateString()
    };
    const new_exercise = new Exercise(newExercise);
    new_exercise.save((err, data) => {
        console.log("--------------------");
        console.log("NEW Exercise Inserted in DB");
        console.log("--------------------");
        User.findById(userId, (err, user) => {
            if (err) console.log("PEW PEW Inserting Exercise" + err);
            else {
                const result = {
                    username: user.username,
                    description,
                    duration: parseFloat(duration),
                    _id: user._id,
                    date: dateObj.toDateString()
                };
                console.log(result);
                res.json(result);
            }
        });
    });
});

app.get("/api/exercise/log", (req, res) => {
    const { userId, from, to, limit } = req.query;
    Exercise.find({ userId: userId }, (err, exercises) => {
        if (err) console.log(err);
        else {
            if (limit) {
                exercises = exercises.slice(0, limit);
            }
            if (from) {
                const fromDate = new Date(from);
                exercises = exercises.filter(exe => new Date(exe.date) > fromDate);
            }
            if (to) {
                const toDate = new Date(to);
                exercises = exercises.filter(exe => new Date(exe.date) < toDate);
            }
            User.findById(userId, (err, user) => {
                if (err) console.log("PEW PEW Inserting Exercise" + err);
                else {
                    const log = {
                        _id: userId,
                        username: user.username,
                        count: parseFloat(exercises.length),
                        log: exercises
                    };
                    res.json(log);
                }
            });
        }
    }); //PG-IMgdK5
});

// Not found middleware
app.use((req, res, next) => {
    return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
    let errCode, errMessage;

    if (err.errors) {
        // mongoose validation error
        errCode = 400; // bad request
        const keys = Object.keys(err.errors);
        // report the first validation error
        errMessage = err.errors[keys[0]].message;
    } else {
        // generic or custom error
        errCode = err.status || 500;
        errMessage = err.message || "Internal Server Error";
    }
    res
        .status(errCode)
        .type("txt")
        .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
});

//
//Models
//
const userSchema = new Schema({
    username: String,
    _id: {
        type: String,
        default: shortid.generate
    }
});
const User = mongoose.model("users", userSchema);

const exerciseSchema = new Schema({
    userId: {
        type: String
    },
    description: String,
    duration: Number,
    date: String
});
const Exercise = mongoose.model("exercises", exerciseSchema);
