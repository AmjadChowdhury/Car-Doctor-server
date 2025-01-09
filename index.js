const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

//middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://carDoctor:mcm5UPleR9P5kvQ5@cluster0.g7yl3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const servicesCollection = client.db('serviceDB').collection('services')
    const bookingsCollection = client.db('serviceDB').collection('bookings')

    app.get('/services',async(req,res)=>{
        const cursor = servicesCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })
    app.get('/services/:id',async(req,res)=>{
        const id = req.params.id
        const query = {_id : new ObjectId(id)}
        const result = await servicesCollection.findOne(query)
        res.send(result)
    })

    app.get("/bookings",async(req,res)=>{
      console.log(req.query.email)
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


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
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