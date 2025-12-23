/* Shared helpers + data (no libraries) */

(function () {
  "use strict";

  const BASE_CARS = [
    {
      id: "corolla-2023",
      name: "Toyota Corolla",
      year: 2023,
      category: "Economy",
      pricePerDay: 120,
      img: "img/corolla.jpg",
      transmission: "أوتوماتيك",
      fuel: "بنزين",
      seats: 5,
      description: "سيارة اقتصادية ممتازة للمدينة، مكيف قوي، قيادة سلسة.",
    },
    {
      id: "elantra-2022",
      name: "Hyundai Elantra",
      year: 2022,
      category: "Sedan",
      pricePerDay: 140,
      img: "img/elantra.jpg",
      transmission: "أوتوماتيك",
      fuel: "بنزين",
      seats: 5,
      description: "سيدان مريحة للطرق اليومية، مساحة جيدة، واستهلاك ممتاز.",
    },
    {
      id: "sportage-2021",
      name: "Kia Sportage",
      year: 2021,
      category: "SUV",
      pricePerDay: 220,
      img: "img/sportage.jpg",
      transmission: "أوتوماتيك",
      fuel: "بنزين",
      seats: 7,
      description: "SUV عائلية مع مساحة واسعة وأداء قوي للرحلات.",
    },
  ];

  const CUSTOM_CARS_KEY = "customCars";
  const CAR_OVERRIDES_KEY = "carOverrides";
  const REMOVED_CAR_IDS_KEY = "removedCarIds";

  function safeJsonParse(value, fallback) {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function loadCustomCars() {
    try {
      const raw = localStorage.getItem(CUSTOM_CARS_KEY);
      const list = safeJsonParse(raw || "[]", []);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function loadOverrides() {
    try {
      const raw = localStorage.getItem(CAR_OVERRIDES_KEY);
      const obj = safeJsonParse(raw || "{}", {});
      return obj && typeof obj === "object" ? obj : {};
    } catch {
      return {};
    }
  }

  function saveOverrides(overrides) {
    try {
      localStorage.setItem(CAR_OVERRIDES_KEY, JSON.stringify(overrides));
    } catch {
      // ignore
    }
  }

  function loadRemovedIds() {
    try {
      const raw = localStorage.getItem(REMOVED_CAR_IDS_KEY);
      const list = safeJsonParse(raw || "[]", []);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function saveRemovedIds(ids) {
    try {
      localStorage.setItem(REMOVED_CAR_IDS_KEY, JSON.stringify(ids));
    } catch {
      // ignore
    }
  }

  function saveCustomCars(cars) {
    try {
      localStorage.setItem(CUSTOM_CARS_KEY, JSON.stringify(cars));
    } catch {
      // ignore
    }
  }

  function getCars() {
    const custom = loadCustomCars();
    const overrides = loadOverrides();
    const removedIds = new Set(loadRemovedIds());
    const seen = new Set();
    const merged = [];

    [...BASE_CARS, ...custom].forEach((car) => {
      if (!car || !car.id) return;
      if (seen.has(car.id)) return;
      if (removedIds.has(car.id)) return;
      seen.add(car.id);

      const ov = overrides[car.id];
      if (ov && typeof ov === "object") {
        merged.push({ ...car, ...ov, id: car.id });
      } else {
        merged.push(car);
      }
    });

    return merged;
  }

  function updateCar(carId, updates) {
    if (!carId) return { ok: false, error: "ID_REQUIRED" };
    const existing = getCarById(carId);
    if (!existing) return { ok: false, error: "NOT_FOUND" };

    const next = { ...existing };

    if (typeof updates?.name === "string") next.name = updates.name.trim();
    if (updates?.year !== undefined) next.year = Number(updates.year);
    if (updates?.pricePerDay !== undefined) next.pricePerDay = Number(updates.pricePerDay);
    if (typeof updates?.category === "string") next.category = updates.category.trim() || next.category;
    if (typeof updates?.img === "string") next.img = updates.img.trim() || next.img;
    if (updates?.seats !== undefined) next.seats = Number(updates.seats);
    if (typeof updates?.locationUrl === "string") next.locationUrl = updates.locationUrl.trim();

    if (!next.name) return { ok: false, error: "NAME_REQUIRED" };
    if (!Number.isFinite(next.year) || next.year < 1950 || next.year > 2100) return { ok: false, error: "INVALID_YEAR" };
    if (!Number.isFinite(next.pricePerDay) || next.pricePerDay <= 0) return { ok: false, error: "INVALID_PRICE" };

    const overrides = loadOverrides();
    overrides[carId] = {
      name: next.name,
      year: next.year,
      category: next.category,
      pricePerDay: next.pricePerDay,
      img: next.img,
      seats: next.seats,
      locationUrl: next.locationUrl,
    };
    saveOverrides(overrides);
    return { ok: true };
  }

  function deleteCar(carId) {
    if (!carId) return { ok: false, error: "ID_REQUIRED" };

    // Remove from custom cars if it exists there
    const custom = loadCustomCars();
    const remainingCustom = custom.filter((c) => c && c.id !== carId);
    if (remainingCustom.length !== custom.length) {
      saveCustomCars(remainingCustom);
    } else {
      // If it's a base car, mark as removed
      const removed = new Set(loadRemovedIds());
      removed.add(carId);
      saveRemovedIds([...removed]);
    }

    // Clean override if present
    const overrides = loadOverrides();
    if (overrides[carId]) {
      delete overrides[carId];
      saveOverrides(overrides);
    }

    return { ok: true };
  }

  function slugify(text) {
    return String(text || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60);
  }

  function ensureUniqueId(desiredId) {
    const all = getCars();
    const used = new Set(all.map((c) => c.id));
    if (!used.has(desiredId)) return desiredId;
    let i = 2;
    while (used.has(`${desiredId}-${i}`)) i += 1;
    return `${desiredId}-${i}`;
  }

  function addCar(input) {
    const name = String(input?.name || "").trim();
    const year = Number(input?.year);
    const pricePerDay = Number(input?.pricePerDay);
    const category = String(input?.category || "").trim() || "Economy";

    if (!name) return { ok: false, error: "NAME_REQUIRED" };
    if (!Number.isFinite(year) || year < 1950 || year > 2100) return { ok: false, error: "INVALID_YEAR" };
    if (!Number.isFinite(pricePerDay) || pricePerDay <= 0) return { ok: false, error: "INVALID_PRICE" };

    const baseId = slugify(`${name}-${year}`) || `car-${Date.now()}`;
    const id = ensureUniqueId(baseId);

    const car = {
      id,
      name,
      year,
      category,
      pricePerDay,
      img: String(input?.img || "").trim() || "img/corolla.jpg",
      transmission: String(input?.transmission || "").trim() || "أوتوماتيك",
      fuel: String(input?.fuel || "").trim() || "بنزين",
      seats: Number.isFinite(Number(input?.seats)) ? Number(input.seats) : 5,
      description: String(input?.description || "").trim() || "",
      locationUrl: String(input?.locationUrl || "").trim() || "",
    };

    const current = loadCustomCars();
    current.push(car);
    saveCustomCars(current);
    return { ok: true, car };
  }

  function getQueryParam(key) {
    try {
      const params = new URLSearchParams(window.location.search);
      const value = params.get(key);
      return value && value.trim() ? value.trim() : null;
    } catch {
      return null;
    }
  }

  function setSelectedCarId(id) {
    if (!id) return;
    try {
      localStorage.setItem("selectedCarId", id);
    } catch {
      // ignore
    }
  }

  function getSelectedCarId() {
    const fromQuery = getQueryParam("id");
    if (fromQuery) return fromQuery;
    try {
      const fromStorage = localStorage.getItem("selectedCarId");
      return fromStorage && fromStorage.trim() ? fromStorage.trim() : null;
    } catch {
      return null;
    }
  }

  function getCarById(id) {
    if (!id) return null;
    return getCars().find((c) => c.id === id) || null;
  }

  function formatCarLabel(car) {
    return `${car.name} ${car.year} — ${car.pricePerDay} د.ل/يوم`;
  }

  window.CarRent = {
    CARS: BASE_CARS,
    getCars,
    addCar,
    updateCar,
    deleteCar,
    getQueryParam,
    setSelectedCarId,
    getSelectedCarId,
    getCarById,
    formatCarLabel,
  };
})();
