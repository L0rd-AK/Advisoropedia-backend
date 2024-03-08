const express=require('express');
const cors=require('cors');
const jwt=require('jsonwebtoken');

require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app=express();
const port=process.env.PORT || 5000;
// ========== middleware ==========
app.use(cors({
    origin:['http://localhost:5173'],
    credentials: true
  }));
app.use(express.json());
// ========== custom middleware ==========
const verifyToken=async(req,res,next)=>{
    const token=req.headers.authorization;
    if(!token){
      return res.status(401).send({message:'Not Authorized'})
    }
    jwt.verify(token,process.env.TOKEN_KEY,(err,decoded)=>{
        if(err)return res.status(401).send({message:'Not Authorized'})
        req.user=decoded
      console.log('success');
        next()
    })  
  }

// ==================== mongoDB code ====================
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u9t7oll.mongodb.net/?retryWrites=true&w=majority`;

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
    // ==================== collections ====================
    const Users=client.db('Advisoropedia').collection('Users')
    const Posts=client.db('Advisoropedia').collection('Posts')
    
     // ========================================= JWT secure api =============================================================
     app.post('/jwt',async(req,res)=>{
        const user=req.body;
        console.log("jwt got hit",user);
        const token=jwt.sign(user,process.env.TOKEN_KEY,{expiresIn:'1h'})
        res.send({token})
      })
      app.post('/logout',async(req,res)=>{
        const user=req.body;
        res.clearCookie('token',{maxAge:0})
        .send({success: true});
      })
    // ==================== get + post api for users ====================
    app.get('/users',verifyToken, async(req,res)=>{
        const cursor=Users.find();
        const result=await cursor.toArray();
        res.send(result)
      })
    app.post('/users', async(req,res)=>{
        const user=req.body;
        const query={email: user.email}
        const existingUser= await Users.findOne(query)
        if(existingUser){
            return res.send({message:'user already exist',insertedId:null})
        }
        const result=await Users.insertOne(user);
        res.send(result);
    })
    // ==================== get + post api for posts ====================
    app.get('/posts',verifyToken, async(req,res)=>{
        console.log("post got hit");
        const cursor=Posts.find();
        const result=await cursor.toArray();
        res.send(result)
      })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);
// =================== basic backend ==========================
app.get('/',(req,res)=>{
    res.send('Backend is running')
})
app.listen(port,()=>{
    console.log(`backend is running on port ${port}`);
})