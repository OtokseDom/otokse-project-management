# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Task filtering and search enhancements
- Improved error handling and validation
- Enhanced task history tracking

### Fixed
- Task and Discussion Image Attachments - No Preview (Issue #3)
- Minor UI/UX improvements
- Performance optimizations for large datasets

### Changed
- Updated project dependencies
- Improved code structure and organization

### Planned
- Notifications & Mentions for task discussions
- User tagging in comments
- Import/Export data functionality (CSV, Excel, JSON)
- Gantt/Timeline view for project scheduling
- Grouped list view options
- Task automation rules
- Task archiving capabilities
- Improved security features
- AI integration for insights and data entry

## [0.1.0-beta] - 2025-11-10

### Added
- Initial beta release
- Core project and task management features
- Multi-view support (List, Kanban, Calendar, Week, Dashboard)
- Role-based access control (Employee, Manager, Admin, Super Admin)
- Organization management with registration codes
- Task hierarchy (parent/subtasks)
- Task history tracking
- Task discussions with file attachments
- User dashboards and organization profiles
- Basic authentication (email and password)

### Features
- **List View**: DataTable with sorting and search
- **Kanban Board**: Drag-and-drop task columns
- **Calendar View**: Tasks by start_date and end_date
- **Week View**: Tasks by start_time and end_time
- **Dashboard**: Task and project metrics
- **User Dashboard**: Personalized statistics
- **Role-based Permissions**: Granular access control

### Known Issues
- Email validation not enforced
- Image attachments in discussions don't preview
- Some features incomplete

### Disclaimer
- This is a beta release - expect bugs and incomplete features
- Use only with test/dummy data
- Not recommended for production use yet
- Authentication and access control under active review

---

## Release Notes Format

For detailed release notes, visit the [Releases](https://github.com/OtokseDom/otokse-project-management/releases) page.

### Versioning

We use [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new features (backward compatible)
- **PATCH** version for bug fixes

### Pre-release Versions

- **alpha** - Early development, features incomplete
- **beta** - Feature complete, bugs may exist
- **rc** - Release candidate, ready for testing

Example: `v0.1.0-beta.1`, `v1.0.0-rc.2`
