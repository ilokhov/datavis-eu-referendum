var margin = {top: 20, right: 15, bottom: 20, left: 35};
var width = 960 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;

var chart = d3.select("#chart")
              .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height  + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// define colours in RGB
var colours = {
  "England": d3.color("rgb(228,26,28)"),
  "Northern Ireland": d3.color("rgb(152,78,163)"),
  "Scotland": d3.color("rgb(55,126,184)"),
  "Wales": d3.color("rgb(77,175,74)")
};

// define opacity level
var opacityLevel = 0.6;

// create and populate array for colour objects (used in legend)
var coloursArray = [];
for (var key in colours) {
  var colourObj = {};
  colourObj.area = key;
  colourObj.colour = colours[key];
  coloursArray.push(colourObj);
}



var data;

d3.tsv("data.tsv", function(error, data) {
  if (error) {
    throw error;
  }

  // prepare data
  data.forEach(function(d) {
    // coerce data to numbers
    d.population = +d.population;
    d.percent_leave = +d.percent_leave;
    d.percent_non_uk_born = +d.percent_non_uk_born;
  });



  // scales
  var xScale = d3.scaleLinear()
                  .domain([d3.min(data, function(d) { return d.percent_leave; }), d3.max(data, function(d) { return d.percent_leave; })])
                  .rangeRound([0, width])
                  .nice();

  var yScale = d3.scaleLinear()
                  .domain([0, d3.max(data, function(d) { return d.percent_non_uk_born; })])
                  .rangeRound([height, 0])
                  .nice();

  var rScale = d3.scaleLinear()
                  .domain([0, d3.max(data, function(d) { return d.population; })])
                  .range([2, 20]);



  // format percentages
  var formatPct = function(d) {
    return d + "%";
  };

  // axis
  var xAxis = d3.axisBottom(xScale).tickFormat(formatPct);
  var yAxis = d3.axisLeft(yScale).ticks(7).tickFormat(formatPct);

  chart.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
       .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -5)
        .text("Percent voted leave");

  chart.append("g")
        .attr("class", "axis y-axis")
        .attr("transform", "translate(0,0)")
        .call(yAxis)
       .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 5)
        .attr("dy", ".71em")
        .text("Percent non-UK born");



  // legend
  var legendWidth = 130;
  var legendRectSize = 12;

  var legend = chart.append("g")
                      .attr("class", "legend")
                      .attr("transform", "translate(" + (width - legendWidth) + ",0)");

  legend.selectAll(".legend-rect")
          .data(coloursArray)
          .enter()
        .append("rect")
          .attr("class", "legend-rect")
          .attr("fill", function(d) {
            return d.colour;
          })
          .attr("stroke", function(d) {
            return d.colour;
          })
          .attr("width", legendRectSize)
          .attr("height", legendRectSize)
          .attr("x", 0)
          .attr("y", function(d, i) {
            return 20 * i;
          });

  legend.selectAll(".legend-text")
          .data(coloursArray)
          .enter()
        .append("text")
          .attr("class", "legend-text")
          .attr("x", legendRectSize + 6)
          .attr("y", function(d, i) {
            return 20 * i + legendRectSize;
          })
          .text(function(d) {
            return d.area;
          });



  // 50% line
  chart.append("g")
        .attr("class", "fifty-pct-line")
       .append("line")
        .attr("x1", xScale(50))
        .attr("y1", 0)
        .attr("x2", xScale(50))
        .attr("y2", height);
  


  // points
  chart.selectAll("circle")
        .data(data)
        .enter()
       .append("circle")
        .attr("class", "point")
        .attr("cx", function(d) {
          return xScale(50); // start in the middle - gets animated outwards
        })
        .attr("cy", function(d) {
          return yScale(d.percent_non_uk_born);
        })
        .attr("r", function(d) {
          return rScale(d.population);
        })
        .attr("fill", function(d) {
          colours[d.country].opacity = opacityLevel;
          return colours[d.country];
        })
        .attr("stroke", function(d) {
          colours[d.country].opacity = 1;
          return colours[d.country];
        })
        .transition()
        .ease(d3.easeExp)
        .duration(function(d) {
          var itemDiff = d.percent_leave - 50;
          itemDiff = (itemDiff < 0) ? itemDiff = -itemDiff : itemDiff;
          return itemDiff * 80;
        })
        .attr("cx", function(d) {
          return xScale(d.percent_leave);
        });



  // tooltip
  var tooltip = d3.select("#chart").append("div")
                    .attr("class", "tooltip");

  chart.selectAll(".point")
        .on("mouseover", function(d) {
          colours[d.country].opacity = 1;
          d3.select(this).attr("fill", colours[d.country]);

          // get point size and coordinates
          var pointWidth = d3.select(this).node().getBoundingClientRect().width;
          var pointHeight = d3.select(this).node().getBoundingClientRect().height;
          var pointPosX = d3.select(this).attr("cx");
          var pointPosY = d3.select(this).attr("cy");

          // convert coordinates to integers
          pointPosX = parseInt(pointPosX, 10);
          pointPosY = parseInt(pointPosY, 10);

          // set content + position and show tooltip
          tooltip.style("border-color", colours[d.country])
                 .html("<strong>" + d.area +
                   "</strong><br>Voted leave (%): " + d.percent_leave +
                   "<br>Non-UK born (%): " + d.percent_non_uk_born +
                   "<br>Population (thousands): " + d.population)
                 .style("left", (pointPosX + (pointWidth / 2) + 38) + "px")
                 .style("bottom", (height - (pointPosY - (pointHeight / 2) - 26)) + "px")
                 .style("display", "inline-block");

        })
        .on("mouseout", function(d) {
          colours[d.country].opacity = opacityLevel;
          d3.select(this).attr("fill", colours[d.country]);

          // hide tooltip
          tooltip.style("display", "none");
        });
});