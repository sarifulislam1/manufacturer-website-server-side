const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wcqbp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const toolsCollection = client.db("manufacturer_website").collection("tools");
        const toolsOrderCollection = client.db("manufacturer_website").collection("orders");
        const userCollection = client.db("manufacturer_website").collection("users");
        const reviewCollection = client.db("manufacturer_website").collection("reviews");



        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
        });

        app.post('/tools', async (req, res) => {
            const tools = req.body;
            // console.log('all info', order);
            const result = await toolsCollection.insertOne(tools);
            res.send(result);

        })


        app.get('/tools', async (req, res) => {
            const query = {};
            const cursor = toolsCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);
        })


        app.get('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const tools = await toolsCollection.findOne(query);
            res.send(tools);
        })

        app.put('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            // console.log(data)
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    availableQuantity: data.availableQuantity
                }
            };
            const result = await toolsCollection.updateOne(filter, updatedDoc, options);
            res.send(result);

        })
        app.post('/orders', async (req, res) => {
            const order = req.body;
            // console.log('all info', order);
            const result = await toolsOrderCollection.insertOne(order);
            res.send(result);

        })
        app.get('/orders', async (req, res) => {
            const query = {};
            const result = await toolsOrderCollection.find(query).toArray();
            // console.log(result);
            res.send(result);
        })

        app.post('/add-review', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);

        })

        app.get('/add-review', async (req, res) => {
            const query = {};
            const result = await reviewCollection.find(query).toArray();
            // console.log(result);
            res.send(result);
        })

        // app.get('/orders', async (req, res) => {
        //     const userEmail = req.query.userEmail
        //     console.log(userEmail);
        //     const query = { userEmail: userEmail }
        //     console.log(query);
        //     const orders = await toolsOrderCollection.find(query).toArray()
        //     res.send(orders)
        // })



    } finally {

    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Hello From tools uncle!')
})

app.listen(port, () => {
    console.log(`tools app listening on port ${port}`)
})