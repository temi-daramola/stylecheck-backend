# DAO Structure Pattern
## Status
🟡 **REQUIRED**
## Universal Pattern
**"DAO handles all database operations. Methods: create, findById, findByX, updateById, deleteById, count"**
## Standard Methods
```javascript
class ResourceDAO {
  async create(data) { /* */ }
  async findById(id, merchantId) { /* */ }
  async findByMerchant(merchantId) { /* */ }
  async updateById(id, merchantId, data) { /* */ }
  async deleteById(id, merchantId) { /* */ }
  async countByMerchant(merchantId) { /* */ }
}
```
---
**DAO is pure database operations - no business logic**
