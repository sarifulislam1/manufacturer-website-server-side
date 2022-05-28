const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wcqbp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}


async function run() {
    try {
        await client.connect();
        const toolsCollection = client.db("manufacturer_website").collection("tools");
        const toolsOrderCollection = client.db("manufacturer_website").collection("orders");
        const userCollection = client.db("manufacturer_website").collection("users");
        const reviewCollection = client.db("manufacturer_website").collection("reviews");
        const paymentCollection = client.db("manufacturer_website").collection("payments");



        app.post('/create-payment-intent', verifyJWT, async (req, res) => {
            const service = req.body;
            const price = service.totalPrice;
            const amount = price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });
            res.send({ clientSecret: paymentIntent.client_secret })
        });



        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                next();
            }
            else {
                res.status(403).send({ message: 'forbidden' });
            }
        }


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
        app.get('/orders', verifyJWT, async (req, res) => {
            const userEmail = req.query.userEmail
            const decodedEmail = req.decoded.email;
            if (userEmail === decodedEmail) {
                const query = { userEmail: userEmail };
                const result = await toolsOrderCollection.find(query).toArray();

                res.send(result);
            }
            else {
                return res.status(403).send({ message: 'forbidden access' });
            }

        })

        app.patch('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = { _id: ObjectId(id) };
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }

            const result = await paymentCollection.insertOne(payment);
            const updatedOrders = await toolsOrderCollection.updateOne(filter, updatedDoc);
            res.send(updatedOrders);
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

        app.get('/user', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });

        app.put('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        })

        app.get('/order/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await toolsOrderCollection.findOne(query);
            res.send(order);
        })
        app.delete('/orders/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await toolsOrderCollection.deleteOne(filter);
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