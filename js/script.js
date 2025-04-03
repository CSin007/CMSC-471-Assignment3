console.log('Script loaded!');

d3.csv("data/Allegations.csv").then(function(data) {
  // Retain this logic for later if needed
  const dispositionMap = (d) => {
    const val = d["board_disposition"] || "";
    return val.startsWith("Substantiated") 
      ? val.replace("Substantiated", "").trim()
      : "Cleared";
  };

  // Filter out 2020
  const filteredData = data.filter(d => d.year_received !== "2020");

  // Group by year_received
  const complaintsByYear = d3.rollups(
    filteredData,
    v => v.length,
    d => d.year_received
  ).sort((a, b) => +a[0] - +b[0]);

  // Reverse years for black hat downward trend
  const reversedYears = complaintsByYear.map(d => d[0]).reverse();

  // Dimensions
  const barWidth = 1200;
  const barHeight = 500;
  const margin = { top: 70, right: 30, bottom: 70, left: 70 };

  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", barWidth)
    .attr("height", barHeight)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const x = d3.scaleBand()
    .domain(reversedYears)
    .range([0, barWidth - margin.left - margin.right])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(complaintsByYear, d => d[1])])
    .nice()
    .range([barHeight - margin.top - margin.bottom, 0]);

  // X-axis
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${barHeight - margin.top - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end")
    .style("fill", "black");

  // Y-axis
  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .style("fill", "black");

  // Bars
  svg.selectAll(".bar")
    .data(complaintsByYear)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", d => barHeight - margin.top - margin.bottom - y(d[1]))
    .attr("fill", "#1f77b4");

  // Black axis lines
  svg.selectAll(".tick line").style("stroke", "black");
  svg.selectAll(".domain").style("stroke", "black");

   

  svg.append("text")
    .attr("x", (barWidth - margin.left - margin.right)/3 )
    .attr("y", -5)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("fill", "green")
    .text("");
});
