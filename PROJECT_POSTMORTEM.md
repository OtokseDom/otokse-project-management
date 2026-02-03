# Project Postmortem – Task Management Application

## Overview

This project was an internal task and project management application developed over ~8 months. The goal was to build a flexible, organization-based system capable of handling real-world task workflows, permissions, and reporting. While technically functional, the project was stopped due to scope, adoption complexity, and diminishing returns relative to effort.

This document captures what worked, what didn’t, architectural lessons learned, and the concrete skills gained.

---

## ✅ What Worked

### 🔐 Authentication & Access Control

- Basic email/password authentication
- Organization-based access using unique registration codes (`org_code`)
- Role-based permissions:
    - Employee
    - Manager
    - Admin
    - Super Admin

- Clear restriction rules:
    - Employees can only modify their own tasks
    - Managers/Admins can manage projects and approve members

### 🗂️ Core Data Structure

- Organizations with isolated data scopes
- Core entities:
    - Epics
    - Projects
    - Tasks
    - Statuses
    - Categories
    - Members

- Clean relational mapping between entities
- Consistent organization scoping across queries

### ✅ Task Management

- Full CRUD for tasks, projects, and related entities
- Parent/subtask hierarchy
- Task history tracking (audit trail of changes)
- Task discussions with file attachments
- Status-based task lifecycle

### 📊 Views & Visualization

- List View (DataTable): sortable, searchable tasks
- Kanban Board:
    - Status-based columns
    - Drag, drop, reorder

- Calendar View:
    - Tasks displayed via `start_date` and `end_date`

- Week View:
    - Time-based tasks using `start_time` and `end_time`

- Dashboard:
    - Task and project metrics
    - Filterable reports

- User Dashboard:
    - Personalized stats and performance indicators

- Organization Profile:
    - Name, code, description

- Grouped List Views:
    - By status
    - By category
    - By project

---

## ❌ What Didn’t Work (or Was Deferred)

No major features were technically broken. Instead, several important capabilities were intentionally avoided due to time, complexity, or unclear ROI:

- User mentions / tagging
- Notifications system
- Import / export (CSV, Excel)
- Gantt chart
- Stronger authentication (SSO, MFA)
- Data backup & restore
- AI-powered insights and automation

Avoiding these features limited real-world usefulness, especially for organizational adoption.

---

## 🧱 Architectural Decisions I’d Change

1. **Hierarchy Design (Epics vs Modules)**
    - Started with `Project → Task`
    - Later realized a missing abstraction layer
    - Added **Epic** as a parent to projects because it was easier than inserting modules between layers
    - Result: hierarchy works, but reflects a late design correction rather than a clean initial model

2. **Kanban Positioning Logic**
    - Early Kanban used static project-based positions
    - Later parts of the system used context-based positioning (per view / per grouping)
    - Inconsistency increased mental load and refactor cost

3. **Component Reusability (Frontend)**
    - Some reusable logic stayed inside page-level files
    - Reusability was identified too late
    - Resulted in duplication and harder refactors

---

## 💡 What I’m Confident About Now

1. **Backend API & Logic Structure**
    - Clear separation of concerns
    - Predictable request → validation → action → response flow
    - Organization-scoped queries handled consistently

2. **Frontend API Route Management**
    - Centralized API constants
    - Easier refactoring and route changes
    - Reduced hard-coded paths

3. **Resources & Request Validation**
    - Proper use of request validation
    - Resource transformers for API responses
    - Cleaner, safer data contracts between frontend and backend

---

## 📌 Final Assessment

This project succeeded as a **learning and systems-design exercise**, but failed as a **viable product** due to:

- High adoption friction
- Crowded market
- Expanding scope beyond task management
- Diminishing returns on refactoring

The work produced reusable architectural patterns, clearer judgment on scope control, and a better understanding of what makes software _usable_ versus merely _functional_.

The project was stopped intentionally to redirect effort toward smaller, higher-leverage work.
