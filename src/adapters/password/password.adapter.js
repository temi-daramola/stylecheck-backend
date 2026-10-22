import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export const passwordAdapter = Object.freeze({
  hash: (plainPassword) => bcrypt.hash(plainPassword, SALT_ROUNDS),
  compare: (plainPassword, hashedPassword) => bcrypt.compare(plainPassword, hashedPassword),
});
