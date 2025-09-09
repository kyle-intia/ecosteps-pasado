# EcoSteps Backend - Pre-Assessment Survey

This is the backend implementation for the EcoSteps Pre-Assessment survey, built with Node.js, Express, and MongoDB.

## Features

- **Complete CO2 Calculation**: All calculations are performed on the backend
- **RESTful API**: Clean API endpoints for frontend integration
- **MongoDB Integration**: Persistent storage of user responses and calculated results
- **Validation**: Comprehensive input validation
- **Error Handling**: Robust error handling with meaningful messages

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Security**: Helmet, CORS, Rate Limiting

## API Endpoints

### POST /api/preassessment/submit
Submit user responses and receive calculated CO2 footprint.

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "responses": {
    "Q1_modes": ["Personal Car", "Public Transport"],
    "Q2_kmPerDay": 15,
    "Q3_flightsPerYear": 2,
    "Q4_homeType": "Apartment",
    "Q5_residents": 2,
    "Q6_billRange": "7501-12000",
    "Q7_hasRenewables": true,
    "Q8_dietType": "Moderate Meat"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "results": {
      "sectionA": 1.6,
      "sectionB": 1.25,
      "sectionC": 2.0,
      "totalCO2": 4.85
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET /api/preassessment/:userId
Get all pre-assessments for a user.

### GET /api/preassessment/:userId/latest
Get the latest pre-assessment for a user.

## Installation

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your MongoDB connection string

5. Start MongoDB service

6. Run the server:
   ```bash
   npm run dev
   ```

## Development

- **Development mode**: `npm run dev` (with nodemon)
- **Production mode**: `npm start`

## Calculation Logic

The backend implements the following calculation sections:

### Section A: Transport and Travel
- Commute modes with specific CO2 factors
- Flight calculations (0.8 tons per flight)

### Section B: Home Energy
- Home type base values (Large House: 4.5, Small House: 3.5, Apartment: 2.5)
- Bill range adjustments
- Renewable energy discount (10% reduction)

### Section C: Food and Diet
- Diet type CO2 factors ranging from 1.2 to 5.0 tons

## Error Handling

The API provides detailed error messages for:
- Missing required fields
- Invalid data types
- Out of range values
- Invalid enum values
- Database connection issues

## Security Features

- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation and sanitization
