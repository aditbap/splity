
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'splitbill_device_id';

export const getDeviceId = (): string => {
    if (typeof window === 'undefined') return 'server-side-rendering';

    let deviceId = localStorage.getItem(STORAGE_KEY);
    if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem(STORAGE_KEY, deviceId);
    }
    return deviceId;
};
