# Controller Structure Pattern
## Status
🟡 **REQUIRED**
## Universal Pattern
**"Controller handles business logic. Receives DAOs/adapters via constructor."**
## Pattern
```javascript
class ResourceController {
  constructor(resourceDAO, otherDAO, adapter) {
    this.resourceDAO = resourceDAO;
    this.otherDAO = otherDAO;
    this.adapter = adapter;
  }

  async createResource(data, merchantId) {
    // Business logic + validation
    // Call DAO methods
    // Return response shape
  }
}
```
---
**Controllers coordinate business logic, DAOs do database work**
