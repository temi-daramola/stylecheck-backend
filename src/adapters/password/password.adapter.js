import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export const passwordAdapter = Object.freeze({
  hash: async (plainPassword) => {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
  },

  compare: async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
  },
});
