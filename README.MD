# 🗂️ Task Manager App - Backend

A robust backend API for managing tasks. Built with **Node.js**, **Express**, **Sequelize**, and **PostgreSQL**. It supports user authentication and full CRUD operations on tasks, along with scheduled email notifications for due tasks.

## 🚀 Features

- User Authentication (JWT-based)
- Create, Read, Update, and Delete (CRUD) tasks
- Set task priorities and due dates
- Cron jobs to send hourly email reminders for due tasks
- Automatic deletion of completed tasks
- Secure route access using middleware
- Sequelize ORM for database management
- Nodemailer for sending email notifications

---

## 🧰 Tech Stack

- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **ORM:** Sequelize
- **Auth:** JWT (JSON Web Token)
- **Email Notifications:** Nodemailer
- **Scheduler:** node-cron

---

## 📁 Project Structure

```

task-manager-backend/
│
├── config/               # Database and environment configuration
│
├── controllers/          # Route logic for tasks and users
│
├── middleware/           # Authentication middleware
│
├── models/               # Sequelize models (User, Task)
│
├── routes/               # Task and User API routes
│
├── cron/                 # Cron job for scheduled tasks
│
├── utils/                # Utility functions (e.g. emailSender)
│
├── .env                  # Environment variables
├── app.js                # Main Express app
├── server.js             # App entry point
└── package.json

````

---

## 🛠️ Installation

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL

### Setup Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/task-manager-backend.git
   cd task-manager-backend
````

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory and add the following:

   ```env
   PORT=5000
   DB_HOST=localhost
   DB_USER=your_postgres_user
   DB_PASSWORD=your_postgres_password
   DB_NAME=taskmanager
   DB_PORT=5432
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_email_password
   ```

4. **Create the PostgreSQL database**

   ```bash
   createdb taskmanager
   ```

5. **Run migrations and seed (optional)**

   ```bash
   npx sequelize-cli db:migrate
   ```

6. **Start the development server**

   ```bash
   npm run dev
   ```

   The server will be running at `http://localhost:5000`.

---

## 🧪 API Endpoints

### ✅ Authentication

* **POST** `/api/auth/signup` - Register new user
* **POST** `/api/auth/login` - User login

### 📝 Tasks (protected routes)

> Requires `Authorization: Bearer <token>`

* **POST** `/api/tasks` - Create new task
* **GET** `/api/tasks` - Get all tasks
* **GET** `/api/tasks/:id` - Get single task by ID
* **PUT** `/api/tasks/:id` - Update task
* **DELETE** `/api/tasks/:id` - Delete task

---

## ⏰ Cron Jobs

* **Hourly Job:** Checks for due tasks every hour and sends email reminders.
* **Completed Task Cleanup:** Automatically deletes tasks marked as completed after a set period (optional).

---

## 📬 Email Notifications

Uses **Nodemailer** to send reminders to users when tasks are due.

Make sure your email provider allows less secure app access or generate an app-specific password if using Gmail.

---

## 🔐 Authentication

JWT-based authentication with middleware to protect routes:

```js
Authorization: Bearer <your_token>
```

---

## 🧪 Running Tests

1. ✅ How to test your backend using **Jest**
2. ✅ How to test your API using **Swagger UI**

---

### 🧪 Updated README Section: Testing

````markdown
## 🧪 Running Tests

### ✅ 1. Testing with Jest

We use **Jest** along with **Supertest** for unit and integration testing of API endpoints.

#### 📦 Install Jest and Supertest

```bash
npm install --save-dev jest supertest
````

#### ⚙️ Setup Jest Configuration

Create a file named `jest.config.js` in your project root:

```js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
};
```

#### 🧪 Example Test

Create a `tests/` folder and add a test file like `auth.test.js`:

```js
// tests/auth.test.js
const request = require('supertest');
const app = require('../app'); // your Express app

describe('User Auth Routes', () => {
  it('should sign up a user', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      email: 'jestuser@example.com',
      password: 'test123',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });
});
```

#### ✅ Run Tests

```bash
npm test
```

This command runs all test files that match `*.test.js` under the `tests/` directory.

---

### 🧪 2. Testing with Swagger UI

Your API comes with a Swagger UI for interactive documentation and manual testing of endpoints.

#### 🔌 Setup Swagger (if not already configured)

Install Swagger UI dependencies:

```bash
npm install swagger-ui-express yamljs
```

Create a `swagger.yaml` file or use `swagger.json` and add:

```js
// In app.js
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
```

#### 📘 Access Swagger UI

After starting your server:

```
http://localhost:5000/api-docs
```

Use Swagger UI to:

* Authenticate with your JWT token
* Send requests to all endpoints (signup, login, create task, update task, etc.)
* View responses directly in the browser
* Debug and test inputs easily

#### ✅ Add Auth to Swagger (Optional)

Include this in your `swagger.yaml` to enable Bearer token support:

```yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
security:
  - bearerAuth: []
```

Then, secure any route using:

```yaml
paths:
  /api/tasks:
    get:
      security:
        - bearerAuth: []
```



---

## 📦 Deployment

To deploy on platforms like **Render**, **Railway**, or **Heroku**:

1. Add your environment variables to their dashboard.
2. Use the `npm start` command for production.
3. Ensure your database is properly set up on the cloud platform.
4. Schedule the cron jobs using a background worker or an external scheduler if the host does not support persistent background jobs.

---

## 🤝 Contributing

Contributions are welcome! Please open issues or submit PRs for improvements or bug fixes.

---

## 📄 License

MIT License

---

## 👤 Author

**Lawal Damilare Samuel**
Backend Developer
📧 [Damilaresam96@gmail.com](mailto:Damilaresam96@gmail.com)
🌐 [GitHub](https://github.com/Andred17) | [LinkedIn](https://linkedin.com/in/Damilaresam)

```

---

