import { NextFunction, Request, Response } from 'express';
import * as authService from '../services/auth.service';

export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.signup(req.body);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { user, token } = await authService.login(req.body);
    res.json({ success: true, user, token });
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
}

export async function users(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = authService.listUsers();
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
}
