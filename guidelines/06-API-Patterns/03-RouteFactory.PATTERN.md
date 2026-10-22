# Route Factory Pattern
## Status
🟡 **REQUIRED**
## Universal Pattern
**"Routes are factory functions that accept controller and return Express Router"**
## Pattern
```javascript
// routes/signup.routes.js
export function createSignupRoutes(controller) {
  const router = express.Router();
  
  router.post('/', signupValidation, async (req, res) => {
    try {
      const result = await controller.signup(req.body);
      res.status(201).json(result);
    } catch (error) {
      // Error handling
    }
  });
  
  return router;
}

// app/routes.js
app.use('/auth/signup', createSignupRoutes(dependencies.auth.signupController));
```
---
**Routes receive dependencies via factory function**
