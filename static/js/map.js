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
          .style("left", d3.event.x + 10 + "px")
          .style("top", d3.event.y + 10 +"px")
          .html(`
            <p> ${idMap[d.id]} </p>
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
  }
  return inner
}


d3.queue()
  .defer(d3.json, 'http://unpkg.com/world-atlas@1.1.4/world/50m.json')
  .defer(d3.csv, './data/all_data.csv', row => ({
      country: row.Country,
      countryCode: row.CountryCode,
      year: +row.Year,
      emissions: +row.Emissions,
      emissionsPerCapita: +row.EmissionsPerCapita
    }))
  .await((error, mapData, populationData) => {
    if (error) throw error

    let geoData = topojson.feature(mapData, mapData.objects.countries).features

    let minYear = d3.min(populationData, d => d.year)
    let maxYear = d3.max(populationData, d => d.year)
    let yearSelect = d3.select("#year-select")
                       .property("min", minYear)
                       .property("max", maxYear)
                       .property("value", minYear)
    let emissionSelect = d3.selectAll("input[name='emissions']")
    yearVal = +yearSelect.property("value")
    emissionType = emissionSelect.property("value")

    const mapScalefn = mapColorScale(populationData)
    const mapTooltipfn = makeMapTooltip(idCountryMap(geoData, populationData))
    const mapColorfn = setMapColor(geoData, populationData)

    drawMap(geoData)
    mapTooltipfn(emissionType)

    mapColorfn(yearVal, mapScalefn, emissionType)

    yearSelect
      .on("change", d => {
        yearVal = +d3.event.target.value
        mapColorfn(yearVal, mapScalefn, emissionType)
      })

    emissionSelect
      .on("change", d => {
        emissionType = d3.event.target.value
        console.log("Changed", emissionType)
        mapTooltipfn(emissionType)
        mapColorfn(yearVal, mapScalefn, emissionType)
      })

  })

