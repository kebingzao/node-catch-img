$(function(){
  if(document.getElementById("cc")){
    var blob = new Blob([document.getElementById("cc").outerHTML], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8"
    });

    saveAs(blob,  $(".data-title").text() + "_" +$(".data-time").text() + ".xls");
  }
})