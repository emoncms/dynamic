
var dynamic = {

  'get':function(building)
  {
    var result = {};
    $.ajax({ url: path+"dynamic/get.json", dataType: 'json', data: "building="+building, async: false, success: function(data) {result = data;} });
    return result;
  },

  'save':function(building,data)
  {
    var result = {};
    $.ajax({ url: path+"dynamic/save.json", data: "building="+building+"&data="+JSON.stringify(data), async: true, success: function(data){result = data;} });
    return result;
  },
}
