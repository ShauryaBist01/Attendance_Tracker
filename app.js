// Wait for the DOM to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", () => {
  // --- 1. SELECTORS ---
  // Get references to the HTML elements we need
  const subjectForm = document.getElementById("add-subject-form");
  const subjectList = document.getElementById("subject-list");
  const subjectNameInput = document.getElementById("subject-name");
  const minPercentageInput = document.getElementById("min-percentage");

  // --- 2. DATA STORAGE ---
  // This array will hold all our subject objects.
  // We'll try to load from localStorage first.
  let subjects = JSON.parse(localStorage.getItem("attendanceSubjects")) || [];

  // --- 3. CORE CALCULATION LOGIC ---
  // This is the function from our previous discussion
  function calculateAttendance(attended, missed, minReqPercent) {
    const totalClasses = attended + missed;
    const minDecimal = minReqPercent / 100;

    if (totalClasses === 0) {
      return {
        currentPercent: 0,
        status: "info",
        message: "No classes recorded yet.",
      };
    }

    const currentPercent = (attended / totalClasses) * 100;

    if (minDecimal === 1) {
      return {
        currentPercent: currentPercent,
        status: missed > 0 ? "danger" : "safe",
        message: missed > 0 ? "Cannot reach 100%" : "On track. Don't miss!",
      };
    }

    if (currentPercent >= minReqPercent) {
      // "Safe Zone"
      const classesToBunk = Math.floor(attended / minDecimal - totalClasses);
      const s = classesToBunk === 1 ? "" : "s";
      return {
        currentPercent: currentPercent,
        status: "safe",
        message: `You can bunk ${classesToBunk} class${s}.`,
      };
    } else {
      // "Danger Zone"
      const classesToAttend = Math.ceil(
        (minDecimal * totalClasses - attended) / (1 - minDecimal)
      );
      const s = classesToAttend === 1 ? "" : "s";
      return {
        currentPercent: currentPercent,
        status: "danger",
        message: `You must attend ${classesToAttend} class${s}.`,
      };
    }
  }

  // --- 4. RENDER FUNCTION ---
  // This function redraws the entire list of subjects
  function renderSubjects() {
    // Clear the existing list
    subjectList.innerHTML = "";

    if (subjects.length === 0) {
      subjectList.innerHTML = "<p>No subjects added yet. Add one above!</p>";
      return;
    }

    subjects.forEach((subject, index) => {
      // Calculate the status for this subject
      const status = calculateAttendance(
        subject.attended,
        subject.missed,
        subject.minPercentage
      );

      // Create a new div element for the card
      const card = document.createElement("div");
      card.classList.add("subject-card", status.status); // e.g., "subject-card safe"

      // Set the card's HTML content
      card.innerHTML = `
        <h4>${subject.name}</h4>
        <p class="status">${status.message}</p>
        <p>
          Current: <strong>${status.currentPercent.toFixed(1)}%</strong>
          (Goal: ${subject.minPercentage}%)
        </p>

        <div class="controls">
          <div>
            <strong>Attended:</strong>
            <button class="dec" data-type="attended" data-index="${index}">-</button>
            <span class="count">${subject.attended}</span>
            <button class="inc" data-type="attended" data-index="${index}">+</button>
          </div>
          <div>
            <strong>Missed:</strong>
            <button class="dec" data-type="missed" data-index="${index}">-</button>
            <span class="count">${subject.missed}</span>
            <button class="inc" data-type="missed" data-index="${index}">+</button>
          </div>
        </div>
      `;
      // Add the new card to the list
      subjectList.appendChild(card);
    });
  }

  // --- 5. DATA PERSISTENCE ---
  function saveSubjects() {
    localStorage.setItem("attendanceSubjects", JSON.stringify(subjects));
  }

  // --- 6. EVENT LISTENERS ---

  // Listen for the "Add Subject" form submission
  subjectForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Stop the form from reloading the page

    // Get the values from the form
    const name = subjectNameInput.value;
    const minPercentage = parseInt(minPercentageInput.value);

    // Basic validation
    if (!name || isNaN(minPercentage) || minPercentage < 0 || minPercentage > 100) {
      alert("Please enter a valid subject name and percentage (0-100).");
      return;
    }

    // Create a new subject object
    const newSubject = {
      name: name,
      minPercentage: minPercentage,
      attended: 0,
      missed: 0,
    };

    // Add the new subject to our array
    subjects.push(newSubject);

    // Clear the form fields
    subjectNameInput.value = "";
    minPercentageInput.value = "75";

    // Save and re-render the list
    saveSubjects();
    renderSubjects();
  });

  // Listen for clicks on the increment/decrement buttons
  // We use event delegation on the list itself
  subjectList.addEventListener("click", (e) => {
    const target = e.target;
    const index = target.dataset.index;

    // Check if a button was clicked
    if (!index || !target.dataset.type) {
      return; // Not a button we care about
    }

    const type = target.dataset.type; // "attended" or "missed"

    if (target.classList.contains("inc")) {
      // Increment
      subjects[index][type]++;
    } else if (target.classList.contains("dec")) {
      // Decrement, but not below zero
      if (subjects[index][type] > 0) {
        subjects[index][type]--;
      }
    }

    // Save and re-render the list
    saveSubjects();
    renderSubjects();
  });

  // --- 7. INITIAL LOAD ---
  // Render the subjects that were loaded from localStorage
  renderSubjects();
});