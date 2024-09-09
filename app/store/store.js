// store/store.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createPostSlice } from './postSlice';
import {createPlaySlice} from "@/app/store/playSlice";



export const useStore = create(
    persist(
        (...a) => ({
            ...createPostSlice(...a),
            ...createPlaySlice(...a),
        }),
        {
            name: 'ggg', // unique name for the storage
            storage: createJSONStorage(() => localStorage), // use local storage
        }
    )
);

export default useStore;



