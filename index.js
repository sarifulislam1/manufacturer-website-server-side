const express = require('express');
const cors = require('cors');
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
            // console.log(data);
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
            console.log('all info', order);
            const result = await toolsOrderCollection.insertOne(order);
            res.send(result);

        })




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