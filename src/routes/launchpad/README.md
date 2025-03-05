# Launchpad API Reference

## Base URL
https://api.vocal.fun/api/v1/launchpad

## Authentication
Many endpoints require authentication via Bearer token in the Authorization header:

## Endpoints

### 1. Get Configuration
GET /config

Returns platform configuration settings.

**Response:**
```typescript
{
  createAgentFees: string;  // e.g. "0.02"
  chainId: number;         // e.g. 8453
}
```

### 2. List Agents
GET /agents

Returns a paginated list of all agents.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sort` (optional): Sort option ('newest' | 'marketCap', default: 'newest')

**Response:**
```typescript
{
  agents: Array<{
    _id: string;
    name: string;
    imageUrl: string;
    description: string;
    createdBy: {
      address: string;
    };
    currentPrice: number;
    marketCap: number;
  }>;
  pagination: {
    page: number;
    limit: number;
  }
}
```

### 3. Get Agent Details
GET /agent/:id

Returns detailed information about a specific agent.

**Response:**
```typescript
{
  name: string;
  symbol: string;
  totalSupply: number;
  description: string;
  // Additional agent details
}
```

### 4. Get Agent Comments
GET /comments/:agentId

Returns comments for a specific agent.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```typescript
{
  comments: {
    comments: Array<{
      content: string;
      createdBy: {
        address: string;
      };
      createdAt: string;
    }>;
  };
  pagination: {
    page: number;
    limit: number;
  }
}
```

### 5. Get Token Holders
GET /holders/:agentId

Returns list of token holders for an agent.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```typescript
{
  holders: {
    holders: Array<{
      user: {
        address: string;
      };
      balance: number;
      percentage: number;
    }>;
  };
  pagination: {
    page: number;
    limit: number;
  }
}
```

### 6. Get Agent Trades
GET /trades/:agentId

Returns trading history for an agent.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```typescript
{
  trades: {
    trades: Array<{
      timestamp: string;
      buyer: {
        address: string;
      };
      seller: {
        address: string;
      };
      amount: number;
      price: number;
      txHash: string;
    }>;
  };
  pagination: {
    page: number;
    limit: number;
  }
}
```

### 7. Get User Details
GET /user/:userId

Returns user details and their created agents.

**Response:**
```typescript
{
  user: {
    walletAddress: string;
    createdAt: string;
  };
  agents: Array<Agent>;
  pagination: {
    page: number;
    limit: number;
  }
}
```

### 8. Create Agent (Protected)
POST /create

Creates a new agent token. Requires authentication.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
```typescript
{
  name: string;
  symbol: string;
  description: string;
  systemPrompt: string;
  twitter?: string;
  website?: string;
  image: File;
  voiceSample: File;
}
```

### 9. Add Comment (Protected)
POST /comments/:agentId

Adds a comment to an agent. Requires authentication.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```typescript
{
  content: string;
}
```

## Error Responses
All endpoints may return error responses in the following format:
```typescript
{
  error: string;
  message: string;
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error