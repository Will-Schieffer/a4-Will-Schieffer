require('dotenv').config()

const express = require( 'express' ),
      session = require( 'express-session' ),
      passport = require( 'passport' ),
      GitHubStrategy = require( 'passport-github2' ).Strategy,
      { MongoClient } = require( 'mongodb' ),
      helmet = require( 'helmet' ),
      morgan = require( 'morgan' ),
      compression = require( 'compression' ),
      dir  = 'public/',
      port = 3000

const uri = process.env.MONGODB_URI
const client = new MongoClient( uri )

// gets set to the MongoDB collection(s) once we've connected, in start() at the bottom
let recipes
let users

const app = express()

app.use( helmet() )
app.use( morgan( 'dev' ) )
app.use( compression() )

app.use( session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))

app.use( passport.initialize() )
app.use( passport.session() )

passport.use( new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: 'https://a3-will-schieffer.onrender.com/auth/github/callback' // hardcoding this, should be fine??
}, async function( accessToken, refreshToken, profile, done ) {
  try {
    const existing = await users.findOne( { githubId: profile.id } )

    if ( existing ) {
      return done( null, existing )
    }

    // first time we've seen this GitHub account -- create an account for them
    const newUser = {
      githubId: profile.id,
      username: profile.username
    }

    await users.insertOne( newUser )
    return done( null, newUser )

  } catch (err) {
    return done( err )
  }
}))

passport.serializeUser( function( user, done ) {
  done( null, user.githubId )
})

passport.deserializeUser( async function( githubId, done ) {
  try {
    const user = await users.findOne( { githubId: githubId } )
    done( null, user )
  } catch (err) {
    done( err )
  }
})

function ensureAuthenticated( request, response, next ) {
  if ( request.isAuthenticated() ) {
    return next()
  }
  response.redirect( '/login.html' )
}

// Helps to resolve a browser error caused by middleware and fetch requests
// Should improve best pratice score on lighthouse!
function ensureAuthenticatedAPI( request, response, next ) {
  if ( request.isAuthenticated() ) {
    return next()
  }
  response.status( 401 ).json( { error: 'Not logged in' } )
}

// yay my old routes are dead
app.use( express.static( dir, { index: false } ) )

app.get( '/', ensureAuthenticated, function( request, response ) {
  response.sendFile( __dirname + '/' + dir + 'index.html' )
})

app.get( '/auth/github', passport.authenticate( 'github' ) )

app.get( '/auth/github/callback',
  passport.authenticate( 'github', { failureRedirect: '/login.html' } ),
  function( request, response ) {
    response.redirect( '/' )
  }
)

app.get( '/logout', function( request, response, next ) {
  request.logout( function( err ) {
    if ( err ) { return next( err ) }
    response.redirect( '/login.html' )
  })
})

// lets the front end ask who's logged in
app.get( '/me', ensureAuthenticatedAPI, function( request, response ) {
  response.json( { username: request.user.username } )
})

app.get( '/recipes', ensureAuthenticatedAPI, sendRecipes )
app.post( '/submit', ensureAuthenticatedAPI, handlePost )
app.post( '/delete', ensureAuthenticatedAPI, handleDelete )
app.post( '/update', ensureAuthenticatedAPI, handleUpdate )

async function handlePost( request, response ) {
  let dataString = ''

  request.on( 'data', function( data ) {
    dataString += data
  })

  request.on( 'end', async function() {

    let recipe

    try {
      recipe = JSON.parse(dataString)
    } catch (err) {
      response.writeHead(400, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: 'Invalid JSON' }))
      return
    }

    let url

    /* Validate URL after testing feedback */
    try {
      url = new URL(recipe.url)

      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Invalid protocol')
      }

      if (!url.hostname) {
        throw new Error('Missing hostname')
      }

    } catch (err) {
      response.writeHead(400, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: 'Invalid URL' }))
      return
    }

    recipe.domain = url.hostname.replace(/^www\./, '')
    recipe.id = Date.now() // This is a little scuffed but it should work
    recipe.githubId = request.user.githubId

    await recipes.insertOne( recipe )
    const allRecipes = await recipes.find( { githubId: request.user.githubId } ).toArray()

    response.writeHead( 200, "OK", {'Content-Type': 'application/json' })

    // change this to incorporate data - ok
    response.end(JSON.stringify(allRecipes))
  })
}

async function handleDelete( request, response ) {
  let dataString = ''

  request.on( 'data', function( data ) {
    dataString += data
  })

  request.on( 'end', async function() {

    let payload

    try {
      payload = JSON.parse(dataString)
    } catch (err) {
      response.writeHead(400, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: 'Invalid JSON' }))
      return
    }

    const id = payload.id

    await recipes.deleteOne( { id: id } )

    const allRecipes = await recipes.find( { githubId: request.user.githubId } ).toArray()

    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify(allRecipes))
  })
}

async function handleUpdate( request, response ) {
  let dataString = ''

  request.on( 'data', function( data ) {
    dataString += data
  })

  request.on( 'end', async function() {

    let incoming

    try {
      incoming = JSON.parse(dataString)
    } catch (err) {
      response.writeHead(400, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify({ error: 'Invalid JSON' }))
      return
    }

    await recipes.updateOne( { id: incoming.id }, { $set: incoming }, { upsert: true } )

    const allRecipes = await recipes.find( { githubId: request.user.githubId } ).toArray()

    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify(allRecipes))
  })
}

async function sendRecipes( request, response ) {
  const allRecipes = await recipes.find( { githubId: request.user.githubId } ).toArray()

  response.writeHead( 200, "OK", {'Content-Type': 'application/json' })
  response.end(JSON.stringify(allRecipes))
}

// catches anything that didn't match a route above or a static file
app.use( function( request, response ) {
  response.writeHead(404, { 'Content-Type': 'text/plain' })
  response.end('404 Error: Not Found')
})

async function start() {
  await client.connect()

  const db = client.db()
  recipes = db.collection( 'recipes' )
  users = db.collection( 'users' )

  // debug message
  console.log('Connected, listening on port ' + port)

  app.listen( process.env.PORT || port )
}

start()
