const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

//middleware
app.use(cors({
  origin: [
    'https://car-doctors-d7fe2.web.app',
    'https://car-doctors-d7fe2.firebaseapp.com',
    'http://localhost:5173'
  ],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g7yl3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//middleware...
const logger = async(req,res,next) => {
  console.log('Called',req.host,req.originalUrl)
  next()
}
const verifyToken = async(req,res,next)=>{
  const token = req.cookies?.token
  // console.log("In verify",token)
  if(!token){
    return res.status(401).send({message: 'Unauthorized'})
  }
  jwt.verify(token,process.env.ACCESS_TOKEN,(err,decoded)=>{
    if(err){
      // console.log(err)
      return res.status(401).send({message: 'Unauthorized'})
    }
    // console.log("value in the token",decoded)
    req.user = decoded
    next()
  })
}

const cookieOption = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production'? 'none': 'strict',
  secure: process.env.NODE_ENV === 'production'? true: false
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const servicesCollection = client.db('serviceDB').collection('services')
    const bookingsCollection = client.db('serviceDB').collection('bookings')
    const servicesReviewCollection = client.db('serviceDB').collection('servicesReview')

    // auth related..
    app.post('/jwt',logger,async(req,res)=>{
      const user = req.body
      // console.log(user)
      const token = jwt.sign(user,process.env.ACCESS_TOKEN, {expiresIn: '1h'})
      res
      .cookie('token',token,cookieOption)
      .send({success : true})
    })

    app.post('/logout',async(req,res)=>{
      const user = req.body
      res.clearCookie('token',{...cookieOption,maxAge: 0}).send({success : true})
    })



    // service related...
    app.get('/services',logger,async(req,res)=>{
        const page = parseInt(req.query.page)
        const size = parseInt(req.query.size)
        console.log(page,size)
        const cursor = servicesCollection.find()
        const result = await cursor
        .skip(page*size)
        .limit(size)
        .toArray()
        res.send(result)
    })
    app.get('/servicesCount',async(req,res) => {
      const count = await servicesCollection.estimatedDocumentCount()
      res.send({count})
    })
    app.get('/services/:id',async(req,res)=>{
        const id = req.params.id
        const query = {_id : new ObjectId(id)}
        const result = await servicesCollection.findOne(query)
        res.send(result)
    })

    app.get("/bookings",logger,verifyToken,async(req,res)=>{
      console.log(req.query.email)
      // console.log('tok tok token',req.cookies.token,req.user)
      if(req.query.email !== req.user.email){
        res.status(403).send({message: 'forbidden access'})
      }
      
      let query = {}
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const result = await bookingsCollection.find(query).toArray()
      res.send(result)
    })
    
    app.post("/bookings",async(req,res)=>{
      const booking = req.body
      const result = await bookingsCollection.insertOne(booking)
      res.send(result)
    })
    app.delete("/bookings/:id",async(req,res)=>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await bookingsCollection.deleteOne(query)
      res.send(query)
    })

    app.post('/servicesReview',async(req,res)=>{
      const servicesReview = req.body
      const result = await servicesReviewCollection.insertOne(servicesReview)
      res.send(result)
    })
    app.get('/servicesReview',async(req,res)=>{
      const cursor = servicesReviewCollection.find()
      const result = await cursor.toArray()
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/",(req,res)=>{
    res.send("hello car doctor")
})
app.listen(port,()=>{
    console.log('hello car doctor running')
})