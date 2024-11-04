# iaTichet.com 🎫

**iaTichet.com** is an advanced event management and ticketing platform, designed to explore backend optimization, data caching, and high-performance handling. It’s a fully functional tool for managing events and reservations, crafted with a focus on security, scalability, and user experience.

---

## Project Overview 📌

The core purpose of *iaTichet.com* is to provide users with a seamless reservation system and administrators with robust management tools. It was built from the ground up to study backend processes, implement efficient caching strategies, and integrate advanced security measures.

### Features & Functionalities 🚀

The application offers tailored features for **Normal Users** and **Admin Users**, optimized for smooth interaction and efficient management.

#### For Normal Users 👤

- **Event Filtering & Search 🔍**: Users can easily browse events with filters for date, availability, and pricing, and a keyword search for targeted results.
- **Reservation System with Fallbacks 🎟️**: Users can reserve tickets with an option to complete payment within 30 minutes if there’s a payment issue.
- **Reservation Management ✅**: Users have full control over reservations, with options to view, cancel, and download PDF tickets embedded with QR codes for easy event entry.
- **PDF with QR Codes 📄**: Each reservation provides a downloadable QR-coded PDF for fast and contactless event check-in.

#### For Admin Users 👑

- **Advanced Reservation & User Management 🛠️**: Admins can view, modify, or cancel reservations, manage user data, and assist with payments.
- **Event Creation & Management 🎉**: Only admins can create and manage events, maintaining consistency in event listings.
- **Permission Control 🔐**: Admins can grant or revoke admin rights, manage accounts, and oversee user permissions.
- **Data Export Options**: Admins can download reservation data with QR codes for streamlined check-ins at events.

> **Target Audience**: This platform is intended for event attendees and administrators managing local event operations, ticketing, and reservations.

---

## Technology Stack & Security 🔧

### Frontend Technologies 📦

The frontend is built with React and various libraries to ensure a responsive, interactive, and consistent UI:

- **@emotion/react & @emotion/styled**: Component-based styling for a polished, cohesive UI.
- **@mui/material & @mui/icons-material**: Provides a consistent design with pre-styled components and icons.
- **@reduxjs/toolkit & react-redux**: Manages global state for seamless data handling, especially for user sessions and reservations.
- **React Router DOM**: Enables smooth, multi-page navigation.
- **Axios**: Facilitates efficient data exchange with the backend.
- **React Query**: Manages data caching and synchronization, reducing load times.
- **Socket.io Client**: Provides real-time updates for a dynamic, interactive user experience.
- **Testing Libraries (Jest, React Testing Library)**: Ensures components function correctly, enhancing reliability.

### Backend Security Measures 🛡️

*iaTichet.com* integrates multiple security layers to protect user data and application integrity:

- **Helmet**: Protects against **XSS (Cross-Site Scripting)**, **clickjacking**, and **MIME sniffing** by securing HTTP headers.
- **Express Rate Limit**: Defends against **DDoS** and **brute-force attacks** by limiting request rates.
- **CSRF Protection (CSURF)**: Prevents **Cross-Site Request Forgery** by requiring a unique token for sensitive requests.
- **CORS Policy**: Blocks unauthorized cross-origin requests, enhancing protection against **XSS**.
- **Session Management with Secure Cookies**: Defends against **session hijacking** with HTTP-only, secure cookies.
- **Sentry Error Monitoring**: Real-time monitoring of errors and security incidents for fast response.

Together, these measures protect against **XSS, CSRF, DDoS, brute-force attacks, session hijacking,** and **clickjacking**, providing a secure and reliable experience for all users.

---

## Caching Strategy 🚀

To improve response times and reduce server load, **Redis** is used for efficient caching:

1. **Redis Client Setup with Error Handling**: Ensures reliable caching operations with error detection.
2. **Custom Caching Functions**:
   - `getAsync`: Retrieves cached data in binary format, optimized for fast access.
   - `setAsync`: Stores data with a 1-hour TTL, balancing data freshness and efficiency.
3. **User Activity Tracking**:
   - The `timeoutStorage` and `usersViewingEvent` maps track user sessions, optimizing caching based on active users.

This caching strategy enhances application performance by delivering quick response times and reducing repeated data queries, resulting in a smooth, high-performance experience.

---

## Configuration & Deployment Setup ⚙️

The application is containerized with **Docker Compose**, enabling consistent deployment across environments. Key services include:

- **Frontend Service**: Runs on port 3000, configured to interface with the backend.
- **Backend Service**: Hosted on port 5000, with health checks for uptime and readiness.
- **Ngrok Service**: Provides a secure, temporary public URL, facilitating webhook testing and external integrations.
- **MongoDB & Redis**: MongoDB serves as the main data storage, while Redis handles caching. Both have persistent volumes for data retention.

### GitHub Actions CI/CD Pipeline

A GitHub Actions pipeline automates deployment and updates for *iaTichet.com*:

1. **Docker Compose Setup**: Installs and initializes services with Docker Compose.
2. **Ngrok Tunnel Setup**: Establishes a public URL for backend testing.
3. **Dynamic Environment Updates**: Syncs the latest Ngrok URL in `.env`, allowing frontend-backend alignment.
4. **Render.com Deployment Trigger**: Deploys the application with the latest environment settings for seamless live updates.

This pipeline streamlines deployment, ensuring that *iaTichet.com* remains accessible and up-to-date.

---

## Screenshots 📸

Below are some recommended screenshots to highlight the application’s features:

1. **Homepage with Event Filtering & Search** - Showcases the user-friendly search and filtering interface.
   <img width="1495" alt="Screenshot 2024-11-04 at 22 34 07" src="https://github.com/user-attachments/assets/bd8f196b-05bc-43ce-bcba-fcd2bcdae8aa">

2. **Reservation Process** - A demonstration of the reservation workflow, including the fallback payment option. 
   <img width="528" alt="Screenshot 2024-11-04 at 22 35 06" src="https://github.com/user-attachments/assets/99826a43-4d80-4f5a-9c80-e1e17fb4057f">
<img width="1012" alt="Screenshot 2024-11-04 at 22 35 40" src="https://github.com/user-attachments/assets/d3b6025b-740e-41b5-affa-f5fccd0fa08e">

3. **Reservation Management** - The page where users can view, manage, and download their reservations. 
   <img width="1118" alt="Screenshot 2024-11-04 at 22 36 32" src="https://github.com/user-attachments/assets/d43b0190-ec47-4e8d-a237-f13dc63e8744">
   <img width="1014" alt="Screenshot 2024-11-04 at 22 36 47" src="https://github.com/user-attachments/assets/69ccda93-7e7e-4a43-9536-f501318a970c">

4. **Event Creation & User Management** - Displays the powerful admin interface for managing events and users. 
  <img width="920" alt="Screenshot 2024-11-04 at 22 37 34" src="https://github.com/user-attachments/assets/ae2f9962-01ac-4f84-bf1c-2d55b051e1ad">
  <img width="718" alt="Screenshot 2024-11-04 at 22 37 56" src="https://github.com/user-attachments/assets/acedbaff-9cac-4494-abda-f81326e2492a">
  
5. **Real-Time Notifications** - Captures real-time updates, enhancing the interactive user experience. 
  <img width="344" alt="Screenshot 2024-11-04 at 22 38 55" src="https://github.com/user-attachments/assets/fb53c083-91ef-44e7-9896-8120b6e0c3a2">

Each screenshot illustrates core features and the user journey, offering insights into the app’s functionality.

---

## Future Plans: AWS Implementation 🌐

To expand *iaTichet.com* and leverage the scalability, security, and reliability of cloud infrastructure, I plan to deploy the application on **Amazon Web Services (AWS)**. This implementation will enhance the application’s performance, improve data management, and provide a scalable solution to accommodate growing user demand. Below are the AWS services intended for use, each selected to support specific aspects of the application.

### AWS Services for Hosting & Scaling

1. **Amazon EC2 (Elastic Compute Cloud)**:  
   EC2 will provide resizable compute capacity, allowing the backend to scale seamlessly with user traffic. By launching instances as needed, EC2 ensures that the backend remains highly available, supporting *iaTichet.com* during peak usage.

2. **Amazon S3 (Simple Storage Service)**:  
   S3 will serve as the storage solution for static assets, such as user-uploaded images, PDFs, and other media. This service offers secure, low-latency access to files, and lifecycle policies can be applied to manage storage costs effectively as data grows.

3. **Amazon RDS (Relational Database Service)**:  
   RDS will simplify database management with a managed solution, supporting either MongoDB compatibility (via Amazon DocumentDB) or PostgreSQL to store reservation and user data securely. RDS offers automated backups, scaling options, and maintenance, enhancing reliability and performance.

4. **Amazon ElastiCache**:  
   For improved caching, ElastiCache with Redis will be implemented to reduce database load and improve response times by storing frequently accessed data in-memory.

5. **Amazon API Gateway**:  
   API Gateway will enable secure and scalable API management, controlling traffic to the backend and enforcing rate limits. Its integration with other AWS services will provide an additional security layer for exposed endpoints.

6. **AWS Lambda (Serverless Functions)**:  
   Lambda functions will handle background tasks, such as sending notifications or generating QR codes, in a scalable, serverless environment. This approach keeps resource costs low for event-driven tasks, enhancing efficiency.

7. **AWS CloudFront (Content Delivery Network)**:  
   CloudFront will distribute static content globally, caching assets stored in S3 closer to users and reducing load times for a smoother user experience.

---

*iaTichet.com* represents a commitment to building a secure, high-performing, and user-friendly event management application, making it an effective platform for both users and administrators. This README reflects the time, dedication, and thoughtful design invested in its development.
