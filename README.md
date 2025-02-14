# Vocal.fun API Documentation

A TypeScript-based backend service for real-time voice chat with AI agents, with web3 authentication and crypto credit-based billing.

## WebSocket Endpoints

The service maintains two WebSocket connections:

1. General Updates: `ws://localhost:4040`
   - Handles system events like balance updates
   - Receives `balance_update` event when credits are purchased

2. Voice Call: `ws://localhost:4040/call`
   - Real time voice chat
   - Requires authentication with token and sessionId
   ```javascript
   const socket = io('http://localhost:4040/call', {
       auth: {
           token: 'YOUR_JWT_TOKEN',
           sessionId: 'YOUR_SESSION_ID'
       }
   });
   ```

## REST API Endpoints

### Authentication

#### Generate Nonce
```http
POST /api/v1/auth/nonce
Content-Type: application/json

{
    "address": "0x"
}
```

#### Verify Signature
```http
POST /api/v1/auth/verify
Content-Type: application/json

{
    "address": "0x",
    "signature": "0x",
    "nonce": "9ad64aa8b9eb9a12"
}
```

### User Management

#### Get User Profile
```http
GET /api/v1/user
Authorization: Token YOUR_JWT_TOKEN
Content-Type: application/json
```

### Agent Management

#### List All Agents
```http
GET /api/v1/agents
```

#### Preview Agent
```http
POST /api/v1/agents/preview
Content-Type: application/json

{
    "agentId": "679e1ec26707af8a10eeff0b"
}
```

### Call Management

#### Start Call
```
POST /api/v1/call/start
Authorization: Token YOUR_JWT_TOKEN
Query Parameters:
  - agentId: ID of the agent to call
```

### Payment System

#### Get Available Payment Methods
```http
GET /api/v1/vocal/buy-credits
```

Response:
```json
{
    "paymentMethods": [
        {
            "name": "USDC",
            "symbol": "USDC",
            "address": "0x",
            "network": "base",
            "recipient": "0x"
        },
        {
            "name": "USDT",
            "symbol": "USDT",
            "address": "0x",
            "network": "base",
            "recipient": "0x"
        }
    ]
}
```

Credit purchases are automatically updated in user's balance through RPC websocket provider

## Data Models

### Agent Model
```typescript
interface Agent {
    _id: string;
    name: string;
    image: string;
    rate: number;
    twitter?: string;
    createdAt: Date;
}
```

## WebSocket Events

### Main Socket (`ws://localhost:4040`)
- `balance_update`: Emitted when user's credit balance changes

### Call Socket (`ws://localhost:4040/call`)
- Requires authentication with JWT token and valid sessionId
- Handles bi-directional audio streaming
- Session ID is obtained from the `/api/v1/call/start` endpoint

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   ```
    PORT: Server port (default: 4040)
    MONGODB_URI: MongoDB connection string
    REDIS_URI: Redis uri
    JWT_SECRET: Secret for JWT token generation
    RPC_URL: Base RPC URL
    AI_NODE_URL: URL for vocal AI node (https://github.com/vocal-fun/vocal-fun-ai-node)
   ```
4. Start development server: `npm run dev`
