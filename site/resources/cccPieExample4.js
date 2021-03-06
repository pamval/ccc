new pvc.PieChart({
    canvas: 'cccPieExample4',
    width:  600,
    height: 400,

    // Data source
    crosstabMode: false,

    // Main plot
    valuesVisible: true,
    explodedSliceRadius: '2%',
    slice_innerRadiusEx: '50%',

    // Panels
    legend: false,

    // Chart/Interaction
    selectable: true,
    hoverable:  true,
    tooltipClassName: 'light'
})
.setData(relational_03_b)
.render();