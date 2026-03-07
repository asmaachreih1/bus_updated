import Location from '../models/Location';
import User from '../models/User';

export const LocationService = {
    update: async (userId: string, latitude: number, longitude: number) => {
        return await Location.findOneAndUpdate(
            { user_id: userId },
            {
                lat: latitude,
                lng: longitude,
                updated_at: new Date()
            },
            { upsert: true, new: true }
        );
    },

    getAll: async () => {
        const locations = await Location.find().sort({ updated_at: -1 }).lean();

        // Manual join for user details
        const enrichedLocations = await Promise.all(locations.map(async (loc) => {
            const user = await User.findOne({ id: loc.user_id }).select('name role').lean();
            return { ...loc, users: user };
        }));

        return enrichedLocations;
    }
};
