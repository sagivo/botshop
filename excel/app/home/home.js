(function(){
  'use strict';

  // The initialize function must be run each time a new page is loaded
  Office.initialize = function(reason){
    jQuery(document).ready(function(){
      app.initialize();
      jQuery('#get-data-from-selection').click(getDataFromSelection);
    });
  };



  // Reads data from current document selection and displays a notification
  function getDataFromSelection(){
    Office.context.document.getSelectedDataAsync(Office.CoercionType.Text,
      function(result){
        if (result.status === Office.AsyncResultStatus.Succeeded) {
          app.showNotification('The selected text is:', '"' + result.value + '"');
        } else {
          app.showNotification('Error:', result.error.message);
        }
      }
    );
  }

})();

$(function(){

  $('.select-range button').click(function(){
    $btn = $(this);
    $('#sync button').removeAttr('disabled');

    Excel.run(function (ctx) {
      var selectedRange = ctx.workbook.getSelectedRange().load();
      return ctx.sync().then(function() {
        $btn.addClass('hdn').next().removeClass('hdn').text('Range: ' + selectedRange.address);
      });
    }).catch(function(error) {
      console.log("Error: " + error);
    });

  });

  $('#sync button').click(function(){
    $(this).addClass('hdn').next().removeClass('hdn');
    setTimeout(function(){
      window.location = 'show.html'
    }, 2000);

  })

})