document.addEventListener("DOMContentLoaded", () => {
  // === إنشاء حساب ===
  const signupForm = document.getElementById("signupForm");
  const signupMessage = document.getElementById("signupMessage");

  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value;
      const email = document.getElementById("newEmail").value;
      const password = document.getElementById("newPassword").value;
      const phone = document.getElementById("phone").value;

      localStorage.setItem(
        "user",
        JSON.stringify({ name, email, password, phone })
      );

      signupMessage.innerHTML =
        "🎉 تم إنشاء الحساب بنجاح! <br> <a href='index.html'>تسجيل الدخول</a>";
      setTimeout(() => {
        window.location.href = "index.html";
      }, 3000);
    });
  }

  // === تسجيل الدخول ===
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const user = JSON.parse(localStorage.getItem("user"));

      if (user && user.email === email && user.password === password) {
        localStorage.setItem("loggedIn", "true");
        window.location.href = "add_medication.html";
      } else {
        alert("❌ البريد الإلكتروني أو كلمة المرور غير صحيحة");
      }
    });
  }

  // === إدارة الأدوية ===
  const medicationForm = document.getElementById("medicationForm");
  const medicationTable = document.querySelector("#medicationTable tbody");

  function loadMedications() {
    let meds = JSON.parse(localStorage.getItem("medications")) || [];

    // ترتيب حسب أقرب موعد جرعة
    meds.sort((a, b) => {
      const [h1, m1] = a.nextDose.split(":").map(Number);
      const [h2, m2] = b.nextDose.split(":").map(Number);
      return h1 !== h2 ? h1 - h2 : m1 - m2;
    });

    medicationTable.innerHTML = "";
    meds.forEach((med, index) => addRow(med, index));
  }

  function addRow(med, index) {
    const tr = document.createElement("tr");
    const chronicText = med.chronic === "yes" ? "مزمن" : "غير مزمن";
    const status = med.remaining <= 0 ? "انتهى" : "جاري";

    tr.innerHTML = `
      <td>${med.drugName}</td>
      <td>${med.disease}</td>
      <td>${med.drugType}</td>
      <td>${chronicText}</td>
      <td>${med.lastDose}</td>
      <td>${med.nextDose}</td>
      <td>${med.remaining}</td>
      <td>${status}</td>
      <td><button class="delete-btn" data-index="${index}">🗑 حذف</button></td>
    `;

    medicationTable.appendChild(tr);

    tr.querySelector(".delete-btn").addEventListener("click", () => {
      deleteMedication(index);
    });
  }

  function deleteMedication(index) {
    const meds = JSON.parse(localStorage.getItem("medications")) || [];
    meds.splice(index, 1);
    localStorage.setItem("medications", JSON.stringify(meds));
    loadMedications();
  }

  if (medicationForm) {
    loadMedications();

    medicationForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const drugName = document.getElementById("drugName").value;
      const disease = document.getElementById("disease").value;
      const drugType = document.getElementById("drugType").value;
      const chronic = document.getElementById("chronic").value;
      let doses = parseInt(document.getElementById("doses").value);
      const firstDose = document.getElementById("firstDose").value;
      const interval = parseInt(document.getElementById("interval").value);

      if (chronic === "yes") doses = 500;

      const nextDose = calcNextDose(firstDose, interval);

      const med = {
        drugName,
        disease,
        drugType,
        chronic,
        lastDose: firstDose,
        nextDose,
        remaining: doses - 1,
        interval,
        createdAt: getCurrentTime(),
      };

      const meds = JSON.parse(localStorage.getItem("medications")) || [];
      meds.push(med);
      localStorage.setItem("medications", JSON.stringify(meds));

      loadMedications();
      medicationForm.reset();
      alert(`✅ تم تسجيل أول جرعة من ${drugName} الساعة ${firstDose}`);
    });

    setInterval(checkAlarms, 60000);
  }

  function calcNextDose(time, interval) {
    let [h, m] = time.split(":").map(Number);
    h += interval;
    while (h >= 24) h -= 24;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  function getCurrentTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  }

  function checkAlarms() {
    const meds = JSON.parse(localStorage.getItem("medications")) || [];
    const current = getCurrentTime();

    meds.forEach((med) => {
      if (med.nextDose === current && med.remaining > 0) {
        alert(`⏰ حان الآن موعد أخذ ${med.drugName} الساعة ${current}`);
        playSound();
        med.lastDose = current;
        med.remaining -= 1;
        med.nextDose = calcNextDose(current, med.interval);
      }
    });

    localStorage.setItem("medications", JSON.stringify(meds));
    loadMedications();
  }

  function playSound() {
    const audio = new Audio("alarm.mp3");
    audio.play().catch(() => {
      console.log("⚠ لم يتم تشغيل الصوت تلقائيًا");
    });
  }
});
