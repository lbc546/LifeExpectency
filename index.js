"use-strict";

let data = "";
let svgContainer = "";
let popContainer = "";
const msm = {
    width: 1000,
    height: 1000,
    marginAll: 100,
    marginLeft: 100,
}
const small_msm = {
    width: 600,
    height: 600,
    marginAll: 100,
    marginLeft: 100
}

window.onload = function () {
    svgContainer = d3.select("#chart")
        .append('svg')
        .attr('width', msm.width)
        .attr('height', msm.height);
    popContainer = d3.select("#pop")
        .append('svg')
        .attr('width', 500)
        .attr('height', 500);
    d3.csv("gapminder.csv")
        .then((d) => makeScatterPlot(d))
}

// make scatter plot with trend line
function makeScatterPlot(csvData) {
    data = csvData.filter((data) => {return data.fertility != "NA" && data.life_expectancy != "NA"})

    let dropDown = d3.select("#filter").append("select")
        .attr("name", "year");

    let fertility_rate_data = data.map((row) => parseFloat(row["fertility"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));

    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);

    let mapFunctions = drawAxes(axesLimits, "fertility", "life_expectancy", svgContainer, msm);

    plotData(mapFunctions);

    makeLabels(svgContainer, msm, "Fertility vs Life Expectancy (1980)",'Fertility Rates','Life Expectancy');

    let distinctYears = [...new Set(data.map(d => d.year))];
    let defaultYear = 1980;

    let options = dropDown.selectAll("option")
           .data(distinctYears)
           .enter()
           .append("option")
           .text(function (d) { return d; })
           .attr("value", function(d){return d;})
           .attr("selected", function(d){ return d == defaultYear; })
           .property("selected", function(d){ return d == defaultYear; })

    let selected = dropDown.node().value;
    let display = dropDown.node().checked ? "none" : "inline";
    let displayOthers = dropDown.node().checked ? "inline" : "none";
    svgContainer.selectAll(".circles")
        .data(data)
        .filter(function(d) {return selected == d.year;})
        .attr("display", display);

    svgContainer.selectAll(".circles")
        .data(data)
        .filter(function(d) {return selected != d.year;})
        .attr("display", displayOthers);
}

function makeLabels(svgContainer, msm, title, x, y) {
    svgContainer.append('text')
        .attr('x', (msm.width - 2 * msm.marginAll) / 2 - 90)
        .attr('y', msm.marginAll / 2 + 10)
        .style('font-size', '30pt')
        .text(title);

    svgContainer.append('text')
        .attr('x', (msm.width - 2 * msm.marginAll) / 2 - 30)
        .attr('y', msm.height - 10)
        .style('font-size', '15pt')
        .text(x);

    svgContainer.append('text')
        .attr('transform', 'translate( 15,' + (msm.height / 2 + 30) + ') rotate(-90)')
        .style('font-size', '15pt')
        .text(y);
}

function plotData(map) {
    curData = data.filter((row) => {
        return row.year == 1960 && row.fertility != "NA" && row.life_expectancy != "NA"
    })
    let pop_data = data.map((row) => +row["population"]);
    let pop_limits = d3.extent(pop_data);

    let pop_map_func = d3.scaleSqrt()
        .domain([pop_limits[0], pop_limits[1]])
        .range([2, 40]);


    let xMap = map.x;
    let yMap = map.y;


    let div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    let toolChart = div.append('svg')
        .attr('width', small_msm.width + 100)
        .attr('height', small_msm.height + 100)

    svgContainer.selectAll('.dot')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', (d) => pop_map_func(d["population"]))
        .attr('stroke', "skyblue")
        .attr('stroke-width', 1)
        .attr('fill', 'White')
        .attr("class", "circles")
        .on("mouseover", (d) => {
            toolChart.selectAll("*").remove()
            div.transition()
                .duration(200)
                .style("opacity", 1);
            plotPopulation(d.country, toolChart)
            div
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 30) + "px");

        })
        .on("mouseout", (d) => {
            div.transition()
                .duration(500)
                .style("opacity", 0);
        });
}

function plotPopulation(country, toolChart) {
    let countryData = data.filter((row) => {return row.country == country})
    let population = countryData.map((row) => parseInt(row["population"]));
    let year = countryData.map((row) => parseInt(row["year"]));

    let axesLimits = findMinMax(year, population);
    let mapFunctions = drawAxes(axesLimits, "year", "population", toolChart, small_msm);
    toolChart.append("path")
        .datum(countryData)
        .attr("stroke", "Blue")
        .attr("stroke-width", 1)
        .attr("d", d3.line()
                    .x(function(d) { return mapFunctions.xScale(d.year) })
                    .y(function(d) { return mapFunctions.yScale(d.population) }))
    makeLabels(toolChart, small_msm, country, "Year", "Population");
}

// draw the axes and ticks
function drawAxes(limits, x, y, svgContainer, msm) {
    // return x value from a row of data
    let xValue = function (d) {
        return +d[x];
    }

    // function to scale x value
    let xScale = d3.scaleLinear()
        .domain([limits.xMin, limits.xMax]) // give domain buffer room
        .range([0 + msm.marginAll, msm.width - msm.marginAll])

    // xMap returns a scaled x value from a row of data
    let xMap = function (d) {
        return xScale(xValue(d));
    };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
        .attr('transform', 'translate(0, ' + (msm.height - msm.marginAll) + ')')
        .call(xAxis);

    // return y value from a row of data
    let yValue = function (d) {
        return +d[y]
    }

    // function to scale y
    let yScale = d3.scaleLinear()
        .domain([limits.yMax, limits.yMin]) // give domain buffer
        .range([0 + msm.marginAll, msm.height - msm.marginAll])

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) {
        return yScale(yValue(d));
    };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
        .attr('transform', 'translate(' + msm.marginAll + ', 0)')
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
        xMin: xMin,
        xMax: xMax,
        yMin: yMin,
        yMax: yMax
    }
}

// format numbers
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
