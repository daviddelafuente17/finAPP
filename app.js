document.addEventListener("DOMContentLoaded", () => {
  
  // 1. FECHA Y NAVEGACIÓN DE PESTAÑAS
  const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById("fecha-actual").textContent = new Date().toLocaleDateString('es-ES', opcionesFecha);

  window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(sec => sec.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(`sec-${tabName}`).classList.add('active');
  };

  // 2. MODO PRIVACIDAD
  const toggleBtn = document.getElementById("toggle-privacy");
  const totalElem = document.getElementById("total-gastado");
  toggleBtn.addEventListener("click", () => {
    totalElem.classList.toggle("blurred");
  });

  // 3. GESTIÓN DE GASTOS Y LOCALSTORAGE
  let gastos = JSON.parse(localStorage.getItem("gastos_ejecutivos")) || [];
  const formGasto = document.getElementById("gasto-form");
  const listaGastos = document.getElementById("lista-gastos");
  const budgetProgress = document.getElementById("budget-progress");
  const budgetPercent = document.getElementById("budget-percent");
  
  const presupuestoMensual = 1500; // Presupuesto objetivo

  let chartInstance = null;

  function actualizarFinanzas() {
    listaGastos.innerHTML = "";
    let total = 0;
    const totalesPorCat = {};

    gastos.slice().reverse().forEach((gasto, index) => {
      total += parseFloat(gasto.monto);
      
      // Conteo por categorías para el gráfico
      totalesPorCat[gasto.categoria] = (totalesPorCat[gasto.categoria] || 0) + parseFloat(gasto.monto);

      const li = document.createElement("li");
      li.innerHTML = `
        <div>
          <strong>${gasto.categoria}</strong>
          <div style="font-size:0.7rem; color:#8D99AE">${gasto.fecha}</div>
        </div>
        <span style="color:#C5A880; font-weight:bold;">-${parseFloat(gasto.monto).toFixed(2)} €</span>
      `;
      listaGastos.appendChild(li);
    });

    totalElem.textContent = `${total.toFixed(2)} €`;

    // Actualizar barra de presupuesto
    const porcentaje = Math.min((total / presupuestoMensual) * 100, 100).toFixed(0);
    budgetProgress.style.width = `${porcentaje}%`;
    budgetPercent.textContent = `${porcentaje}%`;
    
    if (total > presupuestoMensual) {
      budgetProgress.style.backgroundColor = "#E63946"; // Rojo alerta si sobrepasa
    } else {
      budgetProgress.style.backgroundColor = "#C5A880";
    }

    localStorage.setItem("gastos_ejecutivos", JSON.stringify(gastos));
    actualizarGrafico(totalesPorCat);
  }

  formGasto.addEventListener("submit", (e) => {
    e.preventDefault();
    const monto = document.getElementById("monto").value;
    const categoria = document.getElementById("categoria").value;

    gastos.push({
      monto,
      categoria,
      fecha: new Date().toLocaleDateString('es-ES')
    });

    actualizarFinanzas();
    formGasto.reset();
  });

  // 4. GRÁFICO CHART.JS (DONUT)
  function actualizarGrafico(datosCategorias) {
    const ctx = document.getElementById('chart-gastos').getContext('2d');
    
    const labels = Object.keys(datosCategorias);
    const data = Object.values(datosCategorias);

    if (chartInstance) {
      chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ['#C5A880', '#3A506B', '#457B9D', '#E63946', '#2A9D8F'],
          borderWidth: 0
        }]
      },
      options: {
        plugins: {
          legend: { labels: { color: '#FFF', font: { family: 'Montserrat', size: 10 } } }
        }
      }
    });
  }

  // EXPORTAR A CSV
  window.exportarCSV = function() {
    let csv = "Fecha,Categoria,Monto\n";
    gastos.forEach(g => {
      csv += `"${g.fecha}","${g.categoria}",${g.monto}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gastos_ejecutivos.csv';
    a.click();
  };

  // 5. CALENDARIO Y RECORDATORIOS
  let currentDate = new Date();
  let recordatorios = JSON.parse(localStorage.getItem("recordatorios_ejecutivos")) || [];

  function renderCalendar() {
    const monthYear = document.getElementById("calendar-month-year");
    const daysContainer = document.getElementById("calendar-days");
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    monthYear.textContent = `${meses[month]} ${year}`;

    daysContainer.innerHTML = "";

    // Días vacíos previos
    const startingPoint = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < startingPoint; i++) {
      daysContainer.appendChild(document.createElement("div"));
    }

    // Días del mes
    const today = new Date();
    for (let i = 1; i <= lastDate; i++) {
      const dayDiv = document.createElement("div");
      dayDiv.textContent = i;
      
      if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
        dayDiv.classList.add("today");
      }
      daysContainer.appendChild(dayDiv);
    }
  }

  window.changeMonth = function(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
  };

  const formRem = document.getElementById("reminder-form");
  const listaRem = document.getElementById("lista-recordatorios");

  function actualizarRecordatorios() {
    listaRem.innerHTML = "";
    recordatorios.forEach((r, i) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${r.texto}</span>
        <span style="color:#C5A880; font-size:0.75rem">${r.fecha}</span>
      `;
      listaRem.appendChild(li);
    });
    localStorage.setItem("recordatorios_ejecutivos", JSON.stringify(recordatorios));
  }

  formRem.addEventListener("submit", (e) => {
    e.preventDefault();
    const texto = document.getElementById("rem-text").value;
    const fecha = document.getElementById("rem-date").value;
    
    recordatorios.push({ texto, fecha });
    actualizarRecordatorios();
    formRem.reset();
  });

  // 6. CALCULADORA DE PROPINAS / CUENTAS
  const calcTotal = document.getElementById("calc-total");
  const calcPeople = document.getElementById("calc-people");
  const calcTip = document.getElementById("calc-tip");
  const calcPerPerson = document.getElementById("calc-per-person");

  function calcularPropina() {
    const total = parseFloat(calcTotal.value) || 0;
    const personas = parseInt(calcPeople.value) || 1;
    const propinaPct = parseFloat(calcTip.value) || 0;

    const totalConPropina = total + (total * (propinaPct / 100));
    const porPersona = totalConPropina / personas;

    calcPerPerson.textContent = `${porPersona.toFixed(2)} €`;
  }

  [calcTotal, calcPeople, calcTip].forEach(elem => elem.addEventListener("input", calcularPropina));

  // Inicializar todo
  actualizarFinanzas();
  renderCalendar();
  actualizarRecordatorios();
});