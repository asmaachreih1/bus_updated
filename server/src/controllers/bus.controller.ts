import { NextFunction, Request, Response } from 'express';
import * as busService from '../services/bus.service';

export async function getVans(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await busService.getVansState();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await busService.updateLocation(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateMember(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await busService.updateMember(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createCluster(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await busService.createCluster(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function joinCluster(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await busService.joinCluster(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function setAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await busService.setAttendance(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await busService.getAttendance();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createReport(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await busService.createReport(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getReports(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await busService.getReports();
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function resolveReport(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await busService.resolveReport(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function resetSimulation(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await busService.resetSimulation();
    res.json(result);
  } catch (error) {
    next(error);
  }
}
