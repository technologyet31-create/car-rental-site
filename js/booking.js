/* booking page logic */

(function () {
  "use strict";

  function $(id) {
    return document.getElementById(id);
  }

  function parseDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function daysBetweenInclusive(start, end) {
    const ms = end.getTime() - start.getTime();
    const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }

  function fillCarsSelect(selectEl) {
    selectEl.innerHTML = "";
    window.CarRent.getCars().forEach((car) => {
      const opt = document.createElement("option");
      opt.value = car.id;
      opt.textContent = window.CarRent.formatCarLabel(car);
      selectEl.appendChild(opt);
    });
  }

  function recalc() {
    const carSelect = $("carSelect");
    const startDate = $("startDate");
    const endDate = $("endDate");
    const daysInput = $("daysInput");
    const totalInput = $("totalInput");

    if (!carSelect || !startDate || !endDate || !daysInput || !totalInput) return;

    const car = window.CarRent.getCarById(carSelect.value);
    const start = parseDate(startDate.value);
    const end = parseDate(endDate.value);

    if (!car || !start || !end) {
      daysInput.value = "—";
      totalInput.value = "—";
      return;
    }

    const days = daysBetweenInclusive(start, end);
    daysInput.value = days ? String(days) : "—";
    totalInput.value = days ? `${days * car.pricePerDay} د.ل` : "—";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const carSelect = $("carSelect");
    if (!carSelect) return;

    fillCarsSelect(carSelect);

    const selectedId = window.CarRent.getSelectedCarId();
    const allCars = window.CarRent.getCars();
    const initialCar = window.CarRent.getCarById(selectedId) || allCars[0];
    carSelect.value = initialCar.id;
    window.CarRent.setSelectedCarId(initialCar.id);

    const startDate = $("startDate");
    const endDate = $("endDate");

    carSelect.addEventListener("change", () => {
      window.CarRent.setSelectedCarId(carSelect.value);
      recalc();
    });

    if (startDate) startDate.addEventListener("change", recalc);
    if (endDate) endDate.addEventListener("change", recalc);

    const form = document.querySelector("form.form-card");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("تم إرسال طلب الحجز. سنتواصل معك قريباً.");
        form.reset();
        fillCarsSelect(carSelect);
        carSelect.value = initialCar.id;
        recalc();
      });
    }

    recalc();
  });
})();
