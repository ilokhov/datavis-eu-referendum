// extend d3.js with functions to move an SVG element
// to front and back within its group of sibling elements
// http://stackoverflow.com/a/14426477
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};
d3.selection.prototype.moveToBack = function() {
  return this.each(function() { 
    var firstChild = this.parentNode.firstChild; 
    if (firstChild) { 
      this.parentNode.insertBefore(this, firstChild); 
    } 
  }); 
};

var margin = {top: 20, right: 15, bottom: 20, left: 35};
var width = 960 - margin.left - margin.right;
var height = 500 - margin.top - margin.bottom;

var chart = d3.select("#chart")
              .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height  + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



// define colours constructor
function Colours(opacityLevel) {
  this.england = d3.color("rgb(228,26,28)");
  this.northernIreland = d3.color("rgb(152,78,163)");
  this.scotland = d3.color("rgb(55,126,184)");
  this.wales = d3.color("rgb(77,175,74)");

  this.england.opacity = this.northernIreland.opacity = this.scotland.opacity = this.wales.opacity = opacityLevel;
}

// create two colour objects with different opacities
var coloursFull = new Colours(1);
var coloursFaded = new Colours(0.6);



// create and populate array for colour objects (used in legend)
var coloursArray = [];
for (var key in coloursFull) {
  var colourObj = {};
  colourObj.area = key;
  colourObj.colour = coloursFull[key];
  coloursArray.push(colourObj);
}



var data;

// load data
d3.tsv("data.tsv", function(error, data) {
  if (error) {
    throw error;
  }

  // prepare data
  data.forEach(function(d) {
    // convert country to camelCase to match the object keys
    d.country = (d.country.charAt(0).toLowerCase() + d.country.slice(1)).split(" ").join("");

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
                  .range([2, 20])
                  .nice();



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

  // toggle all points in a group
  function toggleGroup(d, thisEl) {
    // select all points by class
    var thesePoints = chart.selectAll("." + d.area);

    // inactive
    if (d3.select(thisEl.parentNode).classed("inactive")) {
      thesePoints.moveToFront();

      // fade in
      thesePoints.classed("faded", false)
                  .transition()
                  .ease(d3.easeQuad)
                  .duration(400)
                  .attr("stroke", function(d) {
                    return coloursFull[d.country];
                  })
                  .attr("fill", function(d) {
                    return coloursFaded[d.country];
                  })
                  .style("opacity", "1");



      // remove inactive from legend group
      d3.select(thisEl.parentNode).classed("inactive", false);
    }
    // not inactive
    else {
      thesePoints.moveToBack();

      // fade out
      thesePoints.classed("faded", true)
                  .transition()
                  .ease(d3.easeQuad)
                  .duration(400)
                  .attr("fill", "rgba(238, 238, 238, 1)")
                  .attr("stroke", "rgb(221, 221, 221)")
                  .style("opacity", "0.4");

      // set legend group to inactive
      d3.select(thisEl.parentNode).classed("inactive", true);
    }
  }

  // create legend
  var legendWidth = 130;
  var legendRectSize = 12;

  var legend = chart.append("g")
                      .attr("class", "legend")
                      .attr("transform", "translate(" + (width - legendWidth) + ",0)");

  var legendGroups = legend.selectAll(".legend-group")
                            .data(coloursArray)
                            .enter()
                           .append("g")
                            .attr("class", "legend-group");

  legendGroups.append("rect")
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
                })
                .on("click", function(d, i) {
                  toggleGroup(d, this);
                });

  legendGroups.append("text")
                .attr("class", "legend-text")
                .attr("x", legendRectSize + 6)
                .attr("y", function(d, i) {
                  return 20 * i + legendRectSize;
                })
                .text(function(d) {
                  // format text labels
                  var legendText;
                  switch (d.area) {
                    case "england":
                      legendText = "England";
                      break;
                    case "northernIreland":
                      legendText = "Northern Ireland";
                      break;
                    case "scotland":
                      legendText = "Scotland";
                      break;
                    case "wales":
                      legendText = "Wales";
                      break;
                    default:
                      console.log("error");
                  }

                  return legendText;
                })
                .on("click", function(d, i) {
                  toggleGroup(d, this);
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
        .attr("class", function(d) {
          return d.country;
        })
        .attr("cx", function(d) {
          return xScale(50); // start in the middle - gets animated outwards
        })
        .attr("cy", function(d) {
          return yScale(d.percent_non_uk_born);
        })
        .attr("r", function(d) {
          return rScale(d.population).toFixed(2);
        })
        .attr("fill", function(d) {
          return coloursFaded[d.country];
        })
        .attr("stroke", function(d) {
          return coloursFull[d.country];
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

  chart.selectAll("circle")
        .on("mouseover", function(d) {

          // prevent all actions if faded
          if (d3.select(this).classed("faded")) {
            return;
          }

          d3.select(this).attr("fill", coloursFull[d.country]);

          // get point size and coordinates
          var pointWidth = d3.select(this).node().getBoundingClientRect().width;
          var pointHeight = d3.select(this).node().getBoundingClientRect().height;
          var pointPosX = d3.select(this).attr("cx");
          var pointPosY = d3.select(this).attr("cy");

          // convert coordinates to integers
          pointPosX = parseInt(pointPosX, 10);
          pointPosY = parseInt(pointPosY, 10);

          // set content + position and show tooltip
          tooltip.style("border-color", coloursFull[d.country])
                 .html("<strong>" + d.area +
                   "</strong><br>Voted leave (%): " + d.percent_leave +
                   "<br>Non-UK born (%): " + d.percent_non_uk_born +
                   "<br>Population (thousands): " + d.population)
                 .style("left", (pointPosX + (pointWidth / 2) + 38) + "px")
                 .style("bottom", (height - (pointPosY - (pointHeight / 2) - 26)) + "px")
                 .style("display", "inline-block");

        })
        .on("mouseout", function(d) {

          // prevent all actions if faded
          if (d3.select(this).classed("faded")) {
            return;
          }

          d3.select(this).attr("fill", coloursFaded[d.country]);

          // hide tooltip
          tooltip.style("display", "none");
        });
});