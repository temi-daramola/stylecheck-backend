# Business Logic Separation Pattern
## Status
🟡 **REQUIRED**
## Universal Pattern
**"Business logic in controllers. Database operations in DAOs. Validation in DTOs. Response construction in controllers."**
## Separation
- **Controller**: Business rules, validation orchestration, response construction
- **DAO**: Database queries only
- **DTO**: Validation rules only
- **Route**: Request/response handling, error catching
---
**Clear separation of concerns across layers**
