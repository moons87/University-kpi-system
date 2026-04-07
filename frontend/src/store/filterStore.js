import { create } from 'zustand';

const useFilterStore = create((set) => ({
  timeId:   null,
  year:     2024,
  semester: 1,
  setFilter: (timeId, year, semester) => set({ timeId, year, semester }),
}));

export default useFilterStore;
