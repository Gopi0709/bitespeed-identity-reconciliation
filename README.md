# Bitespeed Identity Reconciliation API

## Tech Stack
- Node.js
- Express
- PostgreSQL
- Docker

## API Endpoint
POST /identify

http://localhost:3000/identify

### Request
{
 "email": "example@test.com",
 "phoneNumber": "123456"
}

### Response
{
 "contact": {
   "primaryContactId": 1,
   "emails": ["example@test.com"],
   "phoneNumbers": ["123456"],
   "secondaryContactIds": []
 }
}

## Run with Docker

docker compose up --build