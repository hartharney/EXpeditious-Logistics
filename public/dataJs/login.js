"use strict";

$("#login-form").on("submit", function (event) {
  var parametros = $(this).serialize();
  $("#loader").show();
  $.ajax({
    type: "POST",
    url: "./ajax/login_form_ajax.php",
    data: parametros,
    beforeSend: function (objeto) {
      $("#resultados_ajax").html(
        "<img src='assets/images/loader.gif'/><br/>Wait a moment please..."
      );
    },
    success: function (datos) {
      $("#resultados_ajax").html(datos);

      $("html, body").animate(
        {
          scrollTop: 0,
        },
        600
      );
    },
  });
  event.preventDefault();
});
