$(document).ready(function () {
  $('.event-name-description').click(function () {
    $(this).parent().find('.event-accepts').toggle();
  });
  $('.show-all').click(function () {
    $('.event-accepts').show();
  });
  $('.hide-all').click(function () {
    $('.event-accepts').hide();
  });
})
