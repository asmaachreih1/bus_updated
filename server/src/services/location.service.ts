import { Location } from '../models/Location';

export const LocationService = {
    update: async (driverId: string, lat: number, lng: number, isDriving: boolean) => {
        return await Location.findOneAndUpdate(
            { driverId },
            { lat, lng, isDriving, lastUpdate: new Date() },
            { upsert: true, new: true }
        );
    },

    getAll: async () => {
        return await Location.find({});
    }
};
