d3.queue()
  .defer(d3.json, 'http://unpkg.com/world-atlas@1.1.4/world/50m.json')
  .defer(d3.csv, './data/all_data.csv', row => ({
      country: row.Country,
      countryCode: row.CountryCode,
      year: row.Year,
      emissions: +row.Emissions,
      emissionsPerCapita: +row.EmissionsPerCapita
    }))
  .await((error, mapData, populationData) => {
    if (error) throw error

    let minYear = d3.min(populationData, d => d.year)
    let maxYear = d3.max(populationData, d => d.year)
    let yearSelect = d3.select("#year-select")
                       .property("min", minYear)
                       .property("max", maxYear)
                       .property("value", minYear)

    let year = yearSelect.property("value") // everytime this is changed we need to update map

    let geoData = topojson.feature(mapData, mapData.objects.countries).features
    populationData
      .filter(d => d.year === year)
      .forEach(row => {
        geoData
          .filter(d => d.id === row.countryCode)
          .forEach(country => country.properties = row)
    })

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

    let colorScale = d3.scaleLinear()
                       .domain(d3.extent(populationData, d => d.emissions)) // d[val]
                       .range(["green", "red"])
    // console.log(geoData)
    d3.selectAll(".country")
      .transition()
      .duration(750)
      .ease(d3.easeBackIn)
      .attr("fill", d => {
        let data = d.properties.emissions
        return data ? colorScale(data) : "#ccc"
      })

  })