import { loginValidation } from '@modules/auth/dto/login.dto.js';
import { forgotPasswordValidation, resetPasswordValidation } from '@modules/auth/dto/passwordReset.dto.js';

export const dto = Object.freeze({
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
});
