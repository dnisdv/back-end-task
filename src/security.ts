import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export function checkPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(data: TokenData): string {
  return jwt.sign(data, String(process.env.jwtSecretKey));
}

export function isValidToken(token: string): boolean {
  return !!jwt.verify(token, String(process.env.jwtSecretKey));
}

export function extraDataFromToken(token: string): TokenData {
  return jwt.verify(token, String(process.env.jwtSecretKey)) as unknown as TokenData;
}

export interface TokenData {
  id: number;
}