# App Directory Pattern

## Status
🟡 **REQUIRED** - Application setup structure

## Universal Pattern

**"App directory contains 4 setup files: dependencies.js, middleware.js, routes.js, startup.js - NO business logic"**

## App Directory Structure

```
app/
  ├── dependencies.js         # DI container
  ├── middleware.js           # Middleware config
  ├── routes.js               # Route registration
  └── startup.js              # Lifecycle management
```

## File Responsibilities

### dependencies.js
- Instantiate all DAOs
- Instantiate all controllers with dependencies
- Return organized object by module

### middleware.js
- `applyMiddleware(app)` - CORS, body parsing
- `applyErrorHandlers(app)` - 404, global error handler

### routes.js
- `registerRoutes(app, dependencies)` - Mount all route factories

### startup.js
- `connectDatabase()` - MongoDB connection
- `startServer(app, port)` - Start HTTP server
- `shutdownServer()` - Graceful shutdown
- `registerShutdownHandlers()` - SIGINT/SIGTERM

---

**App directory is setup only - business logic belongs in modules/**
