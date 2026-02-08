# MongoDB Atlas Setup Guide

1.  **Create Account/Login**: Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2.  **Create a Cluster**: Select the **Shared (Free)** tier. Choose a region close to you (e.g., Singapore/Jakarta if available, or US).
3.  **Create Database User**:
    *   Go to **Database Access**.
    *   Add New Database User.
    *   Authentication Method: Password.
    *   Username: `admin` (or your choice).
    *   Password: `yourpassword` (Remember this!).
4.  **Network Access (Whitelist IP)**:
    *   Go to **Network Access**.
    *   Add IP Address.
    *   Select **Allow Access from Anywhere** (0.0.0.0/0) for easiest setup during development.
5.  **Get Connection String**:
    *   Go back to **Database** (Cluster view).
    *   Click **Connect**.
    *   Select **Drivers** (Node.js).
    *   Copy the string. It looks like:
        `mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
6.  **Update App**:
    *   Paste this into your `.env.local` file as `MONGODB_URI`.
    *   **IMPORTANT**: Replace `<password>` with your actual password.
