# 🛋️ Hamd Sofas

**Hamd Sofas** is a modern e-commerce web application for buying and managing sofa products. Built with the MERN stack, it offers both a seamless user experience and a powerful admin panel for managing products, categories, orders, payments, and more.

---

## 🚀 Features

### 👤 User Side:
- User authentication (signup, login with OTP)
- Product listing with search, filter, sort, and pagination
- Product details with image zoom and gallery
- Cart & wishlist functionality
- Address management
- Secure checkout with Razorpay integration
- Order tracking, cancellation, and return with wallet refund
- Downloadable invoices (PDF)

### 🛠️ Admin Panel:
- Login with session-based authentication
- Product & category management (CRUD, soft delete, image crop)
- Order and inventory management
- Return handling with wallet refunds
- Dashboard stats & pagination
- User management

---

## 🧰 Tech Stack

- **Frontend:** HTML, CSS, JavaScript, EJS Templates
- **Backend:** Node.js, Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** Session, Cookies
- **Cloud:** Cloudinary (for image storage)
- **Payment Gateway:** Razorpay
- **Other Libraries:** Cropper.js, SweetAlert, PDFKit

---

## ⚙️ Getting Started

### 🔧 Prerequisites

- Node.js & npm
- MongoDB
- Git

### 🛠 Installation

```bash
# Clone the repository
git clone https://github.com/Ahras24/Hamd-Sofas.git
cd Hamd-Sofas

# Install dependencies
npm install

# Set up environment variables
touch .env
# Add necessary keys like DB_URL, SESSION_SECRET, RAZORPAY_KEY, etc.

# Start the server
npm start