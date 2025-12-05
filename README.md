# 🧩 Project and Task Management Web App (Beta)

A web-based **Project and Task Management** application designed to help teams organize projects, track progress, and collaborate effectively.  
Built with role-based access control, dashboards, and multiple task views for flexibility and clarity.

> ⚠️ **Note:** This is an early **beta release** — still under active development. Some features are incomplete or may change in future versions.

---

## 🚀 Current Features

### 🗂️ Core Data Structure

-   **Organizations** with unique registration codes (`org_code`)
-   **Projects**, **Tasks**, **Statuses**, **Categories**, and **Members**
-   **Role-based permissions** (`Employee`, `Manager`, `Admin`, `Super Admin`)

### ✅ Task Management

-   CRUD operations for tasks, projects, and related entities
-   **Task relations:** Parent/subtasks hierarchy
-   **Task history** tracking changes over time
-   **Task discussions** with file attachments

### 📊 Views & Visualization

-   **List View:** DataTable of all tasks (sortable, searchable)
-   **Kanban Board:** Columns based on task statuses (drag, drop, reorder)
-   **Calendar View:** Tasks displayed based on `start_date` and `end_date`
-   **Week View:** Tasks displayed by `start_time` and `end_time`
-   **Dashboard:** Task and project insights, metrics, and reports with filters
-   **User Dashboard:** Personalized stats and performance indicators with filters
-   **Organization Profile:** Basic org info (name, code, description)

### 🔐 Access Control

-   Role-based restrictions:
    -   Employees can only modify their own tasks
    -   Managers/Admins can manage all projects and approve new members
-   Organization joining via **org code**
-   Basic authentication (email and password)

---

## 🧭 Upcoming Features

-   🔔 **Notifications & Mentions** (for task discussions and updates)
-   👥 **User tagging** in comments/discussions
-   📥 **Import / Export Data** (CSV, Excel, JSON formats)
-   🗓️ **Gantt / Timeline View** for project scheduling
-   🧾 **Grouped List View** (by status, category, or project)
-   🧰 **Task Automation Rules** (e.g., auto-assign or status updates)
-   🧺 **Task Archiving** and advanced sorting options for kanban
-   🔒 **Improved Security** (email validation, password strength, etc.)
-   ✨ **AI integration** for intelligent insights, data entry, and companion

---

## ⚠️ Disclaimers

-   This project is currently in **beta** — expect bugs and incomplete features.
-   Use **dummy or test data only** if you are exploring the live demo.
-   Email validation is not enforced in this version.
-   Authentication and access control are under active review — do **not** use for sensitive or production data yet.

---

## 🧱 Tech Stack

-   **Frontend:** React JS
-   **Backend:** Laravel (PHP)
-   **Database:** MySQL
-   **Deployment:** Docker + Nginx

---

## 🌐 Demo Access

You can explore the beta version here:  
👉 [**Live Demo**](https://otokse.lidta.com)

Use test credentials or create your own account.
