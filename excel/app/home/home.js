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
    $btn.css('background-color', 'green').addClass('ok');
    if ($('.select-range button.ok').length == 1) $('#sync button').removeAttr('disabled');

    Excel.run(function (ctx) {
      var selectedRange = ctx.workbook.getSelectedRange().load();
      return ctx.sync().then(function() {
        $btn.next().removeClass('hdn').text(selectedRange.address);
      });
    }).catch(function(error) {
      console.log("Error: " + error);
    });

  });

  $('#sync button').click(function(){
    setTimeout(function(){
      $('#sync button').next().removeClass('hdn');
    },1000);

  })

})