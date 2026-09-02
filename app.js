document.addEventListener("DOMContentLoaded", () => {
  
  // 1. FECHA Y CAMBIO DE PESTAÑAS
  const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById("fecha-actual").textContent = new Date().toLocaleDateString('es-ES', opcionesFecha);

  window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(sec => sec.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`sec-${tabName}`).classList.add('active');
  };

  // 2. TEMAS Y PRIVACIDAD
  window.setTheme = function(themeClass) {
    document.body.className = themeClass;
    localStorage.setItem("tema_app", themeClass);
  };
  const savedTheme = localStorage.getItem("tema_app") || "theme-navy";
  setTheme(savedTheme);

  document.getElementById("toggle-privacy").addEventListener("click", () => {
    document.querySelectorAll(".privacy-blur").forEach(el => el.classList.toggle("blurred"));
  });

  // 3. FINANZAS Y AHORRO MENSUAL
  let gastos = JSON.parse(localStorage.getItem("gastos_ejecutivos")) || [];
  let ingresoMensual = parseFloat(localStorage.getItem("ingreso_mensual")) || 0;
  
  const totalElem = document.getElementById("total-gastado");
  const ahorroElem = document.getElementById("ahorro-monto");
  const listaGastos = document.getElementById("lista-gastos");
  const budgetProgress = document.getElementById("budget-progress");
  const budgetPercent = document.getElementById("budget-percent");
  const presupuestoMensual = 1500;
  let chartInstance = null;

  window.guardarIngreso = function() {
    const val = parseFloat(document.getElementById("input-ingreso").value) || 0;
    ingresoMensual = val;
    localStorage.setItem("ingreso_mensual", ingresoMensual);
    actualizarFinanzas();
    document.getElementById("input-ingreso").value = "";
  };

  function actualizarFinanzas() {
    listaGastos.innerHTML = "";
    let totalGastos = 0;
    const totalesPorCat = {};

    gastos.slice().reverse().forEach((gasto) => {
      totalGastos += parseFloat(gasto.monto);
      totalesPorCat[gasto.categoria] = (totalesPorCat[gasto.categoria] || 0) + parseFloat(gasto.monto);

      const li = document.createElement("li");
      li.innerHTML = `
        <div>
          <strong>${gasto.categoria}</strong>
          <div style="font-size:0.7rem; color:#8D99AE">${gasto.fecha}</div>
        </div>
        <span style="color:var(--accent-color); font-weight:bold;">-${parseFloat(gasto.monto).toFixed(2)} €</span>
      `;
      listaGastos.appendChild(li);
    });

    totalElem.textContent = `${totalGastos.toFixed(2)} €`;

    // Cálculo del ahorro mensual
    const capitalAhorrado = ingresoMensual - totalGastos;
    ahorroElem.textContent = `${capitalAhorrado.toFixed(2)} €`;

    // Presupuesto
    const porcentaje = Math.min((totalGastos / presupuestoMensual) * 100, 100).toFixed(0);
    budgetProgress.style.width = `${porcentaje}%`;
    budgetPercent.textContent = `${porcentaje}%`;

    localStorage.setItem("gastos_ejecutivos", JSON.stringify(gastos));
    actualizarGrafico(totalesPorCat);
  }

  document.getElementById("gasto-form").addEventListener("submit", (e) => {
    e.preventDefault();
    gastos.push({
      monto: document.getElementById("monto").value,
      categoria: document.getElementById("categoria").value,
      fecha: new Date().toLocaleDateString('es-ES')
    });
    actualizarFinanzas();
    e.target.reset();
  });

  function actualizarGrafico(datosCategorias) {
    const ctx = document.getElementById('chart-gastos').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(datosCategorias),
        datasets: [{
          data: Object.values(datosCategorias),
          backgroundColor: ['#C5A880', '#3A506B', '#457B9D', '#E63946', '#2A9D8F'],
          borderWidth: 0
        }]
      },
      options: { plugins: { legend: { labels: { color: '#FFF', font: { size: 9 } } } } }
    });
  }

  window.exportarCSV = function() {
    let csv = "Fecha,Categoria,Monto\n";
    gastos.forEach(g => { csv += `"${g.fecha}","${g.categoria}",${g.monto}\n`; });
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'gastos.csv';
    a.click();
  };

  // 4. CALENDARIO, RECORDATORIOS E ICAL
  let currentDate = new Date();
  let recordatorios = JSON.parse(localStorage.getItem("recordatorios_ejecutivos")) || [];

  function renderCalendar() {
    const daysContainer = document.getElementById("calendar-days");
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    document.getElementById("calendar-month-year").textContent = `${new Date(year, month).toLocaleString('es', {month:'long'})} ${year}`;

    daysContainer.innerHTML = "";
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const startingPoint = firstDay === 0 ? 6 : firstDay - 1;

    for (let i = 0; i < startingPoint; i++) daysContainer.appendChild(document.createElement("div"));
    
    const today = new Date();
    for (let i = 1; i <= lastDate; i++) {
      const dayDiv = document.createElement("div");
      dayDiv.textContent = i;
      if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) dayDiv.classList.add("today");
      daysContainer.appendChild(dayDiv);
    }
  }

  window.changeMonth = (dir) => { currentDate.setMonth(currentDate.getMonth() + dir); renderCalendar(); };

  function actualizarRecordatorios() {
    const listaRem = document.getElementById("lista-recordatorios");
    listaRem.innerHTML = "";
    recordatorios.forEach((r, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div>
          <span>${r.texto}</span>
          <div style="font-size:0.7rem; color:#8D99AE">${new Date(r.fecha).toLocaleString('es')}</div>
        </div>
        <button onclick="exportarICal('${r.texto}', '${r.fecha}')" class="btn-small">📅 iCal</button>
      `;
      listaRem.appendChild(li);
    });
    localStorage.setItem("recordatorios_ejecutivos", JSON.stringify(recordatorios));
  }

  document.getElementById("reminder-form").addEventListener("submit", (e) => {
    e.preventDefault();
    recordatorios.push({
      texto: document.getElementById("rem-text").value,
      fecha: document.getElementById("rem-date").value
    });
    actualizarRecordatorios();
    e.target.reset();
  });

  // Exportar evento individual a iCal / Apple Calendar / Google Calendar
  window.exportarICal = function(titulo, fechaStr) {
    const fecha = new Date(fechaStr);
    const isoStr = fecha.toISOString().replace(/-|:|\.\d+/g, '');
    const icsData = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${titulo}\nDTSTART:${isoStr}\nEND:${isoStr}\nEND:VEVENT\nEND:VCALENDAR`;
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([icsData], { type: 'text/calendar' }));
    a.download = 'evento.ics';
    a.click();
  };

  // 5. MATRIZ DE EISENHOWER
  let eisenTasks = JSON.parse(localStorage.getItem("eisen_tasks")) || [];

  function renderEisenhower() {
    ['q1', 'q2', 'q3', 'q4'].forEach(q => document.getElementById(`list-${q}`).innerHTML = "");
    eisenTasks.forEach(t => {
      const li = document.createElement("li");
      li.textContent = `• ${t.text}`;
      document.getElementById(`list-${t.type}`).appendChild(li);
    });
    localStorage.setItem("eisen_tasks", JSON.stringify(eisenTasks));
  }

  document.getElementById("eisen-form").addEventListener("submit", (e) => {
    e.preventDefault();
    eisenTasks.push({ text: document.getElementById("eisen-text").value, type: document.getElementById("eisen-type").value });
    renderEisenhower();
    e.target.reset();
  });

  // 6. POMODORO
  let pomoTime = 25 * 60;
  let pomoInterval = null;

  window.startPomodoro = function() {
    if (pomoInterval) return;
    pomoInterval = setInterval(() => {
      if (pomoTime > 0) {
        pomoTime--;
        const mins = String(Math.floor(pomoTime / 60)).padStart(2, '0');
        const secs = String(pomoTime % 60).padStart(2, '0');
        document.getElementById("pomo-timer").textContent = `${mins}:${secs}`;
      } else {
        clearInterval(pomoInterval);
        alert("¡Tiempo de Enfoque Completado!");
      }
    }, 1000);
  };
  window.pausePomodoro = () => { clearInterval(pomoInterval); pomoInterval = null; };
  window.resetPomodoro = () => { pausePomodoro(); pomoTime = 25 * 60; document.getElementById("pomo-timer").textContent = "25:00"; };

  // 7. GIMNASIO & CALORÍAS
  let gymList = JSON.parse(localStorage.getItem("gym_tasks")) || [];
  let meals = JSON.parse(localStorage.getItem("cal_meals")) || [];

  function renderGym() {
    const ul = document.getElementById("gym-list");
    ul.innerHTML = "";
    gymList.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = item.done ? "done" : "";
      li.innerHTML = `<span>${item.text}</span>`;
      li.addEventListener("click", () => {
        gymList[index].done = !gymList[index].done;
        renderGym();
      });
      ul.appendChild(li);
    });
    localStorage.setItem("gym_tasks", JSON.stringify(gymList));
  }

  document.getElementById("gym-form").addEventListener("submit", (e) => {
    e.preventDefault();
    gymList.push({ text: document.getElementById("gym-exercise").value, done: false });
    renderGym();
    e.target.reset();
  });

  function renderCalories() {
    const ul = document.getElementById("cal-list");
    ul.innerHTML = "";
    let total = 0;
    meals.forEach(m => {
      total += parseInt(m.cal);
      const li = document.createElement("li");
      li.innerHTML = `<span>${m.name}</span><strong>${m.cal} kcal</strong>`;
      ul.appendChild(li);
    });
    document.getElementById("total-cal").textContent = `${total} / 2500 kcal`;
    localStorage.setItem("cal_meals", JSON.stringify(meals));
  }

  document.getElementById("cal-form").addEventListener("submit", (e) => {
    e.preventDefault();
    meals.push({ name: document.getElementById("food-name").value, cal: document.getElementById("food-cal").value });
    renderCalories();
    e.target.reset();
  });

  // CALCULADORA
  const calcTotal = document.getElementById("calc-total"), calcPeople = document.getElementById("calc-people"), calcTip = document.getElementById("calc-tip");
  function calcularPropina() {
    const total = parseFloat(calcTotal.value) || 0, personas = parseInt(calcPeople.value) || 1, tip = parseFloat(calcTip.value) || 0;
    document.getElementById("calc-per-person").textContent = `${((total + (total * (tip / 100))) / personas).toFixed(2)} €`;
  }
  [calcTotal, calcPeople, calcTip].forEach(e => e.addEventListener("input", calcularPropina));

  // Inicialización
  actualizarFinanzas();
  renderCalendar();
  actualizarRecordatorios();
  renderEisenhower();
  renderGym();
  renderCalories();
});
