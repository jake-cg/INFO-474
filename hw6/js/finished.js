'use strict';

(function() {

  let data = "no data";
  let filtered = "";
  let svgContainer = ""; // keep SVG reference in global scope
  let scatterContainer = "";

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("data.csv")
      .then((data) => makeScatterPlot(data));
  }

  // make scatter plot with trend line
  function makeScatterPlot(csvData) {
    data = csvData // assign data as global variable

    // get arrays of fertility rate data and life Expectancy data
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));
    let population_data = data.map((row) => parseFloat(row["pop_mlns"]));
    let time_data = data.map((row) => parseFloat(row["time"]));



    // find data limits
    let axesLimits = findMinMax(time_data, population_data);

    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "time", "pop_mlns", svgContainer, 50, 450, 50, 450);

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels();
  }

  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 100)
      .attr('y', 40)
      .style('font-size', '14pt')
      .text("Countries by Life Expectancy and Fertility Rate");

    svgContainer.append('text')
      .attr('x', 240)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Time');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Population (in millions)');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // mapping functions
    let xMap = map.x;
    let yMap = map.y;

    // make tooltip
    

    filtered = data.filter(function (el) {
      return el.location == "AUS";
    });
    draw(filtered, map)

    var dropDown = d3.select('body')
      .append('select')
      .attr('id', 'dropdown')
      .on('change', function() {
        var selected = this.value;
        filtered = data.filter(country => country.location == selected)
        var thisObject = data.filter(country => country.location == selected)[0];
        draw(filtered, map)
      });
    
    const unique = [...new Set(data.map(item => item.location))];

    var newArray = data.filter(function (el) {
      return el.location == unique[0];
    });

    var options = dropDown.selectAll('option')
      .data(unique)
      .enter()
        .append('option')
        .text((d) => { return d; });

      let db = document.getElementById('dropdown')
      let select = db.options[db.selectedIndex].text

      newArray = data.filter(function (el) {
        return el.location == select;
      });

      filtered = newArray;  
    }
  function draw(data, map){

    svgContainer.selectAll("circle").remove()
    svgContainer.selectAll("path.trend").remove()


    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    scatterContainer = div.append('svg')
      .attr('width', 300)
      .attr('height', 300);


    let circles = svgContainer.selectAll('.dot')
    .data(data)
    .enter()
    .append('circle')
      .attr('cx', (d) => map.xScale(d.time))
      .attr('cy',(d) => map.yScale(d["pop_mlns"]))
      .attr('r', 3)
      .attr('fill', "#4286f4")
      .on("mouseover", (d) => {
        makeScatterGraph(d["location"])
        div.transition()
        .duration(200)
        .style("opacity", .9)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });

    let path = svgContainer.append("path")
        .datum(filtered)
        .attr("fill", "none")
        .attr("class", "trend")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", d3.line()
          .x(function(d) { return map.xScale(d.time) })
          .y(function(d) { return map.yScale(d['pop_mlns']) })
        )  

      return circles;
  }

  function makeScatterGraph(country) {
    scatterContainer.html("");

    let fertility_rate_data = data.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));
    
    let minMax = findMinMax(fertility_rate_data, life_expectancy_data);

    let funcs = drawAxes(minMax, "fertility_rate", "life_expectancy", scatterContainer, 50, 200, 30, 200);
    //{min: minMax.xMin, max: minMax.xMax}, {min: minMax.yMin, max: minMax.yMax}
    plotScatterGraph(funcs, data, country);
  }

  
  function plotScatterGraph(funcs, countryData, country) {
    let cdata = countryData.filter(function (el) {
      return el.location == country;
    });

    scatterContainer.selectAll('.dot')
      .data(cdata)
      .enter()
      .append('circle')
      .attr("fill", "#4286f4")
      .attr("r", "2")
      .attr("cx", (d) => funcs.x(d))
      .attr("cy", (d) => funcs.y(d))

      scatterContainer.append('text')
      .attr('x', 100)
      .attr('y', 230)
      .style('font-size', '8pt')
      .text('Fertility Rate');

      scatterContainer.append('text')
      .attr('x', 120)
      .attr('y', 30)
      .style('font-size', '13pt')
      .text(country);

      scatterContainer.append('text')
      .attr('transform', 'translate(15, 175)rotate(-90)')
      .style('font-size', '8pt')
      .text('Life Expectancy (years)');

  }

  // draw the axes and ticks
  function drawAxes(limits, x, y, svg, x1, x2, y1, y2) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([x1, x2]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale).ticks(4);
    svg.append("g")
      .attr('transform', 'translate(0, '+x2+')')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([y1, y2]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();
