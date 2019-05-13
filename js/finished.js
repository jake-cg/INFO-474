'use strict';

(function() {

  let data = ""; // keep data in global scope
  let svgContainer = ""; // keep SVG reference in global scope

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 750)
      .attr('height', 500);
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("data.csv")
      .then((csvData) => makeBarPlot(csvData));
  }

  // make scatter plot with trend line
  function makeBarPlot(csvData) {
    data = csvData;

    let seasons = data.map((row) => parseInt(row["Year"]));

    let viewers = data.map((row) => parseFloat(row["Avg. Viewers (mil)"]));

    let axesLimits = findMinMax(seasons, viewers);

    // draw axes with ticks and return mapping and scaling functions
    let mapFunctions = drawTicks(axesLimits);

    // plot the data using the mapping and scaling functions
    plotData(mapFunctions);

    // plot the trend line using gre scores, admit rates, axes limits, and
    // scaling + mapping functions
    
    plotAverageLine(seasons, viewers, axesLimits, mapFunctions);

    makeLabels();
  }

  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 240)
      .attr('y', 40)
      .style('font-size', '14pt')
      .style('font-weight', 'bold')
      .style('font-family', 'Arial')
      .text("Average Viewership by Season");

    svgContainer.append('text')
      .attr('x', 335)
      .attr('y', 495)
      .style('font-size', '10pt')
      .style('font-weight', 'bold')
      .style('font-family', 'Arial')
      .text('Year of Release');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 375)rotate(-90)')
      .style('font-size', '10pt')
      .style('font-weight', 'bold')
      .style('font-family', 'Arial')
      .text('Average Number of Viewers (in millions)');
  }

  // plot all the data points on the SVG
  function plotData(map) {
    let xMap = map.x;
    let yMap = map.y;

    let width = 20

    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


    svgContainer.selectAll(".rect")
      .data(data)
      .enter()
      .append("rect")
        .attr("x", xMap)
        .attr("y", yMap)
        .attr("fill", function(d){return d.Data == "Actual" ? "#7f7fff" : "#cd5c5c"})

        .attr("width", width)
        .attr("height", function(d){
          return 450 - yMap(d)
        })
        .attr("stroke", "rgb(10,10,10)")
        .on("mouseover", (d) => {
          div.transition()
            .duration(200)
            .style("opacity", .9);
          div.html("<h2>Season #" + d.Year + "</h2>"
          + "<br/><div style='float:left'>Year:</div><div style='margin-left:150px'>" + d.Year + "</div>"
          + "<div style='float:left'>Episodes:</div><div style='margin-left:150px'>" + d.Episodes + "</div>"                           
          + "<div style='float:left'>Average Viewers (mil):</div><div style='margin-left:150px'>" + d["Avg. Viewers (mil)"] + "</div>"                           
          + "<br/><div style='float:left'>Most watched episode:</div><div style='margin-left:150px'>" + d["Most watched episode"] + "</div>"                           
          + "<div style='float:left'>Viewers (mil):</div><div style='margin-left:150px'>" + d["Viewers (mil)"] + "</div>")
            .attr("class", "season tooltip")
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
            
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        });

    svgContainer.selectAll(".rect").data(data).enter().append("text")
        .text(function(d){return d["Avg. Viewers (mil)"]})
        .attr("x", xMap)
        .attr("y", function(d) {return yMap(d) - 5})
        .attr("style", "font-size:11.5px; font-weight:bold; font-family:Arial")

    // add legend

    var legend = svgContainer.append("g")
    .attr("class", "legend")
    .attr("x", 750 - 65)
    .attr("y", 50)
    .attr("height", 100)
    .attr("width", 100);

    legend.append("rect")
      .attr("x", 615)
      .attr("y", 55)
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", "#7f7fff")
    
    legend.append("text")
      .attr("x", 630)
      .attr("y", 65)
      .attr("height",30)
      .attr("width",100)
      .style('font-size', '10pt')
      .style('font-weight', 'bold')
      .style('font-family', 'Arial')
      .text("Actual");

    legend.append("rect")
      .attr("x", 615)
      .attr("y", 75)
      .attr("width", 10)
      .attr("height", 10)
      .style("fill", "#cd5c5c")

    legend.append("text")
      .attr("x", 630)
      .attr("y", 85)
      .attr("height",30)
      .attr("width",100)
      .style('font-size', '10pt')
      .style('font-weight', 'bold')
      .style('font-family', 'Arial')
      .text("Predicted");
   
      legend.append("text")
      .attr("x", 615)
      .attr("y", 40)
      .attr("height",30)
      .attr("width",200)
      .style('font-size', '11pt')
      .style('font-weight', 'bold')
      .style('font-family', 'Arial')
      .text("Viewership Data");
  }

  // draw the axes and ticks
  function drawTicks(limits) {
    // return gre score from a row of data
    let xValue = function(d) { return +d["Year"]; }

    // function to scale gre score
    let xScale = d3.scaleLinear()
      .domain([limits.greMin - 0.3, limits.greMax + 0.8]) // give domain buffer room
      .range([50, 700]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale).tickFormat(function(d) {return d});
    xAxis.tickValues(d3.range(1990, 2015, 1))
    svgContainer.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis)
      .selectAll("text")  
        .style("text-anchor", "end")
        .attr("dx", "-1.5em")
        .attr("transform", "rotate(-90)" )
        .attr("style", "font-size:11.5px; font-weight:bold; font-family:Arial")

    // return Chance of Admit from a row of data
    let yValue = function(d) { return +d["Avg. Viewers (mil)"]}

    // function to scale Chance of Admit
    let yScale = d3.scaleLinear()
      .domain([limits.admitMax, limits.admitMin - 5]) // give domain buffer
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    yAxis.tickValues(d3.range(0, 30, 5))
    svgContainer.append('g')
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

  // find min and max for GRE Scores and Chance of Admit
  function findMinMax(greScores, admissionRates) {

    // get min/max gre scores
    let greMin = d3.min(greScores);
    let greMax = d3.max(greScores);

    // round x-axis limits
    greMax = Math.round(greMax*10)/10;
    greMin = Math.round(greMin*10)/10;

    // get min/max admit chance
    let admitMin = d3.min(admissionRates);
    let admitMax = d3.max(admissionRates);

    // round y-axis limits to nearest 0.05
    admitMax = Number((Math.ceil(admitMax*20)/20).toFixed(2));
    admitMin = Number((Math.ceil(admitMin*20)/20).toFixed(2));

    // return formatted min/max data as an object
    return {
      greMin : greMin,
      greMax : greMax,
      admitMin : admitMin,
      admitMax : admitMax
    }
  }

  // plot trend a line on SVG
  // greScores -> array of greScores
  // admitRates -> array of Chance of Admit
  // limits -> min/max data for GRE Scores and Chance of Admit
  // scale -> scaling functions for x and y
  function plotAverageLine(greScores, admitRates, limits, scale) {

    let sum = admitRates.reduce(function(a, b) { return a + b; }, 0) 
    let avg = sum / admitRates.length
    let final  = Math.round(avg * 10) / 10

    // find and initial and end points for the trend line
    let x1 = limits.greMin;
    let x2 = limits.greMax;
    let y = final

    let trendData = [[x1,y,x2,y]];

    // append trend line to SVG and assign attributes
    let xScale = scale.xScale;
    let yScale = scale.yScale;
    let trendLine = svgContainer.selectAll('.trendLine')
      .data(trendData)
      .enter()
      .append('line')
        .attr('x1', function(d) { return  xScale(d[0]) - 8})
        .attr("y1", function(d) { return yScale(d[1])})
			  .attr("x2", function(d) { return xScale(d[2]) + 20})
        .attr("y2", function(d) { return yScale(d[3])})
        .attr('stroke-dasharray', '8,8')
        .attr('stroke', 'green')
        .attr('stroke-width', 2)

      svgContainer.append("text")
      .attr("x",671)
      .attr("y", 252)
      .attr("height",30)
      .attr("width",100)
      .style('font-size', '10pt')
      .style('font-weight', 'bold')
      .style('font-family', 'Arial')
      .text("13.5");

      svgContainer.append("rect")
      .attr("x", 671)
      .attr("y", 240)
      .attr("width", 27)
      .attr("height", 15)
      .style("fill", "#e7e7e7")
      .style("opacity", "0.6")

  }

  

  /*********************************************************
                      Regression Functions
*********************************************************/

function linearRegression(independent, dependent)
  {
      let lr = {};

      let independent_mean = arithmeticMean(independent);
      let dependent_mean = arithmeticMean(dependent);
      let products_mean = meanOfProducts(independent, dependent);
      let independent_variance = variance(independent);

      lr.a = (products_mean - (independent_mean * dependent_mean) ) / independent_variance;

      lr.b = dependent_mean - (lr.a * independent_mean);

      return lr;
  }


  function arithmeticMean(data)
  {
      let total = 0;

      // note that incrementing total is done within the for loop
      for(let i = 0, l = data.length; i < l; total += data[i], i++);

      return total / data.length;
  }


  function meanOfProducts(data1, data2)
  {
      let total = 0;

      // note that incrementing total is done within the for loop
      for(let i = 0, l = data1.length; i < l; total += (data1[i] * data2[i]), i++);

      return total / data1.length;
  }


  function variance(data)
  {
      let squares = [];

      for(let i = 0, l = data.length; i < l; i++)
      {
          squares[i] = Math.pow(data[i], 2);
      }

      let mean_of_squares = arithmeticMean(squares);
      let mean = arithmeticMean(data);
      let square_of_mean = Math.pow(mean, 2);
      let variance = mean_of_squares - square_of_mean;

      return variance;
  }

})();
