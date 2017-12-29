function drawMap(geoData) {
  let width = 800
  let height = 600
  let projection = d3.geoMercator()
    .scale(135)
    .translate([width / 2, height / 1.55])
  let path = d3.geoPath()
    .projection(projection)
  let svg = d3.select("#map")
              .attr("width", width)
              .attr("height", height)
  svg
    .selectAll(".country")
    .data(geoData)
    .enter()
    .append("path")
    .classed("country", true)
    .attr("d", path)

  svg
    .append("text")
      .attr("x", width / 2 - 175)
      .attr("y", height - 20)
      .style("font-size", "1.5em")
      .classed("map-title", true)
      .text(`Carbon dioxide ${emissionType}, ${yearVal}`)
}

function idCountryMap(geodata, populationdata) {
  let idMap = {}
  geodata
    .forEach(g => {
      let [row] = populationdata.filter(p => p.countryCode === g.id)
      if(row) {
        idMap[g.id] = row.country
      } else {
        idMap[g.id] = 'unknown'
      }
    })
  return idMap
}

function makeMapTooltip(idMap) {
  let tooltip = d3.select("body")
                  .append("div")
                    .classed("map-tooltip", true)

  function inner(option) {
    d3.selectAll(".country")
      .on("mousemove", d => {
        tooltip
          .style("opacity", 1)
          .style("left", d3.event.x - 50 + "px")
          .style("top", d3.event.y - 65 +"px")
          .classed("is-size-6", true)
          .classed("has-text-centered", true)
          .html(`
            <p class="is-capitalized has-text-weight-semibold"> ${idMap[d.id]} </p>
            <p> ${d.properties[option] ? d.properties[option] : 'unknown'} </p>
          `)
      })
      .on("mouseout", () => {
        tooltip
          .style("opacity", 0)
      })
  }
  return inner
}

function mapColorScale(data) {
  let range = ["black"]
  function inner(option) {
    if(option === 'emissions') {
      range = ["yellow", "red"]
    } else if(option === 'emissionsPerCapita') {
      range = ["white", "purple"]
    }
    return d3.scaleLinear()
             .domain(d3.extent(data, d => d[option]))
             .range(range)
  }
  return inner
}


function setMapColor(geodata, populationdata) {
  function inner(year, colorScalefn, option) {
    d3.select("#year-display")
      .html(year)

    let filtData = populationdata
                    .filter(d => d.year === year)
    geodata
      .forEach(row => {
        let [pop] = filtData.filter(d => d.countryCode === row.id)
        if(pop) {
          row.properties = pop
        } else {
          row.properties = {}
        }
      })

    d3.selectAll(".country")
      .transition()
      .duration(500)
      .ease(d3.easeQuadIn)
      .attr("fill", d => {
        let data = d.properties[option]
        return data ? colorScalefn(option)(data) : "#ccc"
      })
    d3.select(".map-title")
      .transition()
      .duration(1000)
      .ease(d3.easeQuadIn)
      .text(`Carbon dioxide ${emissionType}, ${yearVal}`)
  }
  return inner
}
