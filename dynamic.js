var timeWindow = (3600000*24.0*1);	//Initial time window

// Default settings
var defaults = {
  power_feed: false,
  solar_feed: false,
  external_feed: false,
  internal_feed: false,
  lac_feed: false,
  
  other_feeds: [],
  
  solarfactor: 0.6,
  solaroffset: 1,
  
  metabolic: 0,
  
  segments: [
    {u:130,k:3.00,T:10},
    {u:340,k:0.70,T:15},
    {u:712,k:0.17,T:15}
  ],
  
  start: +new Date - timeWindow,
  end: +new Date
};

// Load in settings from local storage if available
var settings = localStorage.getItem("dynamicmodel");
if (settings==null) {
  settings = defaults;
} else {
  settings = JSON.parse(settings);
}

view.start = settings.start
view.end = settings.end
view.calc_interval(6000);

var segment = settings.segments;
var $graph_bound = $('#graph_bound');
var $graph = $('#graph').width($graph_bound.width()).height($('#graph_bound').height());

draw_segment_config();

var initial_external_temp = false;
var initial_internal_temp = false;

// Load feed list from server
var feeds = feed.list();
var nodes = {};
for (var z in feeds) {
    var node = feeds[z].tag;
    if (nodes[node]==undefined) nodes[node] = [];
    nodes[node].push(feeds[z]);
}


$(".feed_selector[name=external_feed]").html(draw_feed_selector(settings.external_feed));
$(".feed_selector[name=internal_feed]").html(draw_feed_selector(settings.internal_feed));
$(".feed_selector[name=power_feed]").html(draw_feed_selector(settings.power_feed));
$(".feed_selector[name=lac_feed]").html(draw_feed_selector(settings.lac_feed));
$(".feed_selector[name=solar_feed]").html(draw_feed_selector(settings.solar_feed));
$("#other_feeds").val(settings.other_feeds.join(","));
$("#solar_scale").val(settings.solarfactor);
$("#solar_offset").val(settings.solaroffset);
$("#metabolic").val(settings.metabolic);

data = {}
load();

// ----------------------------------------------------------------------------------
// Load feeds
// ----------------------------------------------------------------------------------
function load() {
    initial_external_temp = false;
    initial_internal_temp = false;
    
    data.power_feed = feed.getdata(settings.power_feed,view.start,view.end,view.interval,1);
    if (data.power_feed.success!=undefined) data.power_feed = []
    
    data.solar_feed = feed.getdata(settings.solar_feed,view.start,view.end,view.interval,1);
    if (data.solar_feed.success!=undefined) data.solar_feed = []
    
    data.external_feed = feed.getdata(settings.external_feed,view.start,view.end,view.interval,1);
    if (data.external_feed.success!=undefined) data.external_feed = []
    
    data.internal_feed = feed.getdata(settings.internal_feed,view.start,view.end,view.interval,1);
    if (data.internal_feed.success!=undefined) data.internal_feed = []
    
    data.lac_feed = feed.getdata(settings.lac_feed,view.start,view.end,view.interval,1);
    if (data.lac_feed.success!=undefined) data.lac_feed = []
    
    simulate();
} 

// ----------------------------------------------------------------------------------
// Simulate
// ----------------------------------------------------------------------------------
function simulate()
{  
  console.log("simulate");
  for (var i in segment) 
  {
    segment[i].u = $("#u"+i).val()*1;
    segment[i].k = $("#k"+i).val()*1;
    segment[i].T = $("#t"+i).val()*1;
  }
  
  // INITIAL CONDITIONS  
  var sum_u = 0;
  var sum_k = 0;
      
  for (var i in segment) 
  {
    segment[i].E = segment[i].T * (segment[i].k*3600000);
    segment[i].H = 0;
    sum_u += 1 / segment[i].u;
    sum_k += 1*segment[i].k
  }
  
  var total_wk = 1 / sum_u;
  var total_thermal_capacity = sum_k;
  
  var sim = [];
  
  var error = 0;
  
  var outside = 0;
  var heatinput = 0;
  var lac = 0;
  var solar = 0;
  var ref = 0;
  
  for (var z=1; z<data.external_feed.length; z++)
  {
    var lasttime = data.external_feed[z-1][0];
    var time = data.external_feed[z][0];
    
    var step = (time - lasttime) / 1000.0;

    if (data.external_feed[z]!=undefined && data.external_feed[z][1]!=null) outside = data.external_feed[z][1];
    if (data.power_feed[z]!=undefined && data.power_feed[z][1]!=null) heatinput = data.power_feed[z][1];
    if (data.lac_feed[z]!=undefined && data.lac_feed[z][1]!=null) lac = data.lac_feed[z][1];
    if (data.solar_feed[z]!=undefined && data.solar_feed[z][1]!=null) solar = (settings.solarfactor * data.solar_feed[z][1]) + settings.solaroffset;
    if (data.internal_feed[z]!=undefined && data.internal_feed[z][1]!=null) ref = data.internal_feed[z][1];
    
    if (initial_external_temp==false && outside!=undefined) initial_external_temp = outside;
    if (initial_internal_temp==false && ref!=undefined) initial_internal_temp = ref;
    
    if (settings.solar_feed>0) heatinput += solar;
    
    if (lac<0) lac = 0;
    heatinput += lac

    heatinput += settings.metabolic
    
    // The following 14 lines of code is the actual simulation code
    // We calculate how much heat (in Watts) flow between the segments
    // Its a two stage process:
    
    // 1) we calculate the heat flow rate from current temperatures
    
    var len = segment.length-1;
    for (var i=0; i<=len; i++)
    {
      var H_left = 0, H_right = 0;
      if (i>0) H_left = (segment[i].T - segment[i-1].T) * segment[i].u; else H_left = (segment[i].T - outside) * segment[i].u;
      if (i<len) H_right = (segment[i+1].T - segment[i].T) * segment[i+1].u; else H_right = heatinput;
      segment[i].H = H_right - H_left;
    }
    
    // 2) We calculate the change of energy in each segment and the new temperature
    // of each segment.
    
    for (i in segment) 
    {
      segment[i].E += segment[i].H * step;
      segment[i].T = segment[i].E / (segment[i].k*3600000);
    }
    
    // Populate the simulation plot with simulated internal temperature
    sim.push([time,segment[segment.length-1].T]);
    
    // Average error calculation
    error += Math.abs(segment[segment.length-1].T - ref);
  }
  
  var linewidth = 1;
  
  var feeds = [
      {data: data.external_feed, lines: { show: true, fill: false }, color: "rgba(0,0,255,0.8)"},
      {data: data.power_feed, yaxis: 2, lines: { show: true, fill: true, fillColor: "rgba(255,150,0,0.2)"}, color: "rgba(255,150,0,0.2)"},
      {data: data.lac_feed, yaxis: 2, lines: { show: true, fill: true, fillColor: "rgba(255,150,0,0.2)"}, color: "rgba(255,150,0,0.2)"},
      {data: data.solar_feed, yaxis: 2, lines: { show: true, fill: false, fillColor: "rgba(255,150,0,0.2)"}, color: "rgba(255,255,0,0.2)"},
      {data: data.internal_feed, lines: { show: true, fill: false }, color: "rgba(200,0,0,1.0)"},
      {data: sim, lines: { show: true, fill: false, lineWidth: 3}, color: "rgba(0,0,0,1)"}
  ];
  
  for (var ix in settings.other_feeds)
  {
    // var fdata = feed.getdata(settings.other_feeds[i],view.start,view.end,view.interval);
    // feeds.push({data: fdata, lines: { show: true, fill: false, lineWidth:linewidth}, color: "rgba(255,0,0,0.3)"});
  }
  
  var plot = $.plot($graph, feeds, {
    grid: { show: true, hoverable: true, clickable: true },
    xaxis: { mode: "time", localTimezone: true, min: view.start, max: view.end },
    selection: { mode: "x" }
  });
  


  $("#total_wk").html(total_wk.toFixed(0));
  $("#total_thermal_capacity").html(total_thermal_capacity);
  $("#error").html("Model is within an average of: "+(error/ data.external_feed.length).toFixed(3)+"C of measured temperature");
}

// ----------------------------------------------------------------------------------
// Events
// ----------------------------------------------------------------------------------

$("#zoomout").click(function () {view.zoomout(); view.calc_interval(6000); load();});
$("#zoomin").click(function () {view.zoomin(); view.calc_interval(6000); load();});
$('#right').click(function () {view.panright(); view.calc_interval(6000); load();});
$('#left').click(function () {view.panleft(); view.calc_interval(6000); load();});
$('.graph-time').click(function () {view.timewindow($(this).attr("time")); view.calc_interval(6000); load();});

$("#simulate").click(function(){
  simulate();
});

$graph.bind("plotselected", function (event, ranges)
{
    view.start = ranges.xaxis.from;
    view.end = ranges.xaxis.to;
    view.calc_interval()
    load();
});

$("#add-element").click(function(){
  if (segment.length) { 
    segment.push(JSON.parse(JSON.stringify(segment[segment.length-1])));
    draw_segment_config();
    simulate();
  }
});

$("#remove-element").click(function(){
  if (segment.length>1) {
    segment.splice(segment.length-1,1);
    draw_segment_config();
    simulate();
  }
});

$("#other_feeds_ok").click(function(){

  var str = $("#other_feeds").val();
  var arr = str.split(",");
  
  settings.other_feeds = [];
  
  for (var z in arr) {
    for (var i in feeds) {
      if (feeds[i].id == arr[z]) {
        settings.other_feeds.push(arr[z]);
      }
    }
  }
  $("#other_feeds").val(settings.other_feeds.join(","));
  simulate();
});

$("#solar_ok").click(function(){
  settings.solarfactor = parseFloat($("#solar_scale").val());
  settings.solaroffset = parseFloat($("#solar_offset").val());
  simulate();
});

$("#metabolic_ok").click(function(){
  settings.metabolic = parseFloat($("#metabolic").val());
  simulate();
});

$(".feed_selector").change(function(){
  var name = $(this).attr("name");
  settings[name] = $(this).val();
  data[name] = feed.getdata(settings[name],view.start,view.end,view.interval);
  simulate();
});

$("#save").click(function(){
  for (i in segment) 
  {
    segment[i].u = $("#u"+i).val()*1;
    segment[i].k = $("#k"+i).val()*1;
    segment[i].T = $("#t"+i).val()*1;
  }
  
  settings.start = view.start
  settings.end = view.end
  localStorage.setItem("dynamicmodel",JSON.stringify(settings));
});

$("#auto_temp").click(function(){
  for (var i=0; i<segment.length; i++) {
      let segment_temp = initial_internal_temp * (1.0 - (0.11*(segment.length-1-i)))
      $("#t"+i).val((segment_temp).toFixed(1));
  }
  simulate();
});

// ----------------------------------------------------------------------------------
// Misc fn
// ----------------------------------------------------------------------------------
function draw_feed_selector(selected_feed) {
    var out = ""; var selected = "";
    for (var n in nodes) {
      out += "<optgroup label='"+n+"'>";
      for (var f in nodes[n]) {
          if (nodes[n][f]['id']==selected_feed) selected = 'selected'; else selected = '';
          out += "<option value="+nodes[n][f]['id']+" "+selected+">"+nodes[n][f].name+"</option>";
      }
      out += "</optgroup>";
    }   
    return out;
}

function draw_segment_config()
{
    var segment_config_html = "";
    for (var i in segment) 
    {
      segment_config_html += "<tr><td>"+i+"</td>";
      segment_config_html += "<td><input id='u"+i+"' type='text' value='"+segment[i].u+"' style='width:100px' / ></td>";
      segment_config_html += "<td><input id='k"+i+"' type='text' value='"+segment[i].k+"' style='width:100px' / > kWh/K</td>";
      segment_config_html += "<td><input id='t"+i+"' type='text' value='"+segment[i].T+"' style='width:100px' / ></td></tr>";
    }

    $(".numofsegments").html(segment.length-1);
    $("#segment_config").html(segment_config_html);
}
