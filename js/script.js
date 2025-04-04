console.log('Script loaded!');

d3.csv("./data/allegations.csv").then(function(data) {
  // Filter data
  const excludedYears = ['2016', '2007', '2020'];
const filteredData = data.filter(d => {
  const year = d.year_received.trim();
  const yearNum = Number(year);
  return (
    year !== '' &&
    !isNaN(yearNum) &&
    yearNum >= 2000 &&
    !excludedYears.includes(year)
  );
});


  // Group by year_received
  const complaintsByYear = d3.rollups(
    filteredData,
    v => v.length,
    d => d.year_received
  ).sort((a, b) => +a[0] - +b[0]);

  const reversedYears = complaintsByYear.map(d => d[0]).reverse();

  // Dimensions
  const margin = { top: 70, right: 30, bottom: 70, left: 70 };
  const barHeight = 500;
  const barWidthPerYear = 50;
  const chartWidth = reversedYears.length * barWidthPerYear + margin.left + margin.right;

  // Create SVG
  const svg = d3.select("#chart")
    .append("svg")
    .attr("width", chartWidth)
    .attr("height", barHeight)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // X-axis
  const x = d3.scaleBand()
    .domain(reversedYears)
    .range([0, chartWidth - margin.left - margin.right])
    .padding(0.2);

  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${barHeight - margin.top - margin.bottom})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-65)")
    .style("text-anchor", "end")
    .style("font-size", "10px")
    .style("fill", "black");

  // Y-axis
  const y = d3.scaleLinear()
    .domain([0, d3.max(complaintsByYear, d => d[1])])
    .nice()
    .range([barHeight - margin.top - margin.bottom, 0]);

  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y))
    .selectAll("text")
  .attr("x", -25)  // Pushes labels 10px to the left
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

  // Axis and border lines
  svg.selectAll(".tick line").style("stroke", "black");
  svg.selectAll(".domain").style("stroke", "black");

 
});
