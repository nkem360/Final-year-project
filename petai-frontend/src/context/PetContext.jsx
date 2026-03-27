/**
 * PetContext
 * ----------
 * Manages the list of pets and the currently-selected pet for the entire app.
 *
 * fetchPets() is called once after the user logs in (from App.jsx).
 * All CRUD operations update local state immediately after a successful API call
 * so the UI feels instant without needing a full refetch.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import { petsApi } from "../services/api";

const PetContext = createContext(null);

export function PetProvider({ children }) {
  const [pets, setPets]               = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [loadingPets, setLoadingPets] = useState(false);
  const [petsError, setPetsError]     = useState(null);

  // ── Fetch all pets ────────────────────────────────────────────────────────

  const fetchPets = useCallback(async () => {
    setLoadingPets(true);
    setPetsError(null);
    try {
      const data = await petsApi.list();
      setPets(data);
      // Auto-select the first pet if nothing is already selected
      if (data.length > 0) {
        setSelectedPet((prev) => prev ?? data[0]);
      }
    } catch (err) {
      setPetsError(err.message);
    } finally {
      setLoadingPets(false);
    }
  }, []);

  // ── Create ────────────────────────────────────────────────────────────────

  const addPet = useCallback(async (petData) => {
    const newPet = await petsApi.create(petData);
    setPets((prev) => [...prev, newPet]);
    setSelectedPet(newPet); // auto-select the newly created pet
    return newPet;
  }, []);

  // ── Update ────────────────────────────────────────────────────────────────

  const updatePet = useCallback(async (id, petData) => {
    const updated = await petsApi.update(id, petData);
    setPets((prev) => prev.map((p) => (p.id === id ? updated : p)));
    setSelectedPet((prev) => (prev?.id === id ? updated : prev));
    return updated;
  }, []);

  // ── Delete ────────────────────────────────────────────────────────────────

  const deletePet = useCallback(
    async (id) => {
      await petsApi.delete(id);
      const remaining = pets.filter((p) => p.id !== id);
      setPets(remaining);
      // Move selection to first remaining pet (or null)
      if (selectedPet?.id === id) {
        setSelectedPet(remaining[0] ?? null);
      }
    },
    [pets, selectedPet]
  );

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Returns a species emoji for display purposes. */
  const speciesEmoji = (species) => {
    const map = {
      dog: "🐶",
      cat: "🐱",
      bird: "🐦",
      rabbit: "🐰",
      hamster: "🐹",
      fish: "🐟",
      reptile: "🦎",
      other: "🐾",
    };
    return map[species] ?? "🐾";
  };

  return (
    <PetContext.Provider
      value={{
        pets,
        selectedPet,
        setSelectedPet,
        loadingPets,
        petsError,
        fetchPets,
        addPet,
        updatePet,
        deletePet,
        speciesEmoji,
      }}
    >
      {children}
    </PetContext.Provider>
  );
}

/** Hook for consuming pet state/actions in any component. */
export function usePets() {
  const ctx = useContext(PetContext);
  if (!ctx) throw new Error("usePets must be used inside <PetProvider>");
  return ctx;
}
