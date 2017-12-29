function drawBar(data) {
  let width = 850
  let height = 350
  let svg = d3.select("#bar")
              .attr("width", width)
              .attr("height", height)
  let axisSize = 60
  let padding = 20
  let barPadding = 10
  let years = [...new Set(data.map(d => d.year))].sort()
  let yearRange = d3.extent(data, d => d.year)
  let barWidth = (width - (2 * padding) - axisSize) / (yearRange[1] - yearRange[0] + 1) - barPadding

  let xScale = d3.scaleBand()
                 .domain(years)
                 .rangeRound([padding + axisSize, width - padding])
                 .padding(0.0)

  let yScale = d3.scaleLinear()
                 .domain([0, 10])
                 .rangeRound([height - padding, padding])

  let xAxis = d3.axisBottom(xScale)
                .tickSizeOuter(0)

  let yAxis = d3.axisLeft(yScale)
                .ticks(5)
                .tickSizeOuter(0)

  svg
    .append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height - padding})`)
    .call(xAxis)

  svg
    .append("g")
    .classed("y-axis", true)
    .attr("transform", `translate(${padding + axisSize}, 0)`)
    .call(yAxis)

  let dummyData = years.map( y => {
      return {
        country: "Dummy",
        countryCode: "unknown",
        continent: "unknown",
        year: y,
        emissions: 0,
        emissionsPerCapita: 0
      }
    })

  let colorScale = mapColorScale(data)

  svg
    .selectAll("rect")
    .data(dummyData, r => r.year)
    .enter()
    .append("rect")
      .attr("width", barWidth)
      .attr("height", 0)
      .attr("y", height - padding)
      .attr("x", (d, i) => (barWidth + barPadding) * i + padding + axisSize + 5)
      .attr("fill", "lightgreen")
      .style("stroke", "black")
      .classed("yearly-emission", true)

  svg
    .append('text')
    .attr("x", width / 2 - 220)
    .attr("y", padding)
    .style("font-size", "1.5em")
    .classed("bar-title", true)
    .text("Please click on a country on the map")

  function update(country, option) {
    let newData = data
                      .filter(d => d.country === country)
                      .sort((a, b) => a.year - b.year)
    let cntryData = fixMissingYear(newData, years)
    console.log(cntryData)
    let barHeight = barHeightScale(cntryData)(option)

    yScale.domain(modExtent(cntryData, option))
    yAxis = d3.axisLeft(yScale)
                  .ticks(5)
                  .tickSize(axisSize + padding - width)
                  .tickSizeOuter(0)
    svg
      .select(".y-axis")
      .transition()
      .duration(250)
      .delay((d, i) => i * 50)
      .ease(d3.easeElasticOut)
      .call(yAxis)

    svg
      .selectAll(".yearly-emission")
      .data(cntryData, d => d.year)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 50)
      .ease(d3.easeElasticOut)
      .attr("height", d => barHeight(d[option])>0 ? barHeight(d[option]) : 0)
      .attr("y", d => height  - barHeight(d[option]) - padding)
      .attr("fill", d => colorScale(option)(d[option]))

      svg
        .select(".bar-title")
        .text(`${option} history for ${country}`)

  }

  return update
}

function clearBar() {
  let svg = d3.select("#bar")
  let width = svg.attr("width")
  svg
    .selectAll(".yearly-emission")
    .attr("height", 0)
  svg
    .select(".bar-title")
    .text("Please click on a country on the map")
}

function barHeightScale(data) {
  let padding = 20
  let range = [0, d3.select("#bar").attr("height") - padding]
  function inner(option) {
    return d3.scaleLinear()
             .domain(modExtent(data, option))
             .range(range)
  }
  return inner
}

function fixMissingYear(data, years) {
  let fixedData = []
  let { country, continent, countryCode } = data[0]
  years
    .forEach(year => {
      let [row] = data.filter(d => d.year === year)
      if(row) {
        fixedData.push(row)
      } else {
        fixedData.push({
          year,
          country,
          countryCode,
          continent,
          emissions: 0,
          emissionsPerCapita: 0
        })
      }
    })
  return fixedData
}

function modExtent(x, opt) {
  let [minExtent, maxExtent] = d3.extent(x, d => d[opt])
  let newMinExtent = minExtent * 0.9
  let newMaxExtent = maxExtent * 1.1
  return [newMinExtent, newMaxExtent]
}

function makeBarTooltip() {
  let tooltip = d3.select("body")
                  .append("div")
                    .classed("bar-tooltip", true)
  function inner(option) {
    d3.selectAll(".yearly-emission")
      .on("mousemove", d => {
        tooltip
          .style("opacity", 1)
          .style("left", d3.event.x - 50 + "px")
          .style("top", d3.event.y - 65 +"px")
          .classed("is-size-6", true)
          .classed("has-text-centered", true)
          .html(`
            <p> <span class="is-capitalized has-text-weight-semibold"> ${d.year} </span>: ${d[option]} </p>
          `)
      })
      .on("mouseout", () => {
        tooltip
          .style("opacity", 0)
      })
  }
  return inner
}