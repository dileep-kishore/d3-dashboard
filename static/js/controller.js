d3.queue()
  .defer(d3.json, 'http://unpkg.com/world-atlas@1.1.4/world/50m.json')
  .defer(d3.csv, './data/all_data.csv', row => ({
      country: row.Country,
      countryCode: row.CountryCode,
      continent: row.Continent,
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

    // Map functions
    const mapScalefn = mapColorScale(populationData)
    const mapTooltipfn = makeMapTooltip(idCountryMap(geoData, populationData))
    const mapColorfn = setMapColor(geoData, populationData)
    const borderfn = highlightBorder(geoData)

    // Map init
    drawMap(geoData)
    mapTooltipfn(emissionType)
    mapColorfn(yearVal, mapScalefn, emissionType)

    // Pie functions
    const pieDrawfn = drawPie(populationData)
    const countryIdMap = countryMap(populationData)
    const pieTooltipfn = makePieTooltip()

    // Pie init
    pieDrawfn(yearVal, emissionType)
    pieTooltipfn(emissionType)


    yearSelect
      .on("change", d => {
        yearVal = +d3.event.target.value
        mapColorfn(yearVal, mapScalefn, emissionType)
        pieDrawfn(yearVal, emissionType)
        clearBar()
      })

    emissionSelect
      .on("change", d => {
        emissionType = d3.event.target.value
        console.log("Changed", emissionType)
        mapTooltipfn(emissionType)
        mapColorfn(yearVal, mapScalefn, emissionType)
        pieDrawfn(yearVal, emissionType)
        pieTooltipfn(emissionType)
        clearBar()
      })

    d3.selectAll(".country")
      .on("click", function(d) {
        d3.selectAll(".country").style("stroke", "none")
        d3.select(this).style("stroke", "black")
        // this is shit
        let countryData = d
        console.log(countryData)
        borderfn(countryData)
      })

  })