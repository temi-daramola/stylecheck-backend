# Database Connection Pattern
## Status
🟡 **REQUIRED**
## Universal Pattern
**"Database connection in database/database.js, exported via database/_index.js"**
## Pattern
```javascript
// database/database.js
export default {
  connect: async (uri) => mongoose.connect(uri),
  disconnect: async () => mongoose.disconnect(),
  isConnected: () => mongoose.connection.readyState === 1
};

// app/startup.js
await database.connect(MONGODB_URI);
```
---
**Centralized database connection with lifecycle methods**
