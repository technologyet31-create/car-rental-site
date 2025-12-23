/* admin dashboard page protection */

(function () {
  "use strict";

  function isAdminLoggedIn() {
    try {
      return localStorage.getItem("adminLoggedIn") === "1";
    } catch {
      return false;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!isAdminLoggedIn()) {
      window.location.replace("admin-login.html");
      return;
    }

    function $(id) {
      return document.getElementById(id);
    }

    function showMessage(message, isError) {
      const el = $("adminCarMessage");
      if (!el) return;
      el.textContent = message;
      el.style.display = message ? "block" : "none";
      if (isError) {
        el.style.borderColor = "rgba(255,255,255,.10)";
      }
    }

    let editingCarId = null;

    function setEditingState(carId) {
      editingCarId = carId || null;
      const btn = $("adminSaveCar");
      if (!btn) return;
      btn.textContent = editingCarId ? "تحديث" : "حفظ";
    }

    function renderCarsTable() {
      const body = $("adminCarsTableBody");
      if (!body) return;
      body.innerHTML = "";

      const cars = window.CarRent.getCars();
      cars.forEach((car) => {
        const seats = car.seats != null ? car.seats : "—";
        const locationCell = car.locationUrl
          ? `<a class="status" href="${car.locationUrl}" target="_blank" rel="noopener noreferrer">الخريطة</a>`
          : `<span class="status">—</span>`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${car.name}</td>
          <td>${car.year}</td>
          <td>${car.pricePerDay}</td>
          <td>${car.category}</td>
          <td>${seats}</td>
          <td>${locationCell}</td>
          <td>
            <button type="button" class="status" data-action="edit" data-id="${car.id}">تعديل</button>
            <button type="button" class="status" data-action="delete" data-id="${car.id}">حذف</button>
          </td>
        `;
        body.appendChild(tr);
      });
    }

    function fillFormFromCar(car) {
      if ($("adminCarName")) $("adminCarName").value = car.name || "";
      if ($("adminCarYear")) $("adminCarYear").value = car.year != null ? String(car.year) : "";
      if ($("adminCarPrice")) $("adminCarPrice").value = car.pricePerDay != null ? String(car.pricePerDay) : "";
      if ($("adminCarCategory")) $("adminCarCategory").value = car.category || "Economy";
      if ($("adminCarImage")) $("adminCarImage").value = car.img || "";
      if ($("adminCarSeats")) $("adminCarSeats").value = car.seats != null ? String(car.seats) : "";
      if ($("adminCarLocation")) $("adminCarLocation").value = car.locationUrl || "";
    }

    function onSaveCar() {
      showMessage("", false);

      const wasEditing = Boolean(editingCarId);

      const name = $("adminCarName")?.value || "";
      const year = $("adminCarYear")?.value || "";
      const price = $("adminCarPrice")?.value || "";
      const category = $("adminCarCategory")?.value || "Economy";
      const img = $("adminCarImage")?.value || "";
      const seats = $("adminCarSeats")?.value || "";
      const locationUrl = $("adminCarLocation")?.value || "";

      const locationText = String(locationUrl || "").trim();
      if (locationText) {
        const hasIframe = locationText.toLowerCase().includes("<iframe");
        const hasEmbed = locationText.includes("/maps/embed") || locationText.includes("google.com/maps/embed");
        if (!hasIframe && !hasEmbed) {
          showMessage("الرجاء إدخال كود Google Maps Embed (iframe) فقط.", true);
          return;
        }
      }

      const payload = {
        name,
        year: Number(year),
        pricePerDay: Number(price),
        category,
        img,
        seats: Number(seats),
        locationUrl: locationText,
      };

      const result = editingCarId
        ? window.CarRent.updateCar(editingCarId, payload)
        : window.CarRent.addCar(payload);

      if (!result.ok) {
        const map = {
          ID_REQUIRED: "معرف السيارة غير صحيح.",
          NOT_FOUND: "السيارة غير موجودة.",
          NAME_REQUIRED: "اسم السيارة مطلوب.",
          INVALID_YEAR: "السنة غير صحيحة.",
          INVALID_PRICE: "السعر/اليوم غير صحيح.",
        };
        showMessage(map[result.error] || "تعذر حفظ السيارة.", true);
        return;
      }

      // Clear inputs
      if ($("adminCarName")) $("adminCarName").value = "";
      if ($("adminCarYear")) $("adminCarYear").value = "";
      if ($("adminCarPrice")) $("adminCarPrice").value = "";
      if ($("adminCarImage")) $("adminCarImage").value = "";
      if ($("adminCarCategory")) $("adminCarCategory").value = "Economy";
      if ($("adminCarSeats")) $("adminCarSeats").value = "";
      if ($("adminCarLocation")) $("adminCarLocation").value = "";

      setEditingState(null);
      showMessage(wasEditing ? "تم تحديث السيارة بنجاح." : "تمت إضافة السيارة بنجاح.", false);
      renderCarsTable();
    }

    const addBtn = $("adminSaveCar");
    if (addBtn) addBtn.addEventListener("click", onSaveCar);

    const table = document.querySelector(".table-card");
    if (table) {
      table.addEventListener("click", (e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        const action = target.getAttribute("data-action");
        const id = target.getAttribute("data-id");
        if (!action || !id) return;

        if (action === "edit") {
          const car = window.CarRent.getCarById(id);
          if (!car) {
            showMessage("السيارة غير موجودة.", true);
            return;
          }
          fillFormFromCar(car);
          setEditingState(id);
          showMessage("أنت الآن في وضع التعديل.", false);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        if (action === "delete") {
          const ok = confirm("هل تريد حذف هذه السيارة؟");
          if (!ok) return;
          window.CarRent.deleteCar(id);
          if (editingCarId === id) {
            setEditingState(null);
          }
          renderCarsTable();
          showMessage("تم حذف السيارة.", false);
        }
      });
    }

    renderCarsTable();
  });
})();
