const express = require('express');
const Redis = require('ioredis');
const app = express();
const PORT = 3000;

app.use(express.json());

app.timeout = 5000; // Set timeout to 5000 milliseconds

const redis = new Redis({
    port: 6379,
    host: 'redis-master',
});

redis.on('connect', () => {
    console.log('Connected to Redis');
});

redis.on('error', (err) => {
    console.error('Redis error:', err);
});

// Wrapper class for probabilistic caching
class ProbabilisticCache {
    constructor(client, cacheProbability = 0.5) {
        this.client = client;
        this.cacheProbability = cacheProbability;
    }

    // Використання async/await для асинхронного коду
    async set(key, value, ttl = 3600) {  // ttl в секундах, за замовчуванням 1 година
        const randomNum = Math.random();
        if (randomNum < this.cacheProbability) {
            await this.client.set(key, value, 'EX', ttl);  // Встановлення ключа з тайм-аутом
            console.log(`Cached key: ${key} with probability ${this.cacheProbability} and TTL ${ttl}`);
            return 'Cached';
        } else {
            console.log(`Skipped caching key: ${key} with probability ${this.cacheProbability}`);
            return 'Skipped';
        }
    }

    async get(key) {
        return await this.client.get(key);
    }
}

const probabilisticCache = new ProbabilisticCache(redis, 0.5);

// API endpoint for setting a value in the cache
app.post('/cache', async (req, res) => {
    const { key, value } = req.body;
    try {
        const result = await probabilisticCache.set(key, value, 3600);
        res.send(`Key: ${key}, Result: ${result}`);
    } catch (err) {
        console.error('Error setting cache:', err);
        res.status(500).send('Error setting cache');
    }
});

// API endpoint for retrieving a value from the cache
app.get('/cache/:key', async (req, res) => {
    const key = req.params.key;
    try {
        const value = await probabilisticCache.get(key);
        if (value == null) {
            res.status(404).send('Key not found');
        } else {
            res.send(`Key: ${key}, Value: ${value}`);
        }
    } catch (err) {
        console.error('Error getting cache:', err);
        res.status(500).send('Error getting cache');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
