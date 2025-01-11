import express from "express";
import bodyParser from "body-parser";
//import cors from "cors";
import pg from "pg";
import env from "dotenv";
import bcrypt from "bcrypt";
import passport from "passport";
import session from "express-session";
//import pgSession from "connect-pg-simple";
import { Strategy } from "passport-local";

env.config();

const app = express();
const saltRounds = 10;


app.use(bodyParser.urlencoded({ extended: true }));


app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 1000 * 60 * 30
        }
    })
);

app.use(passport.initialize());
app.use(passport.session());


const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.toString() : null,
    port: process.env.DB_PORT,
});

db.connect();
   


app.get('/', (req, res) => {
    res.send('Budget Tracker Backend is Running!');
});

app.get("/api/health", (req, res) => {
    res.send("Backend is working!");
});

app.post("/register", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    //console.log(email , password);


    try {
        const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if(checkResult.rows.length > 0) {
            res.send("Email already exists. Try logging in");            
        } else {
            //Hash Password
            bcrypt.hash(password, saltRounds, async (err, hash) => {
                if (err) {
                    console.error("Error hashing password:", err);
                } else {
                    console.log("Hashed Passwprd: ", hash);
                    const result = await db.query("INSERT INTO users (email, password) VALUES ($1,$2) RETURNING *", [email, hash]);

                    const user = result.rows[0];
                    req.login(user, (err) => {
                        console.log(err);
                        res.redirect("/");
                    });
                }
            });
        }
    } catch (err) {
        console.error("Registration error:", err);
        res.send("Error registering user.");
    }
});

app.post("/debug", (req, res) => {
    console.log("Request body:", req.body); // Logs the incoming request
    res.send("Check server logs for request body.");
});


app.post("/login", (req, res, next) => {
    console.log("Login request body:", req.body); // Debug log
    next();
}, passport.authenticate("local", {
    failureRedirect: "/login?error=1",
}), (req, res) => {
    console.log("User authenticated successfully:", req.user); // Debug log
    res.send(`Logged in successfully: Welcome ${req.user.email}`);
});



  app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error("Logout error:", err);
            return res.send("Error logging out.");
        }
        res.send("Logged out successfully.");
    });
});

passport.use(new Strategy({ usernameField: "email" }, async function verify(email, password, cb) {
    console.log("Inside Strategy, received email:", email); // Debug log
    try {
        const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            console.log("No user found with email:", email);
            return cb(null, false, { message: "User not found" });
        }

        const user = result.rows[0];
        console.log("User fetched:", user);

        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Password match status:", isMatch);

        if (isMatch) {
            return cb(null, user);
        } else {
            return cb(null, false, { message: "Invalid password" });
        }
    } catch (err) {
        console.error("Error in Strategy:", err);
        return cb(err);
    }
}));



  passport.serializeUser((user, cb) => {
    cb(null,user);
  });
  
  passport.deserializeUser((user, cb) => {
    cb(null,user);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));