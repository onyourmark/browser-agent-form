const state = {
  from: "",
  to: "",
  date: "",
  passengers: "1",
  flight: null,
  seat: "",
  name: "",
  email: "",
  bag: false,
  priority: false
};

const stages = {
  search: document.getElementById("searchStage"),
  results: document.getElementById("resultsStage"),
  seat: document.getElementById("seatStage"),
  passenger: document.getElementById("passengerStage"),
  review: document.getElementById("reviewStage"),
  confirmation: document.getElementById("confirmationStage")
};

const flights = [
  { id: "AA101", depart: "8:10 AM", arrive: "9:35 AM", stops: "Nonstop", price: 129 },
  { id: "AA205", depart: "11:40 AM", arrive: "1:10 PM", stops: "Nonstop", price: 156 },
  { id: "AA317", depart: "3:20 PM", arrive: "5:05 PM", stops: "1 stop", price: 118 },
  { id: "AA422", depart: "7:05 PM", arrive: "8:40 PM", stops: "Nonstop", price: 141 }
];

function showStage(name, pushHistory = true) {
  for (const key in stages) {
    stages[key].classList.add("hidden");
  }
  stages[name].classList.remove("hidden");

  if (pushHistory) {
    history.pushState({ stage: name }, "", "#" + name);
  }

  window.scrollTo({ top: 0, behavior: "auto" });
}

function currentStageFromHash() {
  const name = location.hash.replace("#", "");
  if (stages[name]) {
    return name;
  }
  return "search";
}

function setDefaultDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  const iso = date.toISOString().slice(0, 10);
  document.getElementById("departureDate").value = iso;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

document.getElementById("searchForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const from = document.getElementById("fromAirport").value;
  const to = document.getElementById("toAirport").value;
  const date = document.getElementById("departureDate").value;
  const passengers = document.getElementById("passengers").value;
  const error = document.getElementById("searchError");

  if (!from || !to || !date) {
    error.textContent = "Please complete From, To, and Departure date.";
    return;
  }

  if (from === to) {
    error.textContent = "From and To airports must be different.";
    return;
  }

  error.textContent = "";
  state.from = from;
  state.to = to;
  state.date = date;
  state.passengers = passengers;

  showStage("results");

  document.getElementById("searchSummary").textContent =
    from + " to " + to + " on " + date + " for " + passengers + " passenger(s).";

  const loading = document.getElementById("loadingFlights");
  const results = document.getElementById("flightResults");
  results.innerHTML = "";
  loading.classList.remove("hidden");

  setTimeout(function () {
    loading.classList.add("hidden");
    renderFlights();
  }, 1200);
});

function renderFlights() {
  const results = document.getElementById("flightResults");
  results.innerHTML = "";

  for (const flight of flights) {
    const card = document.createElement("article");
    card.className = "flight-card";
    card.dataset.flightId = flight.id;

    card.innerHTML =
      "<div>" +
        "<h3>" + flight.id + "</h3>" +
        "<p><strong>" + state.from + " → " + state.to + "</strong></p>" +
        "<p>" + flight.depart + " – " + flight.arrive + "</p>" +
      "</div>" +
      "<div>" +
        "<p>" + flight.stops + "</p>" +
        "<p><strong>$" + flight.price + "</strong> per passenger</p>" +
      "</div>" +
      "<div class='flight-actions'>" +
        "<button type='button' class='details secondary' data-flight='" + flight.id + "'>Flight details</button>" +
        "<button type='button' class='choose' data-flight='" + flight.id + "'>Choose " + flight.id + "</button>" +
      "</div>";

    results.appendChild(card);
  }
}

document.getElementById("flightResults").addEventListener("click", function (event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const flight = flights.find(function (item) {
    return item.id === button.dataset.flight;
  });

  if (!flight) {
    return;
  }

  if (button.classList.contains("details")) {
    document.getElementById("dialogTitle").textContent = flight.id + " details";
    document.getElementById("dialogBody").textContent =
      state.from + " to " + state.to + ", " + flight.depart + " to " +
      flight.arrive + ", " + flight.stops + ", $" + flight.price + " per passenger.";
    document.getElementById("flightDialog").showModal();
    return;
  }

  if (button.classList.contains("choose")) {
    state.flight = flight;
    renderSeatMap();
    document.getElementById("selectedFlightSummary").textContent =
      "Selected " + flight.id + ": " + state.from + " to " + state.to +
      ", departing " + flight.depart + ".";
    showStage("seat");
  }
});

document.getElementById("closeDialog").addEventListener("click", function () {
  document.getElementById("flightDialog").close();
});

function renderSeatMap() {
  const seatMap = document.getElementById("seatMap");
  const unavailable = ["1B", "2C", "3A", "4F", "5D"];
  seatMap.innerHTML = "";
  state.seat = "";
  document.getElementById("seatMessage").textContent = "";
  document.getElementById("continueFromSeat").disabled = true;

  const letters = ["A", "B", "C", "D", "E", "F"];

  for (let row = 1; row <= 5; row = row + 1) {
    for (const letter of letters) {
      const seat = String(row) + letter;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "seat";
      button.textContent = seat;
      button.setAttribute("aria-label", "Seat " + seat);
      button.dataset.seat = seat;

      if (unavailable.includes(seat)) {
        button.classList.add("unavailable");
        button.disabled = true;
        button.setAttribute("aria-label", "Seat " + seat + " unavailable");
      }

      seatMap.appendChild(button);
    }
  }
}

document.getElementById("seatMap").addEventListener("click", function (event) {
  const button = event.target.closest("button.seat");
  if (!button || button.disabled) {
    return;
  }

  for (const seatButton of document.querySelectorAll(".seat")) {
    seatButton.classList.remove("selected");
  }

  button.classList.add("selected");
  state.seat = button.dataset.seat;
  document.getElementById("seatMessage").textContent = "Selected seat " + state.seat + ".";
  document.getElementById("continueFromSeat").disabled = false;
});

document.getElementById("continueFromSeat").addEventListener("click", function () {
  if (!state.seat) {
    return;
  }
  showStage("passenger");
});

document.getElementById("passengerForm").addEventListener("submit", function (event) {
  event.preventDefault();

  state.name = document.getElementById("passengerName").value.trim();
  state.email = document.getElementById("passengerEmail").value.trim();
  state.bag = document.getElementById("checkedBag").checked;
  state.priority = document.getElementById("priorityBoarding").checked;

  if (!state.name || !state.email) {
    return;
  }

  renderReview();
  showStage("review");
});

function renderReview() {
  const total =
    state.flight.price * Number(state.passengers) +
    (state.bag ? 35 : 0) +
    (state.priority ? 20 : 0);

  document.getElementById("reviewCard").innerHTML =
    "<dl>" +
      "<dt>Route</dt><dd>" + escapeHtml(state.from + " → " + state.to) + "</dd>" +
      "<dt>Date</dt><dd>" + escapeHtml(state.date) + "</dd>" +
      "<dt>Flight</dt><dd>" + escapeHtml(state.flight.id) + "</dd>" +
      "<dt>Seat</dt><dd>" + escapeHtml(state.seat) + "</dd>" +
      "<dt>Passenger</dt><dd>" + escapeHtml(state.name) + "</dd>" +
      "<dt>Email</dt><dd>" + escapeHtml(state.email) + "</dd>" +
      "<dt>Checked bag</dt><dd>" + (state.bag ? "Yes" : "No") + "</dd>" +
      "<dt>Priority boarding</dt><dd>" + (state.priority ? "Yes" : "No") + "</dd>" +
      "<dt>Mock total</dt><dd>$" + total + "</dd>" +
    "</dl>";

  document.getElementById("confirmDetails").checked = false;
  document.getElementById("confirmReservation").disabled = true;
  document.getElementById("reviewMessage").textContent = "";
}

document.getElementById("confirmDetails").addEventListener("change", function (event) {
  document.getElementById("confirmReservation").disabled = !event.target.checked;
  document.getElementById("reviewMessage").textContent =
    event.target.checked ? "Details confirmed." : "";
});

document.getElementById("confirmReservation").addEventListener("click", function () {
  if (!document.getElementById("confirmDetails").checked) {
    return;
  }

  document.getElementById("confirmationDetails").innerHTML =
    document.getElementById("reviewCard").innerHTML;

  showStage("confirmation");
});

document.getElementById("resetTrip").addEventListener("click", function () {
  location.href = location.pathname;
});

window.addEventListener("popstate", function () {
  showStage(currentStageFromHash(), false);
});

setDefaultDate();

const initialStage = currentStageFromHash();
for (const key in stages) {
  stages[key].classList.add("hidden");
}
stages[initialStage].classList.remove("hidden");
history.replaceState({ stage: initialStage }, "", "#" + initialStage);
