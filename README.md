# Civix - Service Management Platform

A complete service management solution built with Next.js 14, TypeScript, and MongoDB.

## Features

- Role-based access control (USER, AGENT, ADMIN, SUPER_ADMIN)
- Service booking system
- User management
- Agent management
- Admin dashboard
- Email notifications
- Responsive design with Tailwind CSS

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment variables in `.env.local`

3. Start MongoDB locally or use MongoDB Atlas

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Copy `.env.local` and update the following:

- `MONGODB_URI` - Your MongoDB connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `JWT_SECRET` - Secret for JWT tokens
- `SMTP_*` - Email configuration for notifications

## Project Structure

- `/app` - Next.js App Router pages and API routes
- `/components` - Reusable React components
- `/lib` - Utility functions and configurations
- `/types` - TypeScript type definitions
- `/hooks` - Custom React hooks
- `/context` - React context providers
- `/models` - Database models and schemas

## Roles and Permissions

- **USER**: Can browse services and make bookings
- **AGENT**: Can manage services and handle bookings
- **ADMIN**: Can manage users, agents, and services
- **SUPER_ADMIN**: Full system access and management

## API Routes

  
  
🔵 Public / Common Pages (Accessible Without Login)  
  
These should use the default layout (main layout):  
  
1. / → Home Page  
  
  
2. /services → All Services Listing  
  
  
3. /services/:id → Single Service View / Description  
  
  
4. /about → About Us  
  
  
5. /contact → Contact Us  
  
  
6. /login → Login Page  
  
  
7. /register → Register Page  
  
  
8. /forgot-password → Forgot Password  
  
  
9. /reset-password/:token → Reset Password  
  
  
  
  
---  
  
🔐 User Pages (Role: USER)  
  
Use User Layout (extends base layout with sidebar/navbar):  
  
1. /user/dashboard → User Dashboard  
  
  
2. /user/profile → User Profile  
  
  
3. /user/bookings → My Bookings  
  
  
4. /user/bookings/new/:serviceId → New Booking Form  
  
  
5. /user/agents → Assigned Agent Details  
  
  
6. /user/services → My Requested Services  
  
  
7. /user/support → Support / Raise Issue  
  
  
8. /user/settings → Account Settings  
  
  
  
  
---  
  
🟠 Agent Pages (Role: AGENT)  
  
Use Agent Layout (dashboard + controls):  
  
1. /agent/dashboard → Agent Dashboard  
  
  
2. /agent/profile → Agent Profile  
  
  
3. /agent/services → My Services  
  
  
4. /agent/services/create → Create New Service  
  
  
5. /agent/bookings → Assigned Jobs / My Bookings  
  
  
6. /agent/users → Assigned Users  
  
  
7. /agent/settings → Account Settings  
  
  
8. /agent/support → Support Panel / Raise Ticket  
  
  
  
  
---  
  
🔴 Admin Pages (Role: ADMIN)  
  
Use Admin Layout (admin sidebar/header):  
  
1. /admin/dashboard → Admin Dashboard  
  
  
2. /admin/bookings → All Bookings Management  
  
  
3. /admin/services → All Services Management  
  
  
4. /admin/agents → Agent Management  
  
  
5. /admin/users → User Management  
  
  
6. /admin/reports → Reports & Logs  
  
  
7. /admin/profile → Admin Profile  
  
  
8. /admin/settings → System Settings  
  
  
  
  
---  
  
⚫ Super Admin Pages (Role: SUPER_ADMIN)  
  
Use SuperAdmin Layout (super controls, global tools):  
  
1. /super-admin/dashboard → Super Admin Dashboard  
  
  
2. /super-admin/users → User Management (CRUD)  
  
  
3. /super-admin/agents → Agent Management (CRUD)  
  
  
4. /super-admin/admins → Admin Management (CRUD)  
  
  
5. /super-admin/bookings → Full Booking Records  
  
  
6. /super-admin/services → Service Listing + Controls  
  
  
7. /super-admin/email-logs → Email Logs & Triggers  
  
  
8. /super-admin/reports → Business / Usage Reports  
  
  
9. /super-admin/add-user → Manual Add User / Roles  
  
  
10. /super-admin/settings → Full System Settings  
  
  
11. /super-admin/profile → Super Admin Profile  
  
  
  
  
---  
  
🔁 Error & Status Pages  
  
1. /404 → Page Not Found  
  
  
2. /403 → Access Denied  
  
  
3. /500 → Server Error  
  
  
  
  
---  
  
⚙️ Other Pages (Optional)  
  
1. /maintenance → Maintenance Mode Page  
  
  
2. /privacy-policy → Privacy Policy  
  
  
3. /terms-and-conditions → Terms & Conditions  
  
  
  
  
---  

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request


## Folder Structure 

# Civix Project Folder Structure

```
civix/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   │
│   ├── api/
│   │   ├── users/
│   │   │   └── route.ts
│   │   ├── agents/
│   │   ├── services/
│   │   ├── bookings/
│   │   └── auth/
│   │
│   ├── about/
│   │   └── page.tsx
│   ├── contact/
│   │   └── page.tsx
│   ├── services/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── forgot-password/
│   │   └── page.tsx
│   ├── reset-password/
│   │   └── [token]/
│   │       └── page.tsx
│   │
│   ├── user/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── bookings/
│   │   │   ├── page.tsx
│   │   │   └── new/
│   │   │       └── [serviceId]/
│   │   │           └── page.tsx
│   │   ├── agents/
│   │   │   └── page.tsx
│   │   ├── services/
│   │   │   └── page.tsx
│   │   ├── support/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── agent/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── services/
│   │   │   ├── page.tsx
│   │   │   └── create/
│   │   │       └── page.tsx
│   │   ├── bookings/
│   │   │   └── page.tsx
│   │   ├── users/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── support/
│   │       └── page.tsx
│   │
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── bookings/
│   │   │   └── page.tsx
│   │   ├── services/
│   │   │   └── page.tsx
│   │   ├── agents/
│   │   │   └── page.tsx
│   │   ├── users/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   │
│   ├── super-admin/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── users/
│   │   │   └── page.tsx
│   │   ├── agents/
│   │   │   └── page.tsx
│   │   ├── admins/
│   │   │   └── page.tsx
│   │   ├── bookings/
│   │   │   └── page.tsx
│   │   ├── services/
│   │   │   └── page.tsx
│   │   ├── email-logs/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   ├── add-user/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── profile/
│   │       └── page.tsx
│   │
│   ├── 404/
│   │   └── page.tsx
│   ├── 403/
│   │   └── page.tsx
│   ├── 500/
│   │   └── page.tsx
│   ├── maintenance/
│   │   └── page.tsx
│   ├── privacy-policy/
│   │   └── page.tsx
│   └── terms-and-conditions/
│       └── page.tsx
│
├── lib/
│   └── db.ts
│
├── types/
│   └── index.ts
│
├── components/
├── hooks/
├── context/
├── models/
├── utils/
│
├── middleware.ts
├── .env.local
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Key Features of This Structure:

### 🔐 **Role-Based Access Control**
- **User Panel**: `/user/*` - Service browsing and booking management
- **Agent Panel**: `/agent/*` - Service provider dashboard
- **Admin Panel**: `/admin/*` - System administration
- **Super Admin Panel**: `/super-admin/*` - Full system control

### 📱 **Next.js App Router Structure**
- Uses the new App Router with `layout.tsx` and `page.tsx` files
- Nested layouts for different user roles
- Dynamic routes with `[id]` and `[token]` parameters

### 🛡️ **Security & Authentication**
- Middleware for route protection
- JWT-based authentication
- Role-based page access control

### 🎨 **UI/UX Features**
- Tailwind CSS for styling
- Responsive design
- Color-coded navigation for different roles:
  - User: Blue theme
  - Agent: Green theme
  - Admin: Purple theme
  - Super Admin: Red theme

### 📊 **Core Functionality**
- Service management and booking system
- User management across all roles
- Email notification system
- Error handling pages (404, 403, 500)
- Maintenance mode support

### 🔧 **Technical Stack**
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcrypt
- **Email**: Nodemailer integration


## 🎨 PHASE 3: Design + Components

### 🔹 Step 3: Create Reusable UI

Start building reusable atomic components:

* `Navbar`, `Footer`, `Button`, `Input`, `Card`, `PageHeader`, `FormGroup`, etc.
* Use libraries like:

  * `lucide-react` or `react-icons`
  * `@headlessui/react` or `radix-ui`
  * `framer-motion` for animations
  * `clsx` or `tailwind-variants` for conditional styles

Example:

```jsx
<Button variant="primary" size="lg" onClick={handleSubmit}>
  Book Now
</Button>
```

---

## 🔁 PHASE 4: Pages Development Plan

> 🔵 Start from **Public/Common Pages** first
> 🔐 Then build **Role-Based Pages**

---

### ✅ PUBLIC / COMMON PAGES (Layout: `MainLayout`)

| Order | Route                    | Component File                  |
| ----- | ------------------------ | ------------------------------- |
| 1     | `/`                      | `pages/Home.jsx`                |
| 2     | `/about`                 | `pages/About.jsx`               |
| 3     | `/contact`               | `pages/Contact.jsx`             |
| 4     | `/services`              | `pages/Services/List.jsx`       |
| 5     | `/services/:id`          | `pages/Services/Single.jsx`     |
| 6     | `/login`                 | `pages/Auth/Login.jsx`          |
| 7     | `/register`              | `pages/Auth/Register.jsx`       |
| 8     | `/forgot-password`       | `pages/Auth/ForgotPassword.jsx` |
| 9     | `/reset-password/:token` | `pages/Auth/ResetPassword.jsx`  |

---

### 🔐 USER PAGES (Layout: MainLayout with User Sidebar if needed)

| Route                    | Component File                 |
| ------------------------ | ------------------------------ |
| `/user/dashboard`        | `pages/User/Dashboard.jsx`     |
| `/user/profile`          | `pages/User/Profile.jsx`       |
| `/user/bookings`         | `pages/User/Bookings/List.jsx` |
| `/user/bookings/new/:id` | `pages/User/Bookings/New.jsx`  |
| `/user/agents`           | `pages/User/Agents.jsx`        |
| `/user/services`         | `pages/User/Services.jsx`      |
| `/user/support`          | `pages/User/Support.jsx`       |
| `/user/settings`         | `pages/User/Settings.jsx`      |

---

### 🟠 AGENT PAGES

| Route                    | Component File                    |
| ------------------------ | --------------------------------- |
| `/agent/dashboard`       | `pages/Agent/Dashboard.jsx`       |
| `/agent/profile`         | `pages/Agent/Profile.jsx`         |
| `/agent/services`        | `pages/Agent/Services/List.jsx`   |
| `/agent/services/create` | `pages/Agent/Services/Create.jsx` |
| `/agent/bookings`        | `pages/Agent/Bookings.jsx`        |
| `/agent/users`           | `pages/Agent/Users.jsx`           |
| `/agent/support`         | `pages/Agent/Support.jsx`         |
| `/agent/settings`        | `pages/Agent/Settings.jsx`        |

---

### 🔴 ADMIN PAGES

| Route              | Component File              |
| ------------------ | --------------------------- |
| `/admin/dashboard` | `pages/Admin/Dashboard.jsx` |
| `/admin/bookings`  | `pages/Admin/Bookings.jsx`  |
| `/admin/services`  | `pages/Admin/Services.jsx`  |
| `/admin/agents`    | `pages/Admin/Agents.jsx`    |
| `/admin/users`     | `pages/Admin/Users.jsx`     |
| `/admin/reports`   | `pages/Admin/Reports.jsx`   |
| `/admin/profile`   | `pages/Admin/Profile.jsx`   |
| `/admin/settings`  | `pages/Admin/Settings.jsx`  |

---

### ⚫ SUPER ADMIN PAGES

| Route                     | Component File                   |
| ------------------------- | -------------------------------- |
| `/super-admin/dashboard`  | `pages/SuperAdmin/Dashboard.jsx` |
| `/super-admin/users`      | `pages/SuperAdmin/Users.jsx`     |
| `/super-admin/agents`     | `pages/SuperAdmin/Agents.jsx`    |
| `/super-admin/admins`     | `pages/SuperAdmin/Admins.jsx`    |
| `/super-admin/bookings`   | `pages/SuperAdmin/Bookings.jsx`  |
| `/super-admin/services`   | `pages/SuperAdmin/Services.jsx`  |
| `/super-admin/email-logs` | `pages/SuperAdmin/EmailLogs.jsx` |
| `/super-admin/reports`    | `pages/SuperAdmin/Reports.jsx`   |
| `/super-admin/add-user`   | `pages/SuperAdmin/AddUser.jsx`   |
| `/super-admin/settings`   | `pages/SuperAdmin/Settings.jsx`  |
| `/super-admin/profile`    | `pages/SuperAdmin/Profile.jsx`   |

---

### ❗ERROR / STATUS PAGES

| Route  | Component File       |
| ------ | -------------------- |
| `/404` | `pages/Error404.jsx` |
| `/403` | `pages/Error403.jsx` |
| `/500` | `pages/Error500.jsx` |

---

### ⚙️ OPTIONAL STATIC PAGES

| Route                   | Component File                 |
| ----------------------- | ------------------------------ |
| `/maintenance`          | `pages/Maintenance.jsx`        |
| `/privacy-policy`       | `pages/PrivacyPolicy.jsx`      |
| `/terms-and-conditions` | `pages/TermsAndConditions.jsx` |

---

## 🔚 Final Phase Plan

After page-level setup:

### 🔸 Phase 5: Add Logic & API Bindings

* Axios API integration
* Token auth (JWT/localStorage)
* Role-based redirection (via middleware-like hooks)
* Form validation (Zod, React Hook Form)
* Error boundaries, loaders, spinners

### 🔸 Phase 6: Final Polish

* Add SEO meta tags
* Add animations
* Responsive breakpoints
* Progressive enhancement

