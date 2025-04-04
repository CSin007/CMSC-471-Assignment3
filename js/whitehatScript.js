
   
(async function() {

  const chartContainer = document.getElementById('chart');
  const complainantGenderFilter = document.getElementById('complainant-gender-filter');
  const officerGenderFilter = document.getElementById('officer-gender-filter');
  
  // State variables
  let rawData = [];
  let filteredData = [];
  let bubbleData = [];
  
  // Create tooltip div
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
  
  try {
    // Use d3.csv to parse the data
    d3.csv("./data/allegations.csv")
      .then((data) => {
        // Convert string values to appropriate types
        rawData = data.map(d => {
          // Convert numeric fields to numbers
          const numericFields = ['mos_age_incident', 'complainant_age_incident', 'year_received', 'year_closed'];
          numericFields.forEach(field => {
            if (d[field]) d[field] = +d[field];
          });
          return d;
        });
        
        applyFilters();
        renderChart();

      })
      .catch(error => console.error('Error parsing data:', error));
  } catch (error) {
    chartContainer.innerHTML = `<div class="error">Error loading file: ${error}</div>`;
  }
  
  // Event listeners for filters
  complainantGenderFilter.addEventListener('change', function() {
    applyFilters();
    renderChart();

  });
  
  officerGenderFilter.addEventListener('change', function() {
    applyFilters();
    renderChart();

  });
  
  document.getElementById('fado-filter').addEventListener('change', function() {
    applyFilters();
    renderChart();

  });
  
  // Apply filters and transform data
  function applyFilters() {
    const complainantGender = complainantGenderFilter.value;
    const officerGender = officerGenderFilter.value;
    const fadoType = document.getElementById('fado-filter').value;
    
    // Filter data based on selected criteria
    filteredData = rawData.filter(record => {
      // Filter by selected FADO type
      if (record.fado_type !== fadoType) return false;
      
      // Apply gender filters if not "all"
      if (complainantGender !== 'all' && record.complainant_gender !== complainantGender) return false;
      if (officerGender !== 'all' && record.mos_gender !== officerGender) return false;
      
      // Ensure we have race data for both parties
      return record.complainant_ethnicity && record.mos_ethnicity;
    });
    
    // Normalize and standardize race categories
    const normalizeRace = (race) => {
      
      race = race.trim();
      
      // Map various race descriptions to standardized categories
      if (race.includes('Asian') || race === 'Asian/Pacific Islander') return 'Asian';
      if (race.includes('White')) return 'White';
      if (race.includes('Black')) return 'Black';
      if (race.includes('Hispanic')) return 'Hispanic';
      
      return 'Other Race';
    };
    
    // Apply race normalization
    filteredData = filteredData.map(record => ({...record,
      normalized_complainant_ethnicity: normalizeRace(record.complainant_ethnicity),
      normalized_mos_ethnicity: normalizeRace(record.mos_ethnicity)
    }));
    
    // Group by officer and complainant ethnicity
    const groupedData = {};
    
    filteredData.forEach(record => {
      const key = `${record.normalized_mos_ethnicity}|${record.normalized_complainant_ethnicity}`;
      
      if (!groupedData[key]) {
        groupedData[key] = {
          mos_ethnicity: record.normalized_mos_ethnicity,
          complainant_ethnicity: record.normalized_complainant_ethnicity,
          count: 0,
          complaints: []
        };
      }
      
      groupedData[key].count++;
      groupedData[key].complaints.push(record);
    });
    
    // Transform into array for D3
    bubbleData = Object.values(groupedData);
  }
  
  // Render the bubble chart
  function renderChart() {
    // Clear previous chart
    d3.select("#chart").selectAll("*").remove();
    
   
    
    // Unique race categories for scales
    const raceCategories = Array.from(new Set([ ...bubbleData.map(d => d.mos_ethnicity), ...bubbleData.map(d => d.complainant_ethnicity)
])).sort();
    
    // chart dimensions
    const margin = {top: 60, right: 40, bottom: 60, left: 100};
    const width = chartContainer.clientWidth - margin.left - margin.right;
    const height = chartContainer.clientHeight - margin.top - margin.bottom;
    
    // Create SVG
    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Set up scales
    const xScale = d3.scaleBand()
      .domain(raceCategories)
      .range([0, width])
      .padding(0.1);
    
    const yScale = d3.scaleBand()
      .domain(raceCategories)
      .range([0, height])
      .padding(0.1);
    
    const radiusScale = d3.scaleSqrt()
      .domain([0, d3.max(bubbleData, d => d.count)])
      .range([5, 50]);
    
    const colorScale = d3.scaleOrdinal()
      .domain(raceCategories)
      .range(d3.schemeCategory10);
    
    // Add X axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");
    
    // Add Y axis
    svg.append("g")
      .call(d3.axisLeft(yScale));
    
    // Add X axis label
    svg.append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 5)
      .text("Complainant Ethnicity");
    
    // Add Y axis label
    svg.append("text")
      .attr("class", "axis-label")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 30)
      .text("Officer Ethnicity");
    
    // Add title
    svg.append("text")
      .attr("class", "chart-title")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", -30)
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text("Complaints by Officer and Complainant Ethnicity");
    
    // Add grid lines
    svg.selectAll("line.horizontalGrid")
      .data(raceCategories)
      .enter()
      .append("line")
      .attr("class", "horizontalGrid")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => yScale(d) + yScale.bandwidth())
      .attr("y2", d => yScale(d) + yScale.bandwidth())
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1);
    
    svg.selectAll("line.verticalGrid")
      .data(raceCategories)
      .enter()
      .append("line")
      .attr("class", "verticalGrid")
      .attr("y1", 0)
      .attr("y2", height)
      .attr("x1", d => xScale(d) + xScale.bandwidth())
      .attr("x2", d => xScale(d) + xScale.bandwidth())
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1);
    
    // Add the bubbles
    svg.selectAll("circle")
      .data(bubbleData)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.complainant_ethnicity) + xScale.bandwidth() / 2)
      .attr("cy", d => yScale(d.mos_ethnicity) + yScale.bandwidth() / 2)
      .attr("r", d => radiusScale(d.count))
      .attr("fill", d => colorScale(d.mos_ethnicity))
      .attr("fill-opacity", 0.7)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke", "#000")
          .attr("stroke-width", 2);
        
        tooltip.html(`
          <h3>${d.mos_ethnicity} Officer / ${d.complainant_ethnicity} Complainant</h3>
          <p><strong>Number of Complaints:</strong> ${d.count}</p>
          <p><strong>Percentage of Total:</strong> ${(d.count / filteredData.length * 100).toFixed(1)}%</p>
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
          .transition()
          .duration(200)
          .style("opacity", 0.9);
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1);
        
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });
    
    // Add count labels to bubbles
    svg.selectAll("text.count")
      .data(bubbleData.filter(d => d.count >= 16)) // Only add text to larger bubbles
      .enter()
      .append("text")
      .attr("class", "count")
      .attr("x", d => xScale(d.complainant_ethnicity) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.mos_ethnicity) + yScale.bandwidth() / 2 + 5)
      .attr("text-anchor", "middle")
      .style("fill", "white")
      .style("font-weight", "bold")
      .style("font-size", "12px")
      .text(d => d.count);
  }
  
})(); 

