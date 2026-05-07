<<<<<<< HEAD
# TravelnWorldZ Backend

A comprehensive backend API for a travel itinerary management system with authentication and itinerary creation features.

## Features

- **User Authentication**: Register, login, and refresh token functionality
- **Itinerary Management**: Create, read, update, and delete travel itineraries
- **Role-based Access Control**: User, Admin, and Super Admin roles
- **Public API**: Public endpoints for browsing itineraries
- **Image Upload Support**: Cloudinary integration for media management
- **Payment Integration**: Razorpay payment gateway support

## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **Cloudinary** for image management
- **Razorpay** for payments

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Cloudinary account (for image uploads)
- Razorpay account (for payments)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TravelnWorldZ-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `env.example` to `.env`
   - Fill in all the required environment variables:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database
   MONGO_URI=mongodb://localhost:27017/travelnworldz

   # JWT Secrets (generate strong secrets for production)
   JWT_SECRET=your_jwt_secret_key_here
   ACCESS_TOKEN_SECRET=your_access_token_secret_here
   REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

   # Password Hashing
   SALT_ROUNDS=12

   # Cloudinary Configuration
   CLOUDINARY_API=your_cloudinary_api_key
   CLOUDINARY_SECRET=your_cloudinary_secret
   CLOUDINARY_NAME=your_cloudinary_cloud_name

   # Razorpay Configuration
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret

   # Super Admin Configuration
   SUPERADMIN_EMAIL=super@travelnworldz.com
   SUPERADMIN_PASSWORD=superadmin123
   SEED_SUPERADMIN_KEY=your_seed_key_here

   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /register` - Register a new user
- `POST /login` - User login
- `POST /refresh-token` - Refresh access token
- `POST /seed-superadmin` - Create super admin (protected)

### Itinerary Routes (`/api/itineraries`)

#### Public Endpoints
- `GET /cards` - Get itinerary cards (with optional `?type=domestic|international`)
- `GET /international/:country` - Get international itineraries by country
- `GET /:slug` - Get itinerary by slug

#### Protected Endpoints (Admin/Super Admin)
- `POST /` - Create new itinerary
- `PUT /:id` - Update itinerary
- `DELETE /:id` - Delete itinerary

## Database Models

### User Model
- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `phone_no`: String (required)
- `role`: Enum (user, admin, superadmin)
- `isActive`: Boolean (default: true)

### Itinerary Model
- `name`: String (required) - Itinerary title
- `destinationName`: String - Primary destination
- `slug`: String (required, unique) - URL-friendly identifier
- `type`: Enum (domestic, international)
- `destinations`: [String] - Array of destination names
- `days`: [DaySchema] - Array of day-wise details
- `numberOfDays`: Number - Total days
- `description`: String - Itinerary description
- `inclusions`: String - What's included
- `exclusions`: String - What's not included
- `terms`: String - Terms and conditions
- `paymentPolicy`: String - Payment policy
- `price`: Number - Base price
- `discount`: Number - Discount amount
- `finalPrice`: Number - Final price after discount
- `images`: [String] - Array of image URLs
- `agentNotes`: String - Internal notes
- `published`: Boolean - Publication status

### Day Schema
- `dayNumber`: Number (required)
- `title`: String - Day title
- `details`: String - Day details
- `activities`: String - Activities for the day
- `meals`: String - Meal information
- `stay`: String - Accommodation details

## Authentication

The API uses JWT-based authentication with access and refresh tokens:

- **Access Token**: Short-lived (15 minutes) for API requests
- **Refresh Token**: Long-lived (7 days) stored in HTTP-only cookies

### Headers Required for Protected Routes
```
Authorization: Bearer <access_token>
```

## Role-based Access Control

- **User**: Can view public itineraries
- **Admin**: Can create, update, and delete itineraries
- **Super Admin**: Full access including user management

## Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Development

### Running in Development Mode
```bash
npm run dev
```

### Environment Variables
Make sure to set up all required environment variables in your `.env` file. The application will not start without the required variables.

### Database Connection
The application automatically connects to MongoDB on startup. Make sure MongoDB is running and accessible.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong, unique secrets for JWT tokens
3. Configure proper CORS settings
4. Set up proper database credentials
5. Configure Cloudinary and Razorpay with production credentials

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
=======
# TravelnWorldZ Backend

A comprehensive backend API for a travel itinerary management system with authentication and itinerary creation features.

## Features

- **User Authentication**: Register, login, and refresh token functionality
- **Itinerary Management**: Create, read, update, and delete travel itineraries
- **Role-based Access Control**: User, Admin, and Super Admin roles
- **Public API**: Public endpoints for browsing itineraries
- **Image Upload Support**: Cloudinary integration for media management
- **Payment Integration**: Razorpay payment gateway support

## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **Cloudinary** for image management
- **Razorpay** for payments

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Cloudinary account (for image uploads)
- Razorpay account (for payments)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TravelnWorldZ-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `env.example` to `.env`
   - Fill in all the required environment variables:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database
   MONGO_URI=mongodb://localhost:27017/travelnworldz

   # JWT Secrets (generate strong secrets for production)
   JWT_SECRET=your_jwt_secret_key_here
   ACCESS_TOKEN_SECRET=your_access_token_secret_here
   REFRESH_TOKEN_SECRET=your_refresh_token_secret_here

   # Password Hashing
   SALT_ROUNDS=12

   # Cloudinary Configuration
   CLOUDINARY_API=your_cloudinary_api_key
   CLOUDINARY_SECRET=your_cloudinary_secret
   CLOUDINARY_NAME=your_cloudinary_cloud_name

   # Razorpay Configuration
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret

   # Super Admin Configuration
   SUPERADMIN_EMAIL=super@travelnworldz.com
   SUPERADMIN_PASSWORD=superadmin123
   SEED_SUPERADMIN_KEY=your_seed_key_here

   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /register` - Register a new user
- `POST /login` - User login
- `POST /refresh-token` - Refresh access token
- `POST /seed-superadmin` - Create super admin (protected)

### Itinerary Routes (`/api/itineraries`)

#### Public Endpoints
- `GET /cards` - Get itinerary cards (with optional `?type=domestic|international`)
- `GET /international/:country` - Get international itineraries by country
- `GET /:slug` - Get itinerary by slug

#### Protected Endpoints (Admin/Super Admin)
- `POST /` - Create new itinerary
- `PUT /:id` - Update itinerary
- `DELETE /:id` - Delete itinerary

## Database Models

### User Model
- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `phone_no`: String (required)
- `role`: Enum (user, admin, superadmin)
- `isActive`: Boolean (default: true)

### Itinerary Model
- `name`: String (required) - Itinerary title
- `destinationName`: String - Primary destination
- `slug`: String (required, unique) - URL-friendly identifier
- `type`: Enum (domestic, international)
- `destinations`: [String] - Array of destination names
- `days`: [DaySchema] - Array of day-wise details
- `numberOfDays`: Number - Total days
- `description`: String - Itinerary description
- `inclusions`: String - What's included
- `exclusions`: String - What's not included
- `terms`: String - Terms and conditions
- `paymentPolicy`: String - Payment policy
- `price`: Number - Base price
- `discount`: Number - Discount amount
- `finalPrice`: Number - Final price after discount
- `images`: [String] - Array of image URLs
- `agentNotes`: String - Internal notes
- `published`: Boolean - Publication status

### Day Schema
- `dayNumber`: Number (required)
- `title`: String - Day title
- `details`: String - Day details
- `activities`: String - Activities for the day
- `meals`: String - Meal information
- `stay`: String - Accommodation details

## Authentication

The API uses JWT-based authentication with access and refresh tokens:

- **Access Token**: Short-lived (15 minutes) for API requests
- **Refresh Token**: Long-lived (7 days) stored in HTTP-only cookies

### Headers Required for Protected Routes
```
Authorization: Bearer <access_token>
```

## Role-based Access Control

- **User**: Can view public itineraries
- **Admin**: Can create, update, and delete itineraries
- **Super Admin**: Full access including user management

## Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

## Development

### Running in Development Mode
```bash
npm run dev
```

### Environment Variables
Make sure to set up all required environment variables in your `.env` file. The application will not start without the required variables.

### Database Connection
The application automatically connects to MongoDB on startup. Make sure MongoDB is running and accessible.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong, unique secrets for JWT tokens
3. Configure proper CORS settings
4. Set up proper database credentials
5. Configure Cloudinary and Razorpay with production credentials

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
>>>>>>> 6a01866d7b2e1db137103f99662295d2dd4ccaf8
