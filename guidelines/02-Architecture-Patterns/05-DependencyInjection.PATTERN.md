# Dependency Injection Container Pattern
## Status
🟡 **REQUIRED**
## Universal Pattern
**"Central createDependencies() function instantiates all DAOs and controllers, returns organized object by module"**
## Pattern
```javascript
export function createDependencies() {
  const accountDAO = new AccountDAO();
  const signupController = new SignupController(accountDAO, passwordAdapter);
  
  return {
    auth: { signupController }
  };
}
```
---
**One function creates all dependencies - controllers receive via constructor**
