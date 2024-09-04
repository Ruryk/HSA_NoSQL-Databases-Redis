const express = require('express');
const redis = require('redis');
const client = redis.createClient();
const app = express();
const PORT = 3000;

app.use(express.json());

client.on('connect', () => {
    console.log('Connected to Redis');
    // Setting the memory limit in Redis
    // client.config('set', 'maxmemory', '100mb', (err, res) => {
    //     if (err) throw err;
    //     console.log('Maxmemory set to 100mb');
    // });
});

client.on('error', (err) => {
    console.error('Redis error:', err);
});

// Wrapper class for probabilistic caching
class ProbabilisticCache {
    constructor(client, cacheProbability = 0.5) {
        this.client = client;
        this.cacheProbability = cacheProbability;
    }

    set(key, value, callback) {
        // Generate a random number between 0 and 1
        const randomNum = Math.random();
        // Cache the value only if the random number is less than the set probability
        if (randomNum < this.cacheProbability) {
            this.client.set(key, value, callback);
            console.log(`Cached key: ${key} with probability ${this.cacheProbability}`);
        } else {
            console.log(`Skipped caching key: ${key} with probability ${this.cacheProbability}`);
            if (callback) callback(null, 'Skipped');
        }
    }

    get(key, callback) {
        // Retrieve the value from cache
        this.client.get(key, callback);
    }
}

const probabilisticCache = new ProbabilisticCache(client, 0.5);

// API endpoint for setting a value in the cache
app.post('/cache', (req, res) => {
    const { key, value } = req.body;
    probabilisticCache.set(key, value, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(`Key: ${key}, Result: ${result}`);
    });
});

// API endpoint for retrieving a value from the cache
app.get('/cache/:key', (req, res) => {
    const { key } = req.params;
    probabilisticCache.get(key, (err, value) => {
        if (err) return res.status(500).send(err);
        if (value == null) return res.status(404).send('Key not found');
        res.send(`Key: ${key}, Value: ${value}`);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
