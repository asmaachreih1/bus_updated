import { NextFunction, Request, Response } from 'express';
import * as busService from '../services/bus.service';

export function getVans(req: Request, res: Response, next: NextFunction): void {
  try {
    const result = busService.getVansState();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function updateLocation(req: Request, res: Response, next: NextFunction): void {
  try {
    const result = busService.updateLocation(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function updateMember(req: Request, res: Response, next: NextFunction): void {
  try {
    const result = busService.updateMember(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function createCluster(req: Request, res: Response, next: NextFunction): void {
  try {
    const result = busService.createCluster(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function joinCluster(req: Request, res: Response, next: NextFunction): void {
  try {
    const result = busService.joinCluster(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function setAttendance(req: Request, res: Response, next: NextFunction): void {
  try {
    const result = busService.setAttendance(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function getAttendance(req: Request, res: Response, next: NextFunction): void {
  try {
    const result = busService.getAttendance();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function createReport(req: Request, res: Response, next: NextFunction): void {
  try {
    const result = busService.createReport(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function getReports(req: Request, res: Response, next: NextFunction): void {
  try {
    const result = busService.getReports();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function resolveReport(req: Request, res: Response, next: NextFunction): void {
  try {
    const result = busService.resolveReport(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export function resetSimulation(req: Request, res: Response, next: NextFunction): void {
  try {
    const result = busService.resetSimulation();
    res.json(result);
  } catch (error) {
    next(error);
  }
}
