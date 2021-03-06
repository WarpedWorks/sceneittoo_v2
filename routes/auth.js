const passport = require('passport');
const GitHubStrategy = require('passport-github').Strategy;
const session = require('express-session');
const cookieParser = require('cookie-parser')
const models = require('../models')

const setupAuth = (app) => {
    app.use(cookieParser());
    app.use(session({
        secret: process.env.SECRET,
        resave: true,
        saveUninitialized: true,
    }));

    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
        callbackURL: "http://localhost:3000/github/auth"
            }, (accessToken, refreshToken, profile, done) => {
                console.log(profile);
                models.User.findOrCreate({
                    where: {
                        github_id: profile.id
                    },
                    defaults: {
                        github_id: profile.id,
                        username: profile.username
                    }
                })
                .then(result => {
                    return done(null, result[0]);
                })
                .catch(done);
            }));

    passport.serializeUser(function(user, done) {
        done(null, user.id);
        });

        // This configures how passport checks what's in the
        // session to see if the login is still valid.
        passport.deserializeUser(function(id, done) {
        done(null, id);
        });
        app.use(passport.initialize());
        app.use(passport.session());

        // app.get('/login', (req, res) => {
        //     res.render ('login');
        // })
        app.get('/login/github', passport.authenticate('github'));
        app.get('/logout', (req, res, next) => {
            res.logout();
            res.redirect('/');
        })

        // STORE THE PAGE THEY WANTED AND REDIRECT...
        //RIGHT NOW- PLOPS THEM ON THE HOME PAGE
        app.get('/github/auth',
        passport.authenticate('github', {
                failureRedirect: '/login'
            }),
            (req, res) => {
                res.redirect('/search.html');
            }
        )
}
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/search.html');
}

module.exports = setupAuth;
module.exports.ensureAuthenticated = ensureAuthenticated;