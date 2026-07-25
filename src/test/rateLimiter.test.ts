import * as assert from 'node:assert/strict';
import { RateLimiter } from '../utils/rateLimiter';

const limiter = new RateLimiter();
for (let request = 0; request < 20; request++) limiter.recordRequest('GroqProvider');
assert.equal(limiter.isLimited('GroqProvider'), true, 'Groq must be limited at 20 requests');
assert.equal(limiter.isLimited('UnknownProvider'), false, 'Unknown providers must not be blocked');
console.log('rateLimiter tests passed');
