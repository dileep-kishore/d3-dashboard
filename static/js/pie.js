function drawPie(data) {
  let width = 300
  let height = 300
  let svg = d3.select("#pie")
              .attr("width", width)
              .attr("height", height)
  svg
    .append("g")
      .attr("transform", `translate(${width/2}, ${height/2})`)
      .classed("chart", true)

  svg
    .append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .style("font-size", "1.5em")
      .classed("pie-title", true)
      .style("text-anchor", "middle")
      .text(`${emissionType}, ${yearVal}`)

  let contData = getContinentData(data)
  const continents = getContinentSet(data)
  const colorScale = pieColorScale(data)
  const sortCont = (a, b) => continents.indexOf(a.continent) - continents.indexOf(b.continent)
  let dummyArcs = d3.pie()
                    .value(d => 0)
                    .sort(sortCont)
  let path = d3.arc()
               .outerRadius(width / 2)
               .innerRadius(10)
  let dummyData = getDummyData(data)
  let chart = d3.select(".chart")
                .selectAll(".arc")
                .data(dummyArcs(dummyData))
  chart
    .enter()
    .append("path")
      .classed("arc", true)
        .attr("fill", d => {
          return colorScale(d.data.continent)
        })
        .attr("d", path)


  function update(year, option) {
    let fltrData = fixMissingCountry(data.filter(d => d.year === year), contData)
    let arcs = d3.pie()
                  .value(d => d[option])
                  .sort(sortCont)
    let chart = d3.select(".chart")
                  .selectAll(".arc")
                  .data(arcs(fltrData), d => d.data.country)
    chart
      .transition()
      .duration(1000)
      .ease(d3.easeQuadOut)
      .attr("d", path)

    d3.select(".pie-title")
      .transition()
      .duration(1000)
      .ease(d3.easeBackIn)
      .text(`${option}, ${year}`)
  }
  return update
}

function getDummyData(data) {
  let dummyData = []
  let countryIdMap = getCountryIdMap(data)
  let countryContMap = getCountryContMap(data)
  let continentData = getContinentData(data)
  for(let i in continentData) {
    continentData[i]
      .forEach(country => {
        dummyData.push({
          country,
          countryCode: countryIdMap[country],
          continent: countryContMap[country],
          year: 0,
          emissions: 0,
          emissionsPerCapita: 0
        })
      })
  }
  return dummyData
}

function makePieTooltip() {
  let tooltip = d3.select("body")
                  .append("div")
                    .classed("pie-tooltip", true)
  function inner(option) {
    d3.selectAll(".arc")
      .on("mousemove", d => {
        tooltip
          .style("opacity", 1)
          .style("left", d3.event.x - 50 + "px")
          .style("top", d3.event.y - 65 +"px")
          .classed("is-size-6", true)
          .classed("has-text-centered", true)
          .html(`
            <p> <span class="is-capitalized has-text-weight-semibold"> ${d.data.continent} </span>: ${d.data.country} </p>
            <p> ${(Math.abs(d.startAngle - d.endAngle)/(2*Math.PI) * 100).toFixed(2)}% </p>
          `)
      })
      .on("mouseout", () => {
        tooltip
          .style("opacity", 0)
      })
  }
  return inner
}

function getCountryContMap(data) {
  let map = {}
  data
    .forEach(r => map[r.country] = r.continent)
  return map
}

function getCountryIdMap(data) {
  let map = {}
  data
    .forEach(r => map[r.country] = r.countryCode)
  return map
}

// All continents and countries they contain
function getContinentData(data) {
  let continents = {}
  data
    .forEach(row => {
      if(continents.hasOwnProperty(row.continent)) {
        if(continents[row.continent].indexOf(row.country) === -1) {
          continents[row.continent].push(row.country)
        }
      } else {
        continents[row.continent] = [row.country]
      }
    })
  return continents
}

function getContinentSet(data) {
  return data
           .reduce((acc, row) => {
             if(acc.indexOf(row.continent) === -1) acc.push(row.continent)
             return acc
           }, []).sort()
}

function pieColorScale(data) {
  let colorScale = d3.scaleOrdinal()
                      .domain(getContinentSet(data))
                      .range(d3.schemeCategory10)
  return colorScale
}

function fixMissingCountry(data, continentData) {
  let fixedData = []
  for(let i in continentData) {
    continentData[i]
      .forEach(country => {
        let [row] = data.filter(d => d.country === country)
        if(row) {
          fixedData.push(row)
        } else {
          fixedData.push({
            country,
            continent: i,
            emissions: 0,
            emissionsPerCapita: 0
          })
        }
      })
  }
  return fixedData
}