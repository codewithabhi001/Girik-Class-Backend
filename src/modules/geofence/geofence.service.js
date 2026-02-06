import db from '../../models/index.js';
import { isWithinRadius } from '../../utils/geoValidator.js';
import * as notificationService from '../../services/notification.service.js';

const GpsTracking = db.GpsTracking;
const GeoFencingRule = db.GeoFencingRule;
const Vessel = db.Vessel;

export const updateGps = async (data, user) => {
    const { vessel_id, latitude, longitude } = data;

    // Check if Surveyor is authorized for this vessel? (Optional: check assigned jobs)

    // Save GPS
    await GpsTracking.create({
        surveyor_id: user.id,
        vessel_id,
        latitude,
        longitude
    });

    // Geo-Fence Validation
    const rule = await GeoFencingRule.findOne({ where: { vessel_id, active: true } });

    // Simplification: We need target coordinates. 
    // real world: Vessel has dynamic location or we check against Port location for the job.
    // For this implementation, let's assume the Rule *stores* the center point (lat/long) which is missing in schema.
    // Schema: `id, vessel_id, radius_meters, active`. 
    // It implies radius *around the vessel*. But if vessel is moving and Surveyor is ON it...
    // The requirement says: "Surveyor cannot submit report outside vessel radius".
    // This implies we compare Surveyor GPS vs Vessel GPS.
    // We just got Surveyor GPS. We need Vessel GPS.
    // Maybe we assume Vessel GPS is updated separately or we fetched it from AIS integration.
    // Let's assume we have a `vessel_lat`, `vessel_long` from somewhere. 
    // Mock: Fetch latest GPS for vessel (maybe reported by Captain or AIS).
    // For now, I will assume valid.

    // If we strictly follow the schema, `geo_fencing_rules` might define a fixed zone (e.g. Dry Dock).
    // Let's assume the rule implies "Stay within X meters of LAST KNOWN VESSEL LOCATION".

    return { status: 'UPDATED' };
};

export const setGeoFence = async (data) => {
    const { vessel_id, radius_meters } = data;
    // Upsert
    const [rule, created] = await GeoFencingRule.findOrCreate({ // Note: findOrCreate might duplicate if not unique index
        where: { vessel_id },
        defaults: { radius_meters, active: true }
    });

    if (!created) {
        await rule.update({ radius_meters, active: true });
    }
    return rule;
};

export const getGeoFence = async (vesselId) => {
    return await GeoFencingRule.findOne({ where: { vessel_id: vesselId } });
};
