
# CipherVault

A secure and modern password manager built with Next.js and Firebase.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge)](https://pass-wordmanager.netlify.app)

---

### Table of Contents
* [About The Project](#about-the-project)
* [Key Features](#key-features)
* [Tech Stack](#tech-stack)
* [Screenshots](#screenshots)
* [Local Development Setup](#local-development-setup)
* [Connect with Me](#connect-with-me)

---

## About The Project

CipherVault is a sleek, secure, and user-friendly password management application designed to help users store, organize, and access their credentials effortlessly. Built with a modern tech stack, it prioritizes both security and a clean user experience. Passwords are encrypted to ensure data privacy, and the intuitive interface makes managing hundreds of passwords simple and efficient. The application includes a security dashboard that provides at-a-glance insights into password strength and potential vulnerabilities.

![Security Dashboard](https://i.postimg.cc/bvLGLWVs/password-manager-security-dashboard.png)

---

## Key Features

- **Secure Authentication:** Master password and Google OAuth for secure vault access.
- **Encrypted Storage:** All passwords are AES-encrypted before being stored in the database.
- **Intuitive Vault Management:** Easily add, edit, view, and delete password entries.
- **Advanced Organization:** Organize credentials using both folders and tags for flexible categorization.
- **Password Strength Analysis:** An integrated dashboard visualizes password strength, highlighting weak or reused passwords.
- **Password Generator:** Create strong, complex, and unique passwords directly within the app.
- **Instant Search & Filtering:** Quickly find any credential with a powerful real-time search.
- **Favorites & Trash:** Mark important passwords as favorites and safely move unneeded ones to the trash before permanent deletion.
- **Encrypted Data Export:** Securely export your vault data to a password-protected encrypted file.
- **Responsive Design:** A clean and fully responsive UI that works seamlessly across all devices.

---

## Tech Stack

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)


- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, ShadCN UI
- **Backend:** Next.js (API Routes), Firebase
- **Database:** Firebase Firestore
- **Deployment:** Netlify

---

## Screenshots

<table>
  <tr>
    <td align="center"><strong>Authentication Page</strong></td>
    <td align="center"><strong>Security Dashboard</strong></td>
    <td align="center"><strong>Password Vault</strong></td>
  </tr>
  <tr>
    <td><img src="https://i.postimg.cc/3w9y9VfR/authentication-page.png" alt="Authentication Page" width="100%"></td>
    <td><img src="https://i.postimg.cc/bvLGLWVs/password-manager-security-dashboard.png" alt="Security Dashboard" width="100%"></td>
    <td><img src="https://i.postimg.cc/yNnJntp7/password-manger-password-dashboard.png" alt="Password Vault" width="100%"></td>
  </tr>
</table>

---

## Local Development Setup

Follow these steps to set up the project on your local machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A Firebase project. You can create one for free at the [Firebase Console](https://console.firebase.google.com/).

### Environment Variables
Create a `.env` file in the root of the project and add your Firebase project credentials. You can find these in your Firebase project settings.

```bash
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
NEXT_PUBLIC_ENCRYPTION_KEY=your-secret-encryption-key # A strong secret key for AES encryption
```

### Installation & Running the App

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/itsyasirkhandev/passwordmanager.git
    cd passwordmanager
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:9002`.

---

## Connect with Me

This project was created by Yasir Khan. Feel free to connect!

[![Portfolio](https://img.shields.io/badge/My_Portfolio-000?style=for-the-badge&logo=ko-fi&logoColor=white)](https://yasir.qzz.io/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/connectyasir/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/itsyasirkhandev)

