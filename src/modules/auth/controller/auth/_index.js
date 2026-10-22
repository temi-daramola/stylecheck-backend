import { login } from '@modules/auth/controller/auth/login.js';
import { refresh } from '@modules/auth/controller/auth/refresh.js';
import { logout } from '@modules/auth/controller/auth/logout.js';
import { forgotPassword } from '@modules/auth/controller/auth/forgotPassword.js';
import { resetPassword } from '@modules/auth/controller/auth/resetPassword.js';

class AuthController {
  constructor({ supervisorDAO, refreshTokenDAO, passwordResetTokenDAO, passwordAdapter, jwtAdapter, brevoAdapter, logger }) {
    this.supervisorDAO = supervisorDAO;
    this.refreshTokenDAO = refreshTokenDAO;
    this.passwordResetTokenDAO = passwordResetTokenDAO;
    this.passwordAdapter = passwordAdapter;
    this.jwtAdapter = jwtAdapter;
    this.brevoAdapter = brevoAdapter;
    this.logger = logger;
  }

  async login(email, password, res) {
    return login.call(this, email, password, res);
  }

  async refresh(req, res) {
    return refresh.call(this, req, res);
  }

  async logout(req, res) {
    return logout.call(this, req, res);
  }

  async forgotPassword(email) {
    return forgotPassword.call(this, email);
  }

  async resetPassword(token, newPassword) {
    return resetPassword.call(this, token, newPassword);
  }
}

export default AuthController;
