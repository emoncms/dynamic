
var dynamic = {

  'get':function()
  {
    var result = {};
    $.ajax({ url: path+"dynamic/get.json", dataType: 'json', async: false, success: function(data) {result = data;} });
    return result;
  },

  'save':function(data)
  {
    var result = {};
    $.ajax({ url: path+"dynamic/save.json", data: "data="+JSON.stringify(data), async: true, success: function(data){result = data;} });
    return result;
  },
}
