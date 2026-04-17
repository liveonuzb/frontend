import { filter, some } from "lodash";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useWearableStore = create(
    persist(
        (set, get) => ({
            connectedDevices: [],
            syncSettings: {
                steps: true,
                heartRate: true,
                sleep: true,
                calories: true,
            },
            lastSyncTime: null,
            syncing: false,

            connectDevice: (device) =>
                set((state) => ({
                    connectedDevices: [
                        ...state.connectedDevices,
                        { ...device, connectedAt: new Date().toISOString() },
                    ],
                })),

            disconnectDevice: (deviceId) =>
                set((state) => ({
                    connectedDevices: filter(state.connectedDevices, (d) => d.id !== deviceId),
                })),

            toggleSync: (key) =>
                set((state) => ({
                    syncSettings: {
                        ...state.syncSettings,
                        [key]: !state.syncSettings[key],
                    },
                })),

            startSync: () => set({ syncing: true }),

            finishSync: () =>
                set({
                    syncing: false,
                    lastSyncTime: new Date().toISOString(),
                }),

            simulateSync: () => {
                set({ syncing: true });
                setTimeout(() => {
                    set({
                        syncing: false,
                        lastSyncTime: new Date().toISOString(),
                    });
                }, 2000);
            },

            isConnected: (deviceId) =>
                some(get().connectedDevices, (d) => d.id === deviceId),
        }),
        { name: "wearable-storage" }
    )
);

export default useWearableStore;
