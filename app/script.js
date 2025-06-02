if (typeof currentPage !== "undefined" && currentPage === "main") {
  document
    .getElementById("kyle-busch-btn")
    .addEventListener("click", async function () {
      await toggleDriverTable("Kyle Busch", "kyle-busch-table-container");
    });

  document
    .getElementById("christopher-bell-btn")
    .addEventListener("click", async function () {
      await toggleDriverTable(
        "Christopher Bell",
        "christopher-bell-table-container"
      );
    });

  document
    .getElementById("william-byron-btn")
    .addEventListener("click", async function () {
      await toggleDriverTable("William Byron", "william-byron-table-container");
    });

  document
    .getElementById("denny-hamlin-btn")
    .addEventListener("click", async function () {
      await toggleDriverTable("Denny Hamlin", "denny-hamlin-table-container");
    });

  document
    .getElementById("ryan-blaney-btn")
    .addEventListener("click", async function () {
      await toggleDriverTable("Ryan Blaney", "ryan-blaney-table-container");
    });
}
// Function to toggle the table for a specific driver
async function toggleDriverTable(driverName, containerId) {
  const tableContainer = document.getElementById(containerId);

  if (
    tableContainer.style.display === "none" ||
    !tableContainer.style.display
  ) {
    // Fetch and display data if the table is hidden or not initialized
    const data = await loadData("INST630 Prototype Chart - Sheet2.json");

    const driverData = data.filter(
      (item) => item.Nascar_Driver_Name === driverName
    );
    console.log(data);
    console.log(driverData);

    // Display table only if data exists for the driver
    if (driverData.length > 0) {
      tableContainer.innerHTML = generateTableHTML(driverData);
      tableContainer.style.display = "block";
    } else {
      tableContainer.innerHTML = "<p>No data available for this driver.</p>";
      tableContainer.style.display = "block";
    }
  } else {
    // Hide the table if it is already displayed
    tableContainer.style.display = "none";
    tableContainer.innerHTML = "";
  }
}

// Fetch the JSON data
async function loadData(url) {
  try {
    const request = await fetch(url);
    const json = await request.json();
    return json;
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Generate the table HTML from JSON data
function generateTableHTML(data) {
  let tableHTML = "<div class='table-container'><table><tr>";
  const headers = Object.keys(data[0]);
  // Create table headers
  headers.forEach((header) => {
    tableHTML += `<th>${header}</th>`;
  });
  tableHTML += "</tr>";

  // Create rows for each entry in the JSON data
  data.forEach((item) => {
    tableHTML += "<tr>";
    headers.forEach((header) => {
      tableHTML += `<td>${item[header]}</td>`;
    });
    tableHTML += "</tr>";
  });
  tableHTML += "</table></div>";

  return tableHTML;
}

let chart;

async function createChart(driverName) {
  const data = await loadData("INST630 Prototype Chart - Sheet2.json");

  let datasets = [];
  let labels = [];

  if (driverName === "All") {
    // Group data by driver
    const drivers = [...new Set(data.map((item) => item.Nascar_Driver_Name))];

    // Determine the full range of years
    const allYears = data.map((item) => parseInt(item.Year));
    const minYear = Math.min(...allYears);
    const maxYear = Math.max(...allYears);
    const fullYearRange = Array.from(
      { length: maxYear - minYear + 1 },
      (_, i) => minYear + i
    );

    labels = fullYearRange; // Set labels to the full range of years

    drivers.forEach((driver) => {
      const driverData = data.filter(
        (item) => item.Nascar_Driver_Name === driver
      );

      // Create an array for wins with zeros for missing years
      const wins = fullYearRange.map((year) => {
        const match = driverData.find((item) => parseInt(item.Year) === year);
        return match ? match.Win : 0;
      });

      datasets.push({
        label: driver,
        data: wins,
        borderColor: getRandomColor(), // Generate a unique color for each driver
        tension: 0.4,
        fill: false,
      });
    });
  } else {
    // Filter data for the selected driver
    const driverData = data.filter(
      (item) => item.Nascar_Driver_Name === driverName
    );

    // Create an array for wins with zeros for missing years
    const allYears = data.map((item) => parseInt(item.Year));
    const minYear = Math.min(...allYears);
    const maxYear = Math.max(...allYears);
    const fullYearRange = Array.from(
      { length: maxYear - minYear + 1 },
      (_, i) => minYear + i
    );

    labels = fullYearRange; // Set labels to the full range of years

    const wins = fullYearRange.map((year) => {
      const match = driverData.find((item) => parseInt(item.Year) === year);
      return match ? match.Win : 0;
    });

    datasets = [
      {
        label: `${driverName}`,
        data: wins,
        borderColor: "black",
        backgroundColor: "red",
        tension: 0.4,
        fill: false,
      },
    ];
  }

  // Get the chart context
  const ctx = document.getElementById("winsChart").getContext("2d");

  const totalDuration = 7000;
  const delayBetweenPoints = totalDuration / data.length;
  const previousY = (ctx) =>
    ctx.index === 0
      ? ctx.chart.scales.y.getPixelForValue(100)
      : ctx.chart
          .getDatasetMeta(ctx.datasetIndex)
          .data[ctx.index - 1].getProps(["y"], true).y;
  const animation = {
    x: {
      type: "number",
      easing: "linear",
      duration: delayBetweenPoints,
      from: NaN, // the point is initially skipped
      delay(ctx) {
        if (ctx.type !== "data" || ctx.xStarted) {
          return 0;
        }
        ctx.xStarted = true;
        return ctx.index * delayBetweenPoints;
      },
    },
    y: {
      type: "number",
      easing: "linear",
      duration: delayBetweenPoints,
      from: previousY,
      delay(ctx) {
        if (ctx.type !== "data" || ctx.yStarted) {
          return 0;
        }
        ctx.yStarted = true;
        return ctx.index * delayBetweenPoints;
      },
    },
  };

  // If the chart already exists, update its data
  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets = datasets;
    chart.update();
  } else {
    // Create a new chart if it doesn't exist
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        animation,
        interaction: {
          intersect: false,
        },
        responsive: true,
        plugins: {
          legend: {
            display: true,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Year",
            },
          },
          y: {
            title: {
              display: true,
              text: "Wins",
            },
            beginAtZero: true,
          },
        },
      },
    });
  }
}

// Helper function to generate random colors
function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Add event listeners to the buttons
document.getElementById("kyleButton").addEventListener("click", () => {
  createChart("Kyle Busch");
});

document.getElementById("christopherButton").addEventListener("click", () => {
  createChart("Christopher Bell");
});

document.getElementById("williamButton").addEventListener("click", () => {
  createChart("William Byron");
});

document.getElementById("dennyButton").addEventListener("click", () => {
  createChart("Denny Hamlin");
});

document.getElementById("ryanButton").addEventListener("click", () => {
  createChart("Ryan Blaney");
});

document.getElementById("all").addEventListener("click", () => {
  createChart("All");
});

// Initialize the chart by default
createChart();

let chart2;

async function createChart2(driverName) {
  const data = await loadData("INST630 Prototype Chart - Sheet2.json");

  let datasets2 = [];
  let labels2 = [];

  if (driverName === "All") {
    // Group data by driver
    const drivers2 = [...new Set(data.map((item) => item.Nascar_Driver_Name))];

    // Determine the full range of years
    const allYears = data.map((item) => parseInt(item.Year));
    const minYear = Math.min(...allYears);
    const maxYear = Math.max(...allYears);
    const fullYearRange = Array.from(
      { length: maxYear - minYear + 1 },
      (_, i) => minYear + i
    );

    labels2 = fullYearRange; // Set labels to the full range of years

    drivers2.forEach((driver) => {
      const driverData = data.filter(
        (item) => item.Nascar_Driver_Name === driver
      );

      // Create an array for wins with zeros for missing years
      const averageFinish = fullYearRange.map((year) => {
        const match = driverData.find((item) => parseInt(item.Year) === year);
        return match ? match.AvFn : 0;
      });

      datasets2.push({
        label: driver,
        data: averageFinish,
        borderColor: getRandomColor(), // Generate a unique color for each driver
        tension: 0.4,
        fill: false,
      });
    });
  } else {
    // Filter data for the selected driver
    const driverData = data.filter(
      (item) => item.Nascar_Driver_Name === driverName
    );

    // Create an array for wins with zeros for missing years
    const allYears = data.map((item) => parseInt(item.Year));
    const minYear = Math.min(...allYears);
    const maxYear = Math.max(...allYears);
    const fullYearRange = Array.from(
      { length: maxYear - minYear + 1 },
      (_, i) => minYear + i
    );

    labels2 = fullYearRange; // Set labels to the full range of years

    const wins = fullYearRange.map((year) => {
      const match = driverData.find((item) => parseInt(item.Year) === year);
      return match ? match.AvFn : 0;
    });

    datasets2 = [
      {
        label: `${driverName}`,
        data: wins,
        borderColor: "red",
        backgroundColor: "black",
        tension: 0.4,
        fill: false,
      },
    ];
  }

  // Get the chart context
  const ctx = document.getElementById("AverageFinishChart").getContext("2d");

  const totalDuration = 7000;
  const delayBetweenPoints = totalDuration / data.length;
  const previousY = (ctx) =>
    ctx.index === 0
      ? ctx.chart.scales.y.getPixelForValue(100)
      : ctx.chart
          .getDatasetMeta(ctx.datasetIndex)
          .data[ctx.index - 1].getProps(["y"], true).y;
  const animation = {
    x: {
      type: "number",
      easing: "linear",
      duration: delayBetweenPoints,
      from: NaN, // the point is initially skipped
      delay(ctx) {
        if (ctx.type !== "data" || ctx.xStarted) {
          return 0;
        }
        ctx.xStarted = true;
        return ctx.index * delayBetweenPoints;
      },
    },
    y: {
      type: "number",
      easing: "linear",
      duration: delayBetweenPoints,
      from: previousY,
      delay(ctx) {
        if (ctx.type !== "data" || ctx.yStarted) {
          return 0;
        }
        ctx.yStarted = true;
        return ctx.index * delayBetweenPoints;
      },
    },
  };

  // If the chart already exists, update its data
  if (chart2) {
    chart2.data.labels = labels2;
    chart2.data.datasets = datasets2;
    chart2.update();
  } else {
    // Create a new chart if it doesn't exist
    chart2 = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels2,
        datasets: datasets2,
      },
      options: {
        animation,
        interaction: {
          intersect: false,
        },
        responsive: true,
        plugins: {
          legend: {
            display: true,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Year",
            },
          },
          y: {
            title: {
              display: true,
              text: "Average Finish",
            },
            beginAtZero: true,
          },
        },
      },
    });
  }
}

// Helper function to generate random colors
function getRandomColor2() {
  const letters2 = "0123456789ABCDEF";
  let color2 = "#";
  for (let i = 0; i < 6; i++) {
    color2 += letters2[Math.floor(Math.random() * 16)];
  }
  return color2;
}

// Add event listeners to the buttons
document.getElementById("kyleButton2").addEventListener("click", () => {
  createChart2("Kyle Busch");
});

document.getElementById("christopherButton2").addEventListener("click", () => {
  createChart2("Christopher Bell");
});

document.getElementById("williamButton2").addEventListener("click", () => {
  createChart2("William Byron");
});

document.getElementById("dennyButton2").addEventListener("click", () => {
  createChart2("Denny Hamlin");
});

document.getElementById("ryanButton2").addEventListener("click", () => {
  createChart2("Ryan Blaney");
});

document.getElementById("all2").addEventListener("click", () => {
  createChart2("All");
});

// Initialize the chart by default
createChart2();
