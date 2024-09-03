# BlockchainUNN Backend

This repository contains the backend code for the BlockchainUNN website, which is being updated for the upcoming Blogathon - BlockchainUNN's Hackathon and Conference 3.0. The backend is built using Node.js with Express and Prisma as the ORM for database management. It includes features like user authentication, admin controls, API documentation with Swagger, and more.

## Getting Started

To run this project locally, follow these steps:

### Prerequisites

- **Node.js**: Ensure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org/).
- **npm**: Package manager to install dependencies (npm comes with Node.js).

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/website-v3-backend.git
   cd website-v3-backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up the environment variables:**

   Create a `.env` file in the root directory and add your environment-specific variables (refer to `.env.example` for the variables you need to set).

4. **Run the Prisma migrations to set up your database:**

   ```bash
   npx prisma migrate dev
   ```

   This will apply any pending migrations to your database.

5. **Start the development server:**

   ```bash
   npm run dev
   ```

## File Structure

    website-v3-backend/
    ├── prisma/
    │   ├── client.ts
    │   └── schema.prisma
    ├── src/
    │   ├── controllers/
    │   │   ├── admin/ - [Folder specifically for admin related controllers.]
    │   │   └── auth.controllers.ts
    │   ├── middlewares/
    │   │   └── auth.middleware.ts
    │   ├── routes/
    │   │   ├── admin/ - [Folder specifically for admin related controllers.]
    │   │   └── auth.routes.ts
    │   ├── swagger/
    │   │   └── swagger.ts
    │   ├── types/
    │   │   └── auth.types.ts
    │   ├── utils/
    │   │   └── responseHandlers.ts
    │   └── server.ts
    ├── .env.example
    ├── .gitignore
    ├── package-lock.json
    ├── package.json
    ├── README.md
    └── tsconfig.json

### Folder Descriptions:

- **prisma/**: Contains Prisma ORM configuration files and database management files.

  - **client.ts**: Contains a global instance of PrismaClient (always import prisma from here).
  - **schema.prisma**: Defines the Prisma schema, including the data model and database configuration.

- **src/**: Main source directory for the backend application.

  - **controllers/**: Houses the logic for handling incoming requests and interacting with the service layer or directly with models.
    - **admin/**: Contains controllers related to admin functionalities.
    - **auth.controllers.ts**: Implements controller functions for authentication operations.
  - **middlewares/**: Contains middleware functions that process requests before reaching the controllers.
    - **auth.middleware.ts**: Middleware for handling authentication and authorization.
  - **routes/**: Defines all the API routes/endpoints for the application.
    - **admin/**: Contains routes related to admin operations.
    - **auth.routes.ts**: Defines the API routes for authentication endpoints.
  - **swagger/**: Contains configuration and setup files for Swagger API documentation.
    - **swagger.ts**: Configuration file for Swagger to generate API documentation.
  - **types/**: Contains TypeScript type definitions used throughout the application.
    - **auth.types.ts**: Type definitions related to authentication, such as request and response types.
  - **utils/**: Utility functions and helpers used across the application.
    - **responseHandlers.ts**: Contains helper functions for formatting and sending API responses.
  - **server.ts**: The main entry point of the backend application. This file initializes and configures the Express app, sets up middleware, routes, and starts the server. It listens for incoming HTTP requests and serves the application based on defined routes and logic.

- **.env.example**: Environment variables configuration file for the project. To be updated so everyone knows the required .env configurations
- **.gitignore**: Specifies which files and directories should be ignored by Git.
- **package.json**: Lists project dependencies and scripts for building and running the application.
- **README.md**: Documentation file providing an overview and instructions for the project.
- **tsconfig.json**: TypeScript configuration file that defines compiler options for the project.

## Helpful Links/Documentations

- [Prisma Documentation](https://www.prisma.io/docs/orm/overview/prisma-in-your-stack/rest): Comprehensive guide and documentation for Prisma, including setup, usage, and advanced features.
- [Swagger Autogen Documentation](https://swagger-autogen.github.io/docs/endpoints/): Guide for how to add extra context to the auto generated Swagger documentation we will be using.
