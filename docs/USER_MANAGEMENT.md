# User Management System

## Overview

The user management system allows administrators to manage all users across different schools in the kama platform. Admins can view, create, edit, and delete users, as well as reset passwords.

## Features

### 1. School-Based User Organization

- View all schools in a separate list
- Enter each school to see all students, parents, and admins within that school
- Filter users by role (student, teacher, parent, principal, school_admin)

### 2. User Management

- **View Users**: See all users with their details (name, contact info, role, status)
- **Add Users**: Create new users with all necessary information
- **Edit Users**: Modify existing user information
- **Delete Users**: Remove users from the system
- **Search**: Search users by name, email, phone, or national ID
- **Filter**: Filter users by role or school

### 3. Password Management

- Reset user passwords with the password reset modal
- Passwords are securely hashed using bcrypt

### 4. User Information Visibility

- View login information (password, email, national ID) with eye icon toggle for visibility
- All sensitive information is protected and only visible when explicitly requested

## Technical Implementation

### Frontend Components

1. **Main Users Page** (`/admin/users/page.tsx`)

   - Displays all users across all schools
   - Filtering by school and role
   - Search functionality
   - Pagination support

2. **School-Specific Users Page** (`/admin/users/[schoolId]/page.tsx`)

   - Displays users for a specific school
   - Filtering by role only
   - Direct access from the schools management page

3. **User Edit Modal** (`/admin/users/components/UserEditModal.tsx`)

   - Form for creating/editing users
   - Validation for required fields
   - Password visibility toggle

4. **Password Reset Modal** (`/admin/users/components/PasswordResetModal.tsx`)
   - Form for resetting user passwords
   - Password confirmation and validation

### Backend API Routes

1. **Users API** (`/api/admin/users/route.ts`)

   - GET: Fetch all users with filtering and pagination
   - POST: Create new users

2. **Individual User API** (`/api/admin/users/[id]/route.ts`)

   - GET: Retrieve specific user details
   - PUT: Update user information
   - DELETE: Remove user from system

3. **Password Reset API** (`/api/admin/users/[id]/reset-password/route.ts`)

   - POST: Reset user password with bcrypt hashing

4. **Schools API** (`/api/admin/schools/route.ts`)

   - GET: Fetch all schools with user counts
   - POST: Create new schools

5. **Individual School API** (`/api/admin/schools/[id]/route.ts`)
   - GET: Retrieve specific school details

## Usage Instructions

### Accessing User Management

1. Navigate to the Admin Panel
2. Click on "مدیریت کاربران" in the sidebar
3. You'll see a list of all users across all schools

### Filtering and Searching

- Use the filter dropdowns to filter by role or school
- Use the search box to search by name, email, phone, or national ID
- Click "اعمال فیلترها" to apply filters
- Click "پاک کردن فیلترها" to clear all filters

### Adding a New User

1. Click the "کاربر جدید" button
2. Fill in the user details in the modal
3. Select the appropriate school and role
4. Set a password (optional for editing existing users)
5. Click "افزودن کاربر" to save

### Editing a User

1. Click the edit icon (✏️) next to any user
2. Modify the user details in the modal
3. Click "ذخیره تغییرات" to save

### Resetting a User's Password

1. Click the key icon (🔑) next to any user
2. Enter a new password in the modal
3. Confirm the new password
4. Click "تغییر رمز عبور" to save

### Viewing Sensitive Information

- Click the eye icon (👁️) next to the password field to toggle password visibility
- Other sensitive information (email, national ID) is always visible

### School-Specific User Management

1. Navigate to "مدیریت مدارس"
2. Click on any school to view its users
3. All user management features are available in this context

## Security Considerations

- All API routes are protected and require admin authentication
- Passwords are securely hashed using bcrypt with 12 salt rounds
- Session management is handled through secure cookies
- Input validation is performed on both frontend and backend
- Role-based access control ensures only admins can access these features

## Error Handling

- Proper error messages are displayed for all operations
- Failed API requests show meaningful error messages
- Form validation prevents invalid data from being submitted
- Loading states provide feedback during API operations
