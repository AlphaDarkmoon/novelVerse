# 📚 Novel Reading Platform

A full-stack web application for reading and managing novels, designed with a smooth and immersive reading experience in mind. Built with **React**, **Express**, and **PostgreSQL**.

![App Preview](images/novel-preview.png)
---

## 🚀 Features

### 🔐 Authentication
- Secure user registration & login
- Role-based access control (Admin/User)
- Session management & protected routes

### 📖 Novel Management
- Browse by genre
- Featured, trending, and recent novels sections
- Advanced search & filtering
- Novel detail views with chapters
- Bookmarking, rating, and reading history tracking

### 🧑‍💻 Admin Panel
- Manage novels, chapters, and users (CRUD)
- Analytics dashboard
- Content moderation tools

### 📘 Reading Experience
- Chapter-by-chapter reader
- Progress tracking
- Customizable UI:
  - Font size & family
  - Line spacing
  - Dark/Light mode
  - Background color

### 📚 Personal Library
- Bookmarked novels
- Liked novels
- Reading history
- Personal reading preferences

---

## 🗺️ Pages Overview

| Route | Page | Features |
|-------|------|----------|
| `/` | **Home** | Featured, trending, recent novels, genre filtering |
| `/auth` | **Auth** | Login & registration with validation |
| `/novel/:id` | **Novel Detail** | Novel info, chapter list, likes, bookmarks, comments |
| `/read/:chapterId` | **Reader** | Reading experience, settings, progress tracking |
| `/library` | **Library** | User bookmarks, likes, history |
| `/admin` | **Admin** | Manage content, users, analytics |

---

## 🛠 Tech Stack

| Layer      | Technologies |
|------------|--------------|
| **Frontend**  | React, TypeScript, Tailwind CSS, Shadcn UI |
| **Backend**   | Express.js, Node.js |
| **Database**  | PostgreSQL (via Drizzle ORM) |
| **Auth**      | Passport.js |
| **Routing**   | Wouter |
| **State Management** | React Query |

---

## 🌱 Future Enhancements

### 💡 Features
- Threaded comments & replies  
- User profiles & social features  
- Novel recommendations & curated reading lists  
- Review system & improved rating algorithm  
- Multi-language support  
- Audio book integration  

### ⚙️ Technical
- Offline reading support  
- Image & asset optimization  
- Real-time notifications  
- Enhanced search filters  
- Mobile app version  
- API documentation & testing suite  

### 🧑‍💼 Admin
- Content scheduling  
- Bulk editing tools  
- Enhanced analytics & reporting  
- Activity monitoring  
- Automated backups  

---

## 🧰 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/novel-platform.git
   cd novel-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   psql your_database_name < backup.sql
   ```
   or

   > Create an account on neon PostgreSQL and import database in it, then connect it.

4. **Create a `.env` file**
   ```env
   # SESSION
    SESSION_SECRET= *********

    # DATABASE
    DATABASE_URL= *********
    PGDATABASE=neondb
    PGHOST=*********
    PGPORT=5432
    PGUSER=neondb_owner
    PGPASSWORD=*********
    NODE_ENV=development
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be running at **http://localhost:5000**

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to open a pull request or submit an issue on [GitHub](#).
