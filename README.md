# CS Messaging App
## Project Overview
The CS Messaging App is a real-time customer support system where users (customers) can send messages and agents can respond to them. The system allows for easy message assignment, tracking, and interaction between customers and agents. The project uses a PostgreSQL database for data persistence, and the backend is built using Node.js with Express for handling API requests and user authentication via JWT tokens. The frontend allows customers to view their chat history and agents to manage unassigned and assigned chats. The database is pre-populated with sample users and messages from the CSV file provided for this assessment.

## Setup Instructions
### Prerequisites
- [ ] Node.js and npm installed
- [ ] PostgreSQL or Supabase account (optional for hosting your own database)

## 1. Clone the repository
```
git clone https://github.com/missusk/message-app-branch-int
cd message-app-branch-int

```
## 2. Install dependencies
Install both frontend and backend dependencies using the following command:

```
npm run install:all
```

This will install dependencies for both the frontend and backend projects.

### 3. Database Setup(optional)
The project uses Supabase to host the database with a pre-loaded dataset from the CSV file. However, you can create your own PostgreSQL database if you'd like to host the data locally or on another server.

##### Method 1: Using the Supabase Hosted Database (Already Configured)
By default, the app is set to use the Supabase database that I have already created. This means you don't need to configure the database.
The .env file already contains the necessary DATABASE_URL for connecting to the Supabase-hosted database. The project will automatically use it.

##### Method 2: Creating Your Own Database (Optional)
If, instead of Method 1, you want to create your own PostgreSQL database, follow these steps:

- [ ] Create the Database Schema
      
You can create your own database and then set up the necessary tables using the SQL file located in /backend/create_schema.sql. Run the following command in your PostgreSQL shell to execute the script:

```
psql -U <your-username> -d <your-database-name> -f backend/create_schema.sql
```

- [ ] Populate the Database
      
Once the schema is created, you can populate the database with sample data using the CSV file. Run the script located in /backend/load_csv.js to load the data into your database:
```
node backend/load_csv.js
```
This script reads the CSV data and populates the relevant tables in your database.

- [ ] Update the Connection String
      
After setting up your own database, replace the DATABASE_URL in your .env file(in backend folder) with your own PostgreSQL connection string.
```
DATABASE_URL=your_own_database_url
```
This will allow your app to connect to your own custom database instead of the pre-existing Supabase one.

### 4. Running the Application
To run both the frontend and backend servers simultaneously, use:

```
npm install concurrently --save
npm run start:all
```

The backend will run on http://localhost:5000.
The frontend will run on http://localhost:3000.

If you want to run them individually, you can navigate to each folder and run npm start:

To run only the backend:
```
cd backend
npm start
```
To run only the frontend:
```
cd frontend
npm start
```

## User Interface Overview
### Login & Signup
The app has default users already created from the CSV data, and they can log in using their user_id(from the CSV file) as both the username and password. The user_id is extracted from the CSV file attached in the backend folder. New users can also be signed up using the signup page for customers. These users can log in through the UI on the auth page and view their previous chat history. Agents need to sign up separately and log in to the agent side of the application. For testing without having to create an agent, one can use a default agent - username:test_agent_3 with password: 3.

## User (Customer) Side
#### Login: 
Customers can log in using their user_id as both the username and password from the CSV data. Once logged in, they can view their past messages in chronological order.

#### Chat History: 
Users can see their chat history with agents and continue the conversation if they have ongoing support queries.

#### Send Messages: 
Users can send new messages, and they will be visible to agents.

## Agent Side
#### Signup & Login: 
Agents can sign up via the agent signup page with a custom username and password. After logging in, agents can see both unassigned and assigned sections.

#### Unassigned Chats: 
The Unassigned Chats section shows messages from users that have not been assigned to any agent yet. Agents can assign a user to themselves by responding to an unassigned message.

#### Assigned Chats: 
Once a user is assigned to an agent, their chat will appear in the Assigned Chats section, and the agent can continue to respond to them.

#### Assigning and Responding to Users
1. Agents can assign users by selecting an unassigned message and responding to it. This action will automatically assign the user to the agent, and the user will move from the Unassigned Chats section to the Assigned Chats section.
2. The user can then continue the conversation, and all message history will be preserved.
   
#### Signup & Login: 
Agents can sign up via the agent signup page with a custom username and password. After logging in, agents can see both unassigned and assigned sections.

### Sections:
1. Unassigned Chats: The Unassigned Chats section shows messages from users that have not been assigned to any agent yet. Agents can assign a user to themselves by responding to an unassigned message.
2. Assigned Chats: Once a user is assigned to an agent, their chat will appear in the Assigned Chats section, and the agent can continue to respond to them.
3. Agents can assign users among themselves by selecting an unassigned message and responding to it. This action will automati#cally assign the user to the agent, and the user will move from the Unassigned Chats section to the Assigned Chats section.
The user can then continue the conversation, and all message history will be preserved.


## Additional Functionalities Implemented
In addition to the core requirements specified for this assignment, I have implemented the following features to enhance the functionality of the messaging application:

### Real-Time Communication:
* Users and Agents can send and receive messages in real-time. When a user sends a message, it is immediately visible to the agent and when the agent responds, it is immediately visible to the user, without refreshing the page.
* This is achieved using Socket.IO, which establishes a WebSocket connection between the client and the server to provide real time updates.

### Authentication for Both Agents and Customers:

* Implemented user authentication for both agents and customers using JWT (JSON Web Tokens).
* Customers can sign up and log in to see their previous message history.
* Agents can sign up and log in to access the portal where they can view assigned and unassigned messages.

### Messaging Interface for Customers:

Instead of using simple web forms, a more interactive and user-friendly chat interface was created for customers to send and receive messages. This provides a seamless and engaging experience for the customer to communicate with agents.

### Agent Message Assignment System:

Agents can view both assigned and unassigned customer messages.
Unassigned messages are displayed in a separate section, and agents can self-assign messages to start handling them. Once a message is assigned, it moves to the assigned messages section automatically.

### Search Functionality:

Added search functionality for agents, allowing them to search across customers and messages. This makes it easier for agents to find specific conversations and respond more effectively.

### Real-time UI Elements:

Implemented UI interactions that provide real-time feedback, such as automatic updates to assigned and unassigned messages as agents pick up tasks.

### Secure Hashing for Passwords:

* Integrated secure password storage using bcrypt for both agents and customers to ensure security for user credentials.
* These functionalities go beyond the basic requirements, offering a more robust and user-friendly experience for both agents and customers while ensuring security and ease of communication within the system.
